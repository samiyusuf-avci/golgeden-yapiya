package repository

import (
	"database/sql"
	"fmt"
	"os"
	"path/filepath"

	_ "modernc.org/sqlite"

	"golgeden-yapiya/backend/internal/models"
)

type Repository struct {
	db *sql.DB
}

func NewRepository(dbPath string) (*Repository, error) {
	dir := filepath.Dir(dbPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create db directory: %w", err)
	}

	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	// Enable WAL mode & foreign keys for performance
	if _, err := db.Exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;`); err != nil {
		return nil, fmt.Errorf("failed to set pragma: %w", err)
	}

	repo := &Repository{db: db}
	if err := repo.InitSchema(); err != nil {
		return nil, fmt.Errorf("failed to initialize schema: %w", err)
	}

	return repo, nil
}

func (r *Repository) InitSchema() error {
	schema := `
	CREATE TABLE IF NOT EXISTS users (
		id TEXT PRIMARY KEY,
		email TEXT UNIQUE NOT NULL,
		password_hash TEXT NOT NULL,
		name TEXT NOT NULL,
		role TEXT NOT NULL CHECK (role IN ('contractor', 'client')),
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS projects (
		id TEXT PRIMARY KEY,
		contractor_id TEXT NOT NULL,
		name TEXT NOT NULL,
		location TEXT DEFAULT '',
		total_budget REAL NOT NULL DEFAULT 0,
		visibility TEXT NOT NULL DEFAULT 'private',
		show_financials_to_clients BOOLEAN DEFAULT 0,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (contractor_id) REFERENCES users(id) ON DELETE CASCADE
	);

	CREATE TABLE IF NOT EXISTS project_collaborators (
		id TEXT PRIMARY KEY,
		project_id TEXT NOT NULL,
		user_id TEXT NOT NULL,
		assigned_unit_id TEXT NULL,
		FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
		FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
	);

	CREATE TABLE IF NOT EXISTS building_floors (
		id TEXT PRIMARY KEY,
		project_id TEXT NOT NULL,
		floor_number INTEGER NOT NULL,
		name TEXT DEFAULT '',
		is_completed BOOLEAN DEFAULT 0,
		FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
	);

	CREATE TABLE IF NOT EXISTS units (
		id TEXT PRIMARY KEY,
		floor_id TEXT NOT NULL,
		unit_number INTEGER NOT NULL,
		name TEXT DEFAULT '',
		owner_id TEXT NULL,
		is_completed BOOLEAN DEFAULT 0,
		FOREIGN KEY (floor_id) REFERENCES building_floors(id) ON DELETE CASCADE
	);

	CREATE TABLE IF NOT EXISTS stages (
		id TEXT PRIMARY KEY,
		project_id TEXT NOT NULL,
		floor_id TEXT NULL,
		unit_id TEXT NULL,
		name TEXT NOT NULL,
		category TEXT NOT NULL,
		estimated_cost REAL NOT NULL DEFAULT 0,
		actual_cost REAL NOT NULL DEFAULT 0,
		weight_percentage INTEGER NOT NULL DEFAULT 10,
		is_completed BOOLEAN DEFAULT 0,
		order_index INTEGER NOT NULL DEFAULT 0,
		FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
	);

	CREATE TABLE IF NOT EXISTS expenses (
		id TEXT PRIMARY KEY,
		project_id TEXT NOT NULL,
		stage_id TEXT NULL,
		category TEXT NOT NULL,
		amount REAL NOT NULL,
		invoice_url TEXT DEFAULT '',
		notes TEXT DEFAULT '',
		date TEXT NOT NULL,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
	);
	`
	_, err := r.db.Exec(schema)
	return err
}

// User Methods
func (r *Repository) CreateUser(u *models.User) error {
	_, err := r.db.Exec(
		`INSERT INTO users (id, email, password_hash, name, role) VALUES (?, ?, ?, ?, ?)`,
		u.ID, u.Email, u.PasswordHash, u.Name, string(u.Role),
	)
	return err
}

func (r *Repository) GetUserByEmail(email string) (*models.User, error) {
	row := r.db.QueryRow(`SELECT id, email, password_hash, name, role, created_at FROM users WHERE email = ?`, email)
	var u models.User
	var roleStr string
	err := row.Scan(&u.ID, &u.Email, &u.PasswordHash, &u.Name, &roleStr, &u.CreatedAt)
	if err != nil {
		return nil, err
	}
	u.Role = models.UserRole(roleStr)
	return &u, nil
}

func (r *Repository) GetUserByID(id string) (*models.User, error) {
	row := r.db.QueryRow(`SELECT id, email, password_hash, name, role, created_at FROM users WHERE id = ?`, id)
	var u models.User
	var roleStr string
	err := row.Scan(&u.ID, &u.Email, &u.PasswordHash, &u.Name, &roleStr, &u.CreatedAt)
	if err != nil {
		return nil, err
	}
	u.Role = models.UserRole(roleStr)
	return &u, nil
}

// Project Methods
func (r *Repository) CreateProject(p *models.Project) error {
	_, err := r.db.Exec(
		`INSERT INTO projects (id, contractor_id, name, location, total_budget, visibility, show_financials_to_clients) VALUES (?, ?, ?, ?, ?, ?, ?)`,
		p.ID, p.ContractorID, p.Name, p.Location, p.TotalBudget, string(p.Visibility), p.ShowFinancialsToClients,
	)
	return err
}

func (r *Repository) GetProjectByID(id string) (*models.Project, error) {
	row := r.db.QueryRow(
		`SELECT id, contractor_id, name, location, total_budget, visibility, show_financials_to_clients, created_at FROM projects WHERE id = ?`,
		id,
	)
	var p models.Project
	var visStr string
	err := row.Scan(&p.ID, &p.ContractorID, &p.Name, &p.Location, &p.TotalBudget, &visStr, &p.ShowFinancialsToClients, &p.CreatedAt)
	if err != nil {
		return nil, err
	}
	p.Visibility = models.VisibilityType(visStr)

	// Fetch Floors, Units, Stages, Expenses
	floors, err := r.GetFloorsByProjectID(p.ID)
	if err == nil {
		p.Floors = floors
	}

	stages, err := r.GetProjectLevelStages(p.ID)
	if err == nil {
		p.Stages = stages
	}

	expenses, err := r.GetExpensesByProjectID(p.ID)
	if err == nil {
		p.Expenses = expenses
	}

	return &p, nil
}

func (r *Repository) ListProjects() ([]models.Project, error) {
	rows, err := r.db.Query(`SELECT id, contractor_id, name, location, total_budget, visibility, show_financials_to_clients, created_at FROM projects ORDER BY created_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var projects []models.Project
	for rows.Next() {
		var p models.Project
		var visStr string
		if err := rows.Scan(&p.ID, &p.ContractorID, &p.Name, &p.Location, &p.TotalBudget, &visStr, &p.ShowFinancialsToClients, &p.CreatedAt); err != nil {
			continue
		}
		p.Visibility = models.VisibilityType(visStr)
		projects = append(projects, p)
	}
	return projects, nil
}

func (r *Repository) UpdateProjectVisibility(id string, visibility models.VisibilityType, showFinancials bool) error {
	_, err := r.db.Exec(
		`UPDATE projects SET visibility = ?, show_financials_to_clients = ? WHERE id = ?`,
		string(visibility), showFinancials, id,
	)
	return err
}

func (r *Repository) DeleteProject(id string) error {
	_, err := r.db.Exec(`DELETE FROM projects WHERE id = ?`, id)
	return err
}

// Floor & Unit Methods
func (r *Repository) CreateFloor(f *models.BuildingFloor) error {
	_, err := r.db.Exec(`INSERT INTO building_floors (id, project_id, floor_number, name, is_completed) VALUES (?, ?, ?, ?, ?)`,
		f.ID, f.ProjectID, f.FloorNumber, f.Name, f.IsCompleted)
	return err
}

func (r *Repository) GetFloorsByProjectID(projectID string) ([]models.BuildingFloor, error) {
	rows, err := r.db.Query(`SELECT id, project_id, floor_number, name, is_completed FROM building_floors WHERE project_id = ? ORDER BY floor_number ASC`, projectID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var floors []models.BuildingFloor
	for rows.Next() {
		var f models.BuildingFloor
		if err := rows.Scan(&f.ID, &f.ProjectID, &f.FloorNumber, &f.Name, &f.IsCompleted); err != nil {
			continue
		}
		units, _ := r.GetUnitsByFloorID(f.ID)
		f.Units = units
		stages, _ := r.GetStagesByFloorID(f.ID)
		f.Stages = stages
		floors = append(floors, f)
	}
	return floors, nil
}

func (r *Repository) CreateUnit(u *models.Unit) error {
	_, err := r.db.Exec(`INSERT INTO units (id, floor_id, unit_number, name, owner_id, is_completed) VALUES (?, ?, ?, ?, ?, ?)`,
		u.ID, u.FloorID, u.UnitNumber, u.Name, u.OwnerID, u.IsCompleted)
	return err
}

func (r *Repository) GetUnitsByFloorID(floorID string) ([]models.Unit, error) {
	rows, err := r.db.Query(`SELECT id, floor_id, unit_number, name, owner_id, is_completed FROM units WHERE floor_id = ? ORDER BY unit_number ASC`, floorID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var units []models.Unit
	for rows.Next() {
		var u models.Unit
		if err := rows.Scan(&u.ID, &u.FloorID, &u.UnitNumber, &u.Name, &u.OwnerID, &u.IsCompleted); err != nil {
			continue
		}
		stages, _ := r.GetStagesByUnitID(u.ID)
		u.Stages = stages
		units = append(units, u)
	}
	return units, nil
}

// Stage Methods
func (r *Repository) CreateStage(s *models.Stage) error {
	_, err := r.db.Exec(
		`INSERT INTO stages (id, project_id, floor_id, unit_id, name, category, estimated_cost, actual_cost, weight_percentage, is_completed, order_index)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		s.ID, s.ProjectID, s.FloorID, s.UnitID, s.Name, s.Category, s.EstimatedCost, s.ActualCost, s.WeightPercentage, s.IsCompleted, s.OrderIndex,
	)
	return err
}

func (r *Repository) GetProjectLevelStages(projectID string) ([]models.Stage, error) {
	rows, err := r.db.Query(
		`SELECT id, project_id, floor_id, unit_id, name, category, estimated_cost, actual_cost, weight_percentage, is_completed, order_index FROM stages WHERE project_id = ? AND floor_id IS NULL AND unit_id IS NULL ORDER BY order_index ASC`,
		projectID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return r.scanStages(rows)
}

func (r *Repository) GetStagesByFloorID(floorID string) ([]models.Stage, error) {
	rows, err := r.db.Query(
		`SELECT id, project_id, floor_id, unit_id, name, category, estimated_cost, actual_cost, weight_percentage, is_completed, order_index FROM stages WHERE floor_id = ? AND unit_id IS NULL ORDER BY order_index ASC`,
		floorID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return r.scanStages(rows)
}

func (r *Repository) GetStagesByUnitID(unitID string) ([]models.Stage, error) {
	rows, err := r.db.Query(
		`SELECT id, project_id, floor_id, unit_id, name, category, estimated_cost, actual_cost, weight_percentage, is_completed, order_index FROM stages WHERE unit_id = ? ORDER BY order_index ASC`,
		unitID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return r.scanStages(rows)
}

func (r *Repository) scanStages(rows *sql.Rows) ([]models.Stage, error) {
	var stages []models.Stage
	for rows.Next() {
		var s models.Stage
		if err := rows.Scan(&s.ID, &s.ProjectID, &s.FloorID, &s.UnitID, &s.Name, &s.Category, &s.EstimatedCost, &s.ActualCost, &s.WeightPercentage, &s.IsCompleted, &s.OrderIndex); err != nil {
			continue
		}
		stages = append(stages, s)
	}
	return stages, nil
}

func (r *Repository) UpdateStage(id string, isCompleted *bool, actualCost *float64) error {
	if isCompleted != nil && actualCost != nil {
		_, err := r.db.Exec(`UPDATE stages SET is_completed = ?, actual_cost = ? WHERE id = ?`, *isCompleted, *actualCost, id)
		return err
	} else if isCompleted != nil {
		_, err := r.db.Exec(`UPDATE stages SET is_completed = ? WHERE id = ?`, *isCompleted, id)
		return err
	} else if actualCost != nil {
		_, err := r.db.Exec(`UPDATE stages SET actual_cost = ? WHERE id = ?`, *actualCost, id)
		return err
	}
	return nil
}

// Expense Methods
func (r *Repository) CreateExpense(e *models.Expense) error {
	_, err := r.db.Exec(
		`INSERT INTO expenses (id, project_id, stage_id, category, amount, invoice_url, notes, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
		e.ID, e.ProjectID, e.StageID, string(e.Category), e.Amount, e.InvoiceURL, e.Notes, e.Date,
	)
	return err
}

func (r *Repository) GetExpensesByProjectID(projectID string) ([]models.Expense, error) {
	rows, err := r.db.Query(
		`SELECT id, project_id, stage_id, category, amount, invoice_url, notes, date, created_at FROM expenses WHERE project_id = ? ORDER BY date DESC, created_at DESC`,
		projectID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var expenses []models.Expense
	for rows.Next() {
		var e models.Expense
		var catStr string
		if err := rows.Scan(&e.ID, &e.ProjectID, &e.StageID, &catStr, &e.Amount, &e.InvoiceURL, &e.Notes, &e.Date, &e.CreatedAt); err != nil {
			continue
		}
		e.Category = models.ExpenseCategory(catStr)
		expenses = append(expenses, e)
	}
	return expenses, nil
}
