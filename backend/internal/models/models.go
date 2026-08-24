package models

import (
	"time"
)

type UserRole string

const (
	RoleContractor UserRole = "contractor"
	RoleClient     UserRole = "client"
)

type VisibilityType string

const (
	VisibilityPrivate   VisibilityType = "private"
	VisibilityProtected VisibilityType = "protected"
	VisibilityPublic    VisibilityType = "public"
)

type ExpenseCategory string

const (
	ExpenseMaterial      ExpenseCategory = "material"
	ExpenseLabor         ExpenseCategory = "labor"
	ExpenseOfficial      ExpenseCategory = "official"
	ExpenseSubcontractor ExpenseCategory = "subcontractor"
)

// User represents system user (Contractor or Client)
type User struct {
	ID           string    `json:"id"`
	Email        string    `json:"email"`
	PasswordHash string    `json:"-"`
	Name         string    `json:"name"`
	Role         UserRole  `json:"role"`
	CreatedAt    time.Time `json:"created_at"`
}

// Project represents construction project
type Project struct {
	ID                      string         `json:"id"`
	ContractorID            string         `json:"contractor_id"`
	Name                    string         `json:"name"`
	Location                string         `json:"location"`
	TotalBudget             float64        `json:"total_budget"`
	Visibility              VisibilityType `json:"visibility"`
	ShowFinancialsToClients bool           `json:"show_financials_to_clients"`
	CreatedAt               time.Time      `json:"created_at"`

	// Derived / Aggregated Metrics
	UnitCount         int     `json:"unit_count,omitempty"`
	PhysicalProgress  float64 `json:"physical_progress"`  // % completed based on stage weights
	FinancialProgress float64 `json:"financial_progress"` // % spent of budget
	TotalActualCost   float64 `json:"total_actual_cost"`  // Sum of expenses
	CostVariance      float64 `json:"cost_variance"`      // TotalBudget - TotalActualCost

	Floors   []BuildingFloor `json:"floors,omitempty"`
	Expenses []Expense       `json:"expenses,omitempty"`
	Stages   []Stage         `json:"stages,omitempty"`
}

// ProjectCollaborator connects clients/investors to projects and specific units
type ProjectCollaborator struct {
	ID             string  `json:"id"`
	ProjectID      string  `json:"project_id"`
	UserID         string  `json:"user_id"`
	AssignedUnitID *string `json:"assigned_unit_id,omitempty"`
	User           *User   `json:"user,omitempty"`
}

// BuildingFloor represents a floor in the building model
type BuildingFloor struct {
	ID          string `json:"id"`
	ProjectID   string `json:"project_id"`
	FloorNumber int    `json:"floor_number"`
	Name        string `json:"name"`
	IsCompleted bool   `json:"is_completed"`

	Units  []Unit  `json:"units,omitempty"`
	Stages []Stage `json:"stages,omitempty"`
}

// Unit represents an apartment/unit on a floor
type Unit struct {
	ID          string  `json:"id"`
	FloorID     string  `json:"floor_id"`
	UnitNumber  int     `json:"unit_number"`
	Name        string  `json:"name"`
	OwnerID     *string `json:"owner_id,omitempty"`
	IsCompleted bool    `json:"is_completed"`

	Stages []Stage `json:"stages,omitempty"`
}

// Stage represents a construction phase (Temel, Kolon, Duvar, Tesisat, İnce İşler)
type Stage struct {
	ID               string   `json:"id"`
	ProjectID        string   `json:"project_id"`
	FloorID          *string  `json:"floor_id,omitempty"`
	UnitID           *string  `json:"unit_id,omitempty"`
	Name             string   `json:"name"`
	Category         string   `json:"category"`
	EstimatedCost    float64  `json:"estimated_cost"`
	ActualCost       float64  `json:"actual_cost"`
	WeightPercentage int      `json:"weight_percentage"`
	IsCompleted      bool     `json:"is_completed"`
	OrderIndex       int      `json:"order_index"`
}

// Expense represents an actual expenditure / invoice
type Expense struct {
	ID         string          `json:"id"`
	ProjectID  string          `json:"project_id"`
	StageID    *string         `json:"stage_id,omitempty"`
	Category   ExpenseCategory `json:"category"`
	Amount     float64         `json:"amount"`
	InvoiceURL string          `json:"invoice_url"`
	Notes      string          `json:"notes"`
	Date       string          `json:"date"` // YYYY-MM-DD
	CreatedAt  time.Time       `json:"created_at"`
}

// DTO Requests & Responses
type RegisterRequest struct {
	Email    string   `json:"email"`
	Password string   `json:"password"`
	Name     string   `json:"name"`
	Role     UserRole `json:"role"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type AuthResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

type UpdateVisibilityRequest struct {
	Visibility              VisibilityType `json:"visibility"`
	ShowFinancialsToClients bool           `json:"show_financials_to_clients"`
}

type UpdateStageRequest struct {
	IsCompleted *bool    `json:"is_completed,omitempty"`
	ActualCost  *float64 `json:"actual_cost,omitempty"`
}

type CreateExpenseRequest struct {
	StageID    *string         `json:"stage_id"`
	Category   ExpenseCategory `json:"category"`
	Amount     float64         `json:"amount"`
	InvoiceURL string          `json:"invoice_url"`
	Notes      string          `json:"notes"`
	Date       string          `json:"date"`
}

type CreateProjectRequest struct {
	Name                    string         `json:"name"`
	Location                string         `json:"location"`
	TotalBudget             float64        `json:"total_budget"`
	Visibility              VisibilityType `json:"visibility"`
	ShowFinancialsToClients bool           `json:"show_financials_to_clients"`
	FloorCount              int            `json:"floor_count"`
	UnitsPerFloor           int            `json:"units_per_floor"`
}
