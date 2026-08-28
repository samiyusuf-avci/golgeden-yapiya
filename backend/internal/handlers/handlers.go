package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"golgeden-yapiya/backend/internal/middleware"
	"golgeden-yapiya/backend/internal/models"
	"golgeden-yapiya/backend/internal/repository"
	"golgeden-yapiya/backend/internal/services"
)

type APIHandler struct {
	repo            *repository.Repository
	progressService *services.ProgressService
}

func NewAPIHandler(repo *repository.Repository, progressService *services.ProgressService) *APIHandler {
	return &APIHandler{
		repo:            repo,
		progressService: progressService,
	}
}

func respondJSON(w http.ResponseWriter, status int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(payload)
}

func respondError(w http.ResponseWriter, status int, message string) {
	respondJSON(w, status, map[string]string{"error": message})
}

// Auth Handlers
func (h *APIHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req models.RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Geçersiz istek içeriği")
		return
	}

	if req.Email == "" || req.Password == "" || req.Name == "" {
		respondError(w, http.StatusBadRequest, "E-posta, şifre ve ad soyad alanları zorunludur")
		return
	}

	if req.Role == "" {
		req.Role = models.RoleContractor
	}

	user := &models.User{
		ID:           uuid.New().String(),
		Email:        req.Email,
		PasswordHash: req.Password, // Simplified for demo/auth
		Name:         req.Name,
		Role:         req.Role,
	}

	if err := h.repo.CreateUser(user); err != nil {
		respondError(w, http.StatusConflict, "Bu e-posta adresiyle kayıtlı bir kullanıcı zaten var")
		return
	}

	token, err := middleware.GenerateToken(user)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Kimlik doğrulama belirteci oluşturulamadı")
		return
	}

	respondJSON(w, http.StatusCreated, models.AuthResponse{
		Token: token,
		User:  *user,
	})
}

func (h *APIHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req models.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Geçersiz istek içeriği")
		return
	}

	user, err := h.repo.GetUserByEmail(req.Email)
	if err != nil || user.PasswordHash != req.Password {
		respondError(w, http.StatusUnauthorized, "Geçersiz e-posta veya şifre")
		return
	}

	token, err := middleware.GenerateToken(user)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Kimlik doğrulama belirteci oluşturulamadı")
		return
	}

	respondJSON(w, http.StatusOK, models.AuthResponse{
		Token: token,
		User:  *user,
	})
}

func (h *APIHandler) Me(w http.ResponseWriter, r *http.Request) {
	userCtx := middleware.GetUserFromContext(r.Context())
	if userCtx == nil || userCtx.ID == "" {
		respondError(w, http.StatusUnauthorized, "Oturum açılmamış veya yetkisiz erişim")
		return
	}

	user, err := h.repo.GetUserByID(userCtx.ID)
	if err != nil {
		respondError(w, http.StatusNotFound, "Kullanıcı bulunamadı")
		return
	}

	respondJSON(w, http.StatusOK, user)
}

// Project Handlers
func (h *APIHandler) ListProjects(w http.ResponseWriter, r *http.Request) {
	userCtx := middleware.GetUserFromContext(r.Context())
	if userCtx == nil || userCtx.ID == "" {
		respondError(w, http.StatusUnauthorized, "Kimlik doğrulaması gerekli")
		return
	}

	projects, err := h.repo.ListProjects(userCtx.ID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Projeler getirilemedi")
		return
	}

	if projects == nil {
		projects = []models.Project{}
	}

	var result []models.Project
	for i := range projects {
		p := &projects[i]

		// Fetch detailed project state for calculation
		fullProject, err := h.repo.GetProjectByID(p.ID)
		if err == nil {
			p = fullProject
		}

		h.progressService.CalculateProjectMetrics(p)

		// All users have full access to their account's projects
		h.progressService.SanitizeForRole(p, models.RoleContractor)
		result = append(result, *p)
	}

	respondJSON(w, http.StatusOK, result)
}

