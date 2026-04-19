package types

import (
	"time"

	"github.com/shopspring/decimal"
	"github.com/uptrace/bun"
)

// SavingsGoal represents a financial savings goal
type SavingsGoal struct {
	bun.BaseModel `bun:"table:savings_goals,alias:sg"`

	ID          int64           `json:"id" bun:"id,pk,autoincrement"`
	AccountID   int64           `json:"account_id" bun:"account_id,notnull"`
	Name        string          `json:"name" bun:"name,notnull"`
	Description *string         `json:"description,omitempty" bun:"description"`
	TargetAmount decimal.Decimal `json:"target_amount" bun:"target_amount,notnull,type:numeric(12,2)"`
	CurrentAmount decimal.Decimal `json:"current_amount" bun:"current_amount,notnull,type:numeric(12,2)"`
	TargetDate  *time.Time      `json:"target_date,omitempty" bun:"target_date"`
	Category    string          `json:"category" bun:"category"` // "emergency", "vacation", "purchase", "investment", "other"
	Priority    int             `json:"priority" bun:"priority"` // 1-5, 1 being highest
	IsActive    bool            `json:"is_active" bun:"is_active,notnull,default:true"`

	Account *Account `json:"account,omitempty" bun:"rel:belongs-to,join:account_id=id"`

	// Computed fields
	ProgressPercentage decimal.Decimal `json:"progress_percentage" bun:"-"`
	RemainingAmount    decimal.Decimal `json:"remaining_amount" bun:"-"`
	MonthlyRequired    decimal.Decimal `json:"monthly_required" bun:"-"`

	Timestamps
}

// GoalContribution represents a contribution towards a savings goal
type GoalContribution struct {
	bun.BaseModel `bun:"table:goal_contributions,alias:gc"`

	ID         int64           `json:"id" bun:"id,pk,autoincrement"`
	GoalID     int64           `json:"goal_id" bun:"goal_id,notnull"`
	AccountID  int64           `json:"account_id" bun:"account_id,notnull"`
	Amount     decimal.Decimal `json:"amount" bun:"amount,notnull,type:numeric(12,2)"`
	Date       time.Time       `json:"date" bun:"date,notnull"`
	Notes      *string         `json:"notes,omitempty" bun:"notes"`
	Source     string          `json:"source" bun:"source"` // "manual", "automatic", "savings_pot"

	Goal *SavingsGoal `json:"goal,omitempty" bun:"rel:belongs-to,join:goal_id=id"`

	Timestamps
}
