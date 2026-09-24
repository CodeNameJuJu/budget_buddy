package types

import (
	"github.com/shopspring/decimal"
	"github.com/uptrace/bun"
)

// RecurringTransaction is a template for a transaction that repeats every
// budget period. It is triggered manually to create the actual transaction.
type RecurringTransaction struct {
	bun.BaseModel `bun:"table:recurring_transactions,alias:rt"`

	ID          int64           `json:"id" bun:"id,pk,autoincrement"`
	AccountID   int64           `json:"account_id" bun:"account_id,notnull"`
	BudgetID    int64           `json:"budget_id" bun:"budget_id,notnull"`
	CategoryID  *int64          `json:"category_id,omitempty" bun:"category_id"`
	Amount      decimal.Decimal `json:"amount" bun:"amount,notnull,type:numeric(12,2)"`
	Type        string          `json:"type" bun:"type,notnull"` // "income" or "expense"
	Description string          `json:"description" bun:"description,notnull"`
	Notes       *string         `json:"notes,omitempty" bun:"notes"`
	DueDay      *int            `json:"due_day,omitempty" bun:"due_day"` // Day of month the item is usually paid
	IsActive    bool            `json:"is_active" bun:"is_active,notnull,default:true"`

	Budget   *Budget   `json:"budget,omitempty" bun:"rel:belongs-to,join:budget_id=id"`
	Category *Category `json:"category,omitempty" bun:"rel:belongs-to,join:category_id=id"`

	// Computed fields (not stored in DB)
	TriggeredThisPeriod  bool         `json:"triggered_this_period" bun:"-"`
	TriggeredTransaction *Transaction `json:"triggered_transaction,omitempty" bun:"-"`

	Timestamps
}