func (h *APIHandler) ListPublicProjects(w http.ResponseWriter, r *http.Request) {
	projects, err := h.repo.ListPublicProjects()
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Açık projeler getirilemedi")
		return
	}

	if projects == nil {
		projects = []models.Project{}
	}

	var result []models.Project
	for i := range projects {
		p := &projects[i]

		fullProject, err := h.repo.GetProjectByID(p.ID)
		if err == nil {
			p = fullProject
		}

		h.progressService.CalculateProjectMetrics(p)
		h.progressService.SanitizeForRole(p, models.RoleContractor)
		result = append(result, *p)
	}

	respondJSON(w, http.StatusOK, result)
}


func (h *APIHandler) CreateProject(w http.ResponseWriter, r *http.Request) {
	userCtx := middleware.GetUserFromContext(r.Context())
	var req models.CreateProjectRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Geçersiz istek içeriği")
		return
	}

	projectID := uuid.New().String()
	contractorID := userCtx.ID
	if contractorID == "" {
		contractorID = "demo-contractor-id"
	}

	if req.Visibility == "" {
		req.Visibility = models.VisibilityPrivate
	}

	floorCount := req.FloorCount
	if floorCount <= 0 {
		floorCount = 4
	}
	unitsPerFloor := req.UnitsPerFloor
	if unitsPerFloor <= 0 {
		unitsPerFloor = 2
	}

	project := &models.Project{
		ID:                      projectID,
		ContractorID:            contractorID,
		Name:                    req.Name,
		Location:                req.Location,
		TotalBudget:             req.TotalBudget,
		Visibility:              req.Visibility,
		ShowFinancialsToClients: req.ShowFinancialsToClients,
		UnitCount:               floorCount * unitsPerFloor,
	}

	if err := h.repo.CreateProject(project); err != nil {
		respondError(w, http.StatusInternalServerError, "Proje oluşturulamadı")
		return
	}

	// Create floors, units & default stages if specified
	if floorCount <= 0 {
		floorCount = 4
	}
	if unitsPerFloor <= 0 {
		unitsPerFloor = 2
	}

	// Project Level Base Stages
	baseStages := []struct {
		Name     string
		Category string
		Weight   int
	}{
		{"Ruhsat ve Proje Onayı", "official", 5},
		{"Temel Kazı ve Hafriyat", "material", 10},
		{"Temel Radye Beton", "material", 15},
		{"Çevre Çiti ve Şantiye Kurulumu", "labor", 5},
	}

	for idx, bs := range baseStages {
		stage := &models.Stage{
			ID:               uuid.New().String(),
			ProjectID:        projectID,
			Name:             bs.Name,
			Category:         bs.Category,
			EstimatedCost:    project.TotalBudget * (float64(bs.Weight) / 100.0),
			WeightPercentage: bs.Weight,
			OrderIndex:       idx + 1,
		}
		_ = h.repo.CreateStage(stage)
	}

	// Create Floors
	for f := 1; f <= floorCount; f++ {
		floorID := uuid.New().String()
		floor := &models.BuildingFloor{
			ID:          floorID,
			ProjectID:   projectID,
			FloorNumber: f,
			Name:        fmt.Sprintf("Kat %d", f),
		}
		_ = h.repo.CreateFloor(floor)

		// Floor Stages
		floorStages := []struct {
			Name     string
			Category string
			Weight   int
		}{
			{fmt.Sprintf("Kat %d - Kolon & Tabliye Betonu", f), "labor", 8},
			{fmt.Sprintf("Kat %d - Dış ve İç Duvar Örme", f), "labor", 6},
		}

		for idx, fs := range floorStages {
			stage := &models.Stage{
				ID:               uuid.New().String(),
				ProjectID:        projectID,
				FloorID:          &floorID,
				Name:             fs.Name,
				Category:         fs.Category,
				EstimatedCost:    (project.TotalBudget * 0.4) / float64(floorCount),
				WeightPercentage: fs.Weight,
				OrderIndex:       idx + 1,
			}
			_ = h.repo.CreateStage(stage)
		}

		// Create Units per floor
		for u := 1; u <= unitsPerFloor; u++ {
			unitNumber := (f * 100) + u
			unitID := uuid.New().String()
			unit := &models.Unit{
				ID:         unitID,
				FloorID:    floorID,
				UnitNumber: unitNumber,
				Name:       fmt.Sprintf("Daire %d", unitNumber),
			}
			_ = h.repo.CreateUnit(unit)

			// Unit Stages
			unitStages := []struct {
				Name     string
				Category string
				Weight   int
			}{
				{fmt.Sprintf("Daire %d - Elektrik ve Su Tesisatı", unitNumber), "subcontractor", 3},
				{fmt.Sprintf("Daire %d - Sıva & Şap İşleri", unitNumber), "labor", 2},
				{fmt.Sprintf("Daire %d - İnce İşler (Seramik, Parke, Boya)", unitNumber), "subcontractor", 4},
			}

			for idx, us := range unitStages {
				stage := &models.Stage{
					ID:               uuid.New().String(),
					ProjectID:        projectID,
					FloorID:          &floorID,
					UnitID:           &unitID,
					Name:             us.Name,
					Category:         us.Category,
					EstimatedCost:    (project.TotalBudget * 0.3) / float64(floorCount*unitsPerFloor),
					WeightPercentage: us.Weight,
					OrderIndex:       idx + 1,
				}
				_ = h.repo.CreateStage(stage)
			}
		}
	}

	fullProject, _ := h.repo.GetProjectByID(projectID)
	h.progressService.CalculateProjectMetrics(fullProject)
	respondJSON(w, http.StatusCreated, fullProject)
}

