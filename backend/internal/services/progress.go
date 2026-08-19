package services

import (
	"math"

	"golgeden-yapiya/backend/internal/models"
)

type ProgressService struct{}

func NewProgressService() *ProgressService {
	return &ProgressService{}
}

// CalculateProjectMetrics computes physical progress, financial progress, and cost variance
func (s *ProgressService) CalculateProjectMetrics(project *models.Project) {
	if project == nil {
		return
	}

	// 1. Physical Progress Calculation (%)
	var totalWeight int = 0
	var completedWeight int = 0

	// Aggregate from project level stages
	for _, stage := range project.Stages {
		totalWeight += stage.WeightPercentage
		if stage.IsCompleted {
			completedWeight += stage.WeightPercentage
		}
	}

	// Aggregate from floor/unit stages
	for i := range project.Floors {
		floor := &project.Floors[i]
		var floorCompletedCount int = 0
		var floorTotalStages int = len(floor.Stages)

		for _, stage := range floor.Stages {
			totalWeight += stage.WeightPercentage
			if stage.IsCompleted {
				completedWeight += stage.WeightPercentage
				floorCompletedCount++
			}
		}

		for j := range floor.Units {
			unit := &floor.Units[j]
			var unitCompletedCount int = 0
			var unitTotalStages int = len(unit.Stages)

			for _, stage := range unit.Stages {
				totalWeight += stage.WeightPercentage
				if stage.IsCompleted {
					completedWeight += stage.WeightPercentage
					unitCompletedCount++
				}
			}

			// Automatically update unit completed state if all unit stages are done
			if unitTotalStages > 0 && unitCompletedCount == unitTotalStages {
				unit.IsCompleted = true
			}
		}

		// Automatically update floor completed state if all floor stages and units are completed
		if floorTotalStages > 0 && floorCompletedCount == floorTotalStages {
			floor.IsCompleted = true
		}
	}

	// 1b. Calculate Unit Count dynamically if not set
	var calculatedUnits int = 0
	for _, floor := range project.Floors {
		calculatedUnits += len(floor.Units)
	}
	if calculatedUnits > 0 {
		project.UnitCount = calculatedUnits
	}

	if totalWeight > 0 {
		project.PhysicalProgress = math.Round((float64(completedWeight)/float64(totalWeight))*1000) / 10
	} else {
		project.PhysicalProgress = 0
	}

	// 2. Financial Metrics Calculation
	var totalExpenses float64 = 0
	for _, exp := range project.Expenses {
		totalExpenses += exp.Amount
	}

	project.TotalActualCost = totalExpenses
	project.CostVariance = project.TotalBudget - totalExpenses

	if project.TotalBudget > 0 {
		project.FinancialProgress = math.Round((totalExpenses/project.TotalBudget)*1000) / 10
	} else {
		project.FinancialProgress = 0
	}
}

// SanitizeForRole applies privacy protection for Client role if financial visibility is disabled
func (s *ProgressService) SanitizeForRole(project *models.Project, role models.UserRole) {
	if project == nil {
		return
	}

	if role == models.RoleClient && !project.ShowFinancialsToClients {
		project.TotalBudget = 0
		project.FinancialProgress = 0
		project.TotalActualCost = 0
		project.CostVariance = 0
		project.Expenses = []models.Expense{}

		// Mask estimated and actual costs in stages
		for i := range project.Stages {
			project.Stages[i].EstimatedCost = 0
			project.Stages[i].ActualCost = 0
		}
		for i := range project.Floors {
			for j := range project.Floors[i].Stages {
				project.Floors[i].Stages[j].EstimatedCost = 0
				project.Floors[i].Stages[j].ActualCost = 0
			}
			for u := range project.Floors[i].Units {
				for k := range project.Floors[i].Units[u].Stages {
					project.Floors[i].Units[u].Stages[k].EstimatedCost = 0
					project.Floors[i].Units[u].Stages[k].ActualCost = 0
				}
			}
		}
	}
}
