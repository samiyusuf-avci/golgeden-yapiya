package services

import (
	"testing"

	"golgeden-yapiya/backend/internal/models"
)

func TestCalculateProjectMetrics(t *testing.T) {
	svc := NewProgressService()

	project := &models.Project{
		ID:          "p1",
		TotalBudget: 1000000,
		Stages: []models.Stage{
			{ID: "s1", Name: "Temel Kazı", WeightPercentage: 20, IsCompleted: true},
			{ID: "s2", Name: "Betonarme", WeightPercentage: 30, IsCompleted: true},
			{ID: "s3", Name: "Duvar Örme", WeightPercentage: 25, IsCompleted: false},
			{ID: "s4", Name: "Tesisat & İnce İşler", WeightPercentage: 25, IsCompleted: false},
		},
		Expenses: []models.Expense{
			{ID: "e1", Amount: 200000},
			{ID: "e2", Amount: 150000},
		},
	}

	svc.CalculateProjectMetrics(project)

	// Physical Progress: (20 + 30) / (20 + 30 + 25 + 25) * 100 = 50.0%
	if project.PhysicalProgress != 50.0 {
		t.Errorf("expected physical progress 50.0, got %f", project.PhysicalProgress)
	}

	// Total Expenses = 350000
	if project.TotalActualCost != 350000 {
		t.Errorf("expected total actual cost 350000, got %f", project.TotalActualCost)
	}

	// Cost Variance = 1000000 - 350000 = 650000
	if project.CostVariance != 650000 {
		t.Errorf("expected cost variance 650000, got %f", project.CostVariance)
	}

	// Financial Progress = (350000 / 1000000) * 100 = 35.0%
	if project.FinancialProgress != 35.0 {
		t.Errorf("expected financial progress 35.0, got %f", project.FinancialProgress)
	}
}

func TestSanitizeForRoleClientHidden(t *testing.T) {
	svc := NewProgressService()

	project := &models.Project{
		ID:                      "p1",
		TotalBudget:             5000000,
		ShowFinancialsToClients: false,
		Expenses: []models.Expense{
			{ID: "e1", Amount: 1200000},
		},
		Stages: []models.Stage{
			{ID: "s1", Name: "Temel", EstimatedCost: 1000000, ActualCost: 950000},
		},
	}

	svc.CalculateProjectMetrics(project)
	svc.SanitizeForRole(project, models.RoleClient)

	if project.TotalBudget != 0 {
		t.Errorf("client role should have TotalBudget masked to 0, got %f", project.TotalBudget)
	}
	if project.TotalActualCost != 0 {
		t.Errorf("client role should have TotalActualCost masked to 0, got %f", project.TotalActualCost)
	}
	if len(project.Expenses) != 0 {
		t.Errorf("client role should have empty expenses list when hidden, got %d items", len(project.Expenses))
	}
	if project.Stages[0].EstimatedCost != 0 {
		t.Errorf("client role stage estimated cost should be 0, got %f", project.Stages[0].EstimatedCost)
	}
}

func TestSanitizeForRoleClientVisible(t *testing.T) {
	svc := NewProgressService()

	project := &models.Project{
		ID:                      "p1",
		TotalBudget:             5000000,
		ShowFinancialsToClients: true,
		Expenses: []models.Expense{
			{ID: "e1", Amount: 1200000},
		},
	}

	svc.CalculateProjectMetrics(project)
	svc.SanitizeForRole(project, models.RoleClient)

	if project.TotalBudget != 5000000 {
		t.Errorf("client role should see TotalBudget when allowed, got %f", project.TotalBudget)
	}
	if len(project.Expenses) != 1 {
		t.Errorf("client role should see expenses when allowed, got %d", len(project.Expenses))
	}
}