func (h *APIHandler) GetProjectByID(w http.ResponseWriter, r *http.Request) {
	projectID := chi.URLParam(r, "id")
	userCtx := middleware.GetUserFromContext(r.Context())

	project, err := h.repo.GetProjectByID(projectID)
	if err != nil {
		respondError(w, http.StatusNotFound, "Proje bulunamadı")
		return
	}

	h.progressService.CalculateProjectMetrics(project)

	activeRole := userCtx.Role
	if roleOverride := r.Header.Get("X-Demo-Role"); roleOverride != "" {
		activeRole = models.UserRole(roleOverride)
	}

	h.progressService.SanitizeForRole(project, activeRole)
	respondJSON(w, http.StatusOK, project)
}

func (h *APIHandler) UpdateVisibility(w http.ResponseWriter, r *http.Request) {
	projectID := chi.URLParam(r, "id")
	var req models.UpdateVisibilityRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Geçersiz istek içeriği")
		return
	}

	if err := h.repo.UpdateProjectVisibility(projectID, req.Visibility, req.ShowFinancialsToClients); err != nil {
		respondError(w, http.StatusInternalServerError, "Proje görünürlüğü güncellenemedi")
		return
	}

	project, err := h.repo.GetProjectByID(projectID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Güncellenen proje bilgisi alınamadı")
		return
	}

	h.progressService.CalculateProjectMetrics(project)
	respondJSON(w, http.StatusOK, project)
}

func (h *APIHandler) UpdateProject(w http.ResponseWriter, r *http.Request) {
	projectID := chi.URLParam(r, "id")
	var req struct {
		Name                    *string                `json:"name"`
		Location                *string                `json:"location"`
		TotalBudget             *float64               `json:"total_budget"`
		Visibility              *models.VisibilityType `json:"visibility"`
		ShowFinancialsToClients *bool                  `json:"show_financials_to_clients"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Geçersiz istek içeriği")
		return
	}

	project, err := h.repo.GetProjectByID(projectID)
	if err != nil {
		respondError(w, http.StatusNotFound, "Proje bulunamadı")
		return
	}

	if req.Name != nil {
		project.Name = *req.Name
	}
	if req.Location != nil {
		project.Location = *req.Location
	}
	if req.TotalBudget != nil {
		project.TotalBudget = *req.TotalBudget
	}
	if req.Visibility != nil {
		project.Visibility = *req.Visibility
	}
	if req.ShowFinancialsToClients != nil {
		project.ShowFinancialsToClients = *req.ShowFinancialsToClients
	}

	if err := h.repo.UpdateProject(projectID, project.Name, project.Location, project.TotalBudget, project.Visibility, project.ShowFinancialsToClients); err != nil {
		respondError(w, http.StatusInternalServerError, "Proje güncellenemedi")
		return
	}

	h.progressService.CalculateProjectMetrics(project)
	respondJSON(w, http.StatusOK, project)
}

func (h *APIHandler) DeleteProject(w http.ResponseWriter, r *http.Request) {
	projectID := chi.URLParam(r, "id")
	if projectID == "" {
		respondError(w, http.StatusBadRequest, "Proje kimliği (ID) eksik")
		return
	}

	if err := h.repo.DeleteProject(projectID); err != nil {
		respondError(w, http.StatusInternalServerError, "Proje silinemedi")
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{"message": "Proje başarıyla silindi"})
}

// Stage Handlers
func (h *APIHandler) UpdateStage(w http.ResponseWriter, r *http.Request) {
	stageID := chi.URLParam(r, "id")
	var req models.UpdateStageRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Geçersiz istek içeriği")
		return
	}

	if err := h.repo.UpdateStage(stageID, req.IsCompleted, req.ActualCost); err != nil {
		respondError(w, http.StatusInternalServerError, "Aşama güncellenemedi")
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{"message": "Aşama başarıyla güncellendi"})
}

// Expense Handlers
func (h *APIHandler) CreateExpense(w http.ResponseWriter, r *http.Request) {
	projectID := chi.URLParam(r, "id")
	var req models.CreateExpenseRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Geçersiz istek içeriği")
		return
	}

	if req.Amount <= 0 {
		respondError(w, http.StatusBadRequest, "Gider miktarı sıfırdan büyük olmalıdır")
		return
	}

	expense := &models.Expense{
		ID:         uuid.New().String(),
		ProjectID:  projectID,
		StageID:    req.StageID,
		Category:   req.Category,
		Amount:     req.Amount,
		InvoiceURL: req.InvoiceURL,
		Notes:      req.Notes,
		Date:       req.Date,
	}

	if err := h.repo.CreateExpense(expense); err != nil {
		respondError(w, http.StatusInternalServerError, "Gider kaydı oluşturulamadı")
		return
	}

	respondJSON(w, http.StatusCreated, expense)
}

func (h *APIHandler) ListExpenses(w http.ResponseWriter, r *http.Request) {
	projectID := chi.URLParam(r, "id")
	userCtx := middleware.GetUserFromContext(r.Context())

	project, err := h.repo.GetProjectByID(projectID)
	if err != nil {
		respondError(w, http.StatusNotFound, "Proje bulunamadı")
		return
	}

	activeRole := userCtx.Role
	if roleOverride := r.Header.Get("X-Demo-Role"); roleOverride != "" {
		activeRole = models.UserRole(roleOverride)
	}

	if activeRole == models.RoleClient && !project.ShowFinancialsToClients {
		respondJSON(w, http.StatusOK, []models.Expense{})
		return
	}

	expenses, err := h.repo.GetExpensesByProjectID(projectID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Giderler listelenemedi")
		return
	}

	respondJSON(w, http.StatusOK, expenses)
}

// Seed Demo Data Handler
func (h *APIHandler) SeedDemoProject(w http.ResponseWriter, r *http.Request) {
	// Quick helper to seed a rich sample project "Zümrüt Kule Rezidans"
	contractor := &models.User{
		ID:           "c-demo-1",
		Email:        "müteahhit@golgeden.com",
		PasswordHash: "123456",
		Name:         "Ahmet Yılmaz (Müteahhit)",
		Role:         models.RoleContractor,
	}
	_ = h.repo.CreateUser(contractor)

	client := &models.User{
		ID:           "cl-demo-1",
		Email:        "musteri@golgeden.com",
		PasswordHash: "123456",
		Name:         "Mehmet Kaya (Yatırımcı)",
		Role:         models.RoleClient,
	}
	_ = h.repo.CreateUser(client)

	projectID := "demo-project-zumrut-kule"
	project := &models.Project{
		ID:                      projectID,
		ContractorID:            contractor.ID,
		Name:                    "Zümrüt Kule Rezidans",
		Location:                "Kendi̇k / İstanbul",
		TotalBudget:             15000000,
		Visibility:              models.VisibilityPublic,
		ShowFinancialsToClients: false,
	}
	_ = h.repo.CreateProject(project)

	// Create Base Stages
	stage1 := &models.Stage{ID: "s-1", ProjectID: projectID, Name: "Hafriyat ve Temel Kazısı", Category: "material", EstimatedCost: 1500000, ActualCost: 1420000, WeightPercentage: 15, IsCompleted: true, OrderIndex: 1}
	stage2 := &models.Stage{ID: "s-2", ProjectID: projectID, Name: "Temel Radye Beton ve Yalıtım", Category: "material", EstimatedCost: 2000000, ActualCost: 1980000, WeightPercentage: 20, IsCompleted: true, OrderIndex: 2}
	_ = h.repo.CreateStage(stage1)
	_ = h.repo.CreateStage(stage2)

	// Create 5 Floors
	for f := 1; f <= 5; f++ {
		floorID := fmt.Sprintf("floor-%d", f)
		floorCompleted := f <= 2
		floor := &models.BuildingFloor{
			ID:          floorID,
			ProjectID:   projectID,
			FloorNumber: f,
			Name:        fmt.Sprintf("%d. Kat", f),
			IsCompleted: floorCompleted,
		}
		_ = h.repo.CreateFloor(floor)

		fStage := &models.Stage{
			ID:               fmt.Sprintf("stage-floor-%d", f),
			ProjectID:        projectID,
			FloorID:          &floorID,
			Name:             fmt.Sprintf("%d. Kat Kolon & Betonarme", f),
			Category:         "labor",
			EstimatedCost:    1200000,
			ActualCost:       1150000,
			WeightPercentage: 8,
			IsCompleted:      floorCompleted,
			OrderIndex:       f,
		}
		_ = h.repo.CreateStage(fStage)

		// 2 Units per floor
		for u := 1; u <= 2; u++ {
			unitNum := (f * 100) + u
			unitID := fmt.Sprintf("unit-%d", unitNum)
			unitCompleted := f <= 2 || (f == 3 && u == 1)
			unit := &models.Unit{
				ID:          unitID,
				FloorID:     floorID,
				UnitNumber:  unitNum,
				Name:        fmt.Sprintf("Daire %d (3+1 Lüks)", unitNum),
				IsCompleted: unitCompleted,
			}
			_ = h.repo.CreateUnit(unit)

			uStage := &models.Stage{
				ID:               fmt.Sprintf("stage-unit-%d", unitNum),
				ProjectID:        projectID,
				FloorID:          &floorID,
				UnitID:           &unitID,
				Name:             fmt.Sprintf("Daire %d İnce İnşaat & Tesisat", unitNum),
				Category:         "subcontractor",
				EstimatedCost:    450000,
				ActualCost:       410000,
				WeightPercentage: 3,
				IsCompleted:      unitCompleted,
				OrderIndex:       u,
			}
			_ = h.repo.CreateStage(uStage)
		}
	}

	// Create Sample Expenses
	expenses := []models.Expense{
		{ID: "exp-1", ProjectID: projectID, Category: models.ExpenseMaterial, Amount: 1420000, Notes: "C35 Hazır Beton & Demir Alımı", InvoiceURL: "https://example.com/invoice-001.pdf", Date: "2026-06-15"},
		{ID: "exp-2", ProjectID: projectID, Category: models.ExpenseMaterial, Amount: 1980000, Notes: "Su ve Isı Yalıtım Malzemeleri", InvoiceURL: "https://example.com/invoice-002.pdf", Date: "2026-07-01"},
		{ID: "exp-3", ProjectID: projectID, Category: models.ExpenseLabor, Amount: 850000, Notes: "Kalıp ve Taşeron İşçilik Ödemesi", InvoiceURL: "https://example.com/invoice-003.pdf", Date: "2026-07-20"},
		{ID: "exp-4", ProjectID: projectID, Category: models.ExpenseOfficial, Amount: 320000, Notes: "Belediye Yapı Denetim Harçları", InvoiceURL: "https://example.com/invoice-004.pdf", Date: "2026-08-05"},
	}

	for _, exp := range expenses {
		_ = h.repo.CreateExpense(&exp)
	}

	fullProject, _ := h.repo.GetProjectByID(projectID)
	h.progressService.CalculateProjectMetrics(fullProject)
	respondJSON(w, http.StatusOK, fullProject)
}

func (h *APIHandler) seedUserStarterProject(user *models.User) {
	if user == nil || user.ID == "" {
		return
	}

	projectID := "proj-" + uuid.New().String()[:8]
	projectName := fmt.Sprintf("%s - Proje 1", user.Name)
	if user.Role == models.RoleClient {
		projectName = "Kendi Rezidans Projem"
	}

	project := &models.Project{
		ID:                      projectID,
		ContractorID:            user.ID,
		Name:                    projectName,
		Location:                "Kadıköy / İstanbul",
		TotalBudget:             18500000,
		Visibility:              models.VisibilityPrivate,
		ShowFinancialsToClients: false,
	}
	_ = h.repo.CreateProject(project)

	// Create Base Stages
	stage1 := &models.Stage{ID: "s-1-" + projectID, ProjectID: projectID, Name: "Ruhsat ve Proje Onayı", Category: "official", EstimatedCost: 925000, ActualCost: 925000, WeightPercentage: 10, IsCompleted: true, OrderIndex: 1}
	stage2 := &models.Stage{ID: "s-2-" + projectID, ProjectID: projectID, Name: "Temel Kazı ve Hafriyat", Category: "material", EstimatedCost: 1850000, ActualCost: 1800000, WeightPercentage: 15, IsCompleted: true, OrderIndex: 2}
	stage3 := &models.Stage{ID: "s-3-" + projectID, ProjectID: projectID, Name: "Temel Radye Beton", Category: "material", EstimatedCost: 2775000, ActualCost: 0, WeightPercentage: 20, IsCompleted: false, OrderIndex: 3}
	stage4 := &models.Stage{ID: "s-4-" + projectID, ProjectID: projectID, Name: "Çevre Çiti ve Şantiye Kurulumu", Category: "labor", EstimatedCost: 925000, ActualCost: 900000, WeightPercentage: 5, IsCompleted: true, OrderIndex: 4}

	_ = h.repo.CreateStage(stage1)
	_ = h.repo.CreateStage(stage2)
	_ = h.repo.CreateStage(stage3)
	_ = h.repo.CreateStage(stage4)

	// Create 3 Floors
	for f := 1; f <= 3; f++ {
		floorID := fmt.Sprintf("fl-%s-%d", projectID[:6], f)
		floorCompleted := f == 1
		floor := &models.BuildingFloor{
			ID:          floorID,
			ProjectID:   projectID,
			FloorNumber: f,
			Name:        fmt.Sprintf("%d. Kat", f),
			IsCompleted: floorCompleted,
		}
		_ = h.repo.CreateFloor(floor)

		// 2 Units per floor
		for u := 1; u <= 2; u++ {
			unitNum := (f * 100) + u
			unitID := fmt.Sprintf("un-%s-%d", projectID[:6], unitNum)
			unitCompleted := f == 1
			unit := &models.Unit{
				ID:          unitID,
				FloorID:     floorID,
				UnitNumber:  unitNum,
				Name:        fmt.Sprintf("Daire %d (3+1)", unitNum),
				IsCompleted: unitCompleted,
			}
			_ = h.repo.CreateUnit(unit)
		}
	}

	// Sample expense
	exp := &models.Expense{
		ID:         "exp-" + uuid.New().String()[:8],
		ProjectID:  projectID,
		Category:   models.ExpenseMaterial,
		Amount:     1800000,
		Notes:      "İlk Hafriyat ve Şantiye Hazırlığı",
		InvoiceURL: "https://example.com/invoice.pdf",
		Date:       "2026-08-01",
	}
	_ = h.repo.CreateExpense(exp)
}
