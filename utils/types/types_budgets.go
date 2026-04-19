package types

import (
	"time"

	"github.com/shopspring/decimal"
	"github.com/uptrace/bun"
)

// Budget represents a spending budget for a category over a time period.
type Budget struct {
	bun.BaseModel `bun:"table:budgets,alias:b"`

	ID         int64           `json:"id" bun:"id,pk,autoincrement"`
	AccountID  int64           `json:"account_id" bun:"account_id,notnull"`
	CategoryID int64           `json:"category_id" bun:"category_id,notnull"`
	Name       string          `json:"name" bun:"name,notnull"`
	Amount     decimal.Decimal `json:"amount" bun:"amount,notnull,type:numeric(12,2)"`
	Period     string          `json:"period" bun:"period,notnull"` // "monthly", "weekly", "yearly"
	StartDate  time.Time       `json:"start_date" bun:"start_date,notnull"`
	EndDate    *time.Time      `json:"end_date,omitempty" bun:"end_date"`

	Account      *Account       `json:"account,omitempty" bun:"rel:belongs-to,join:account_id=id"`
	Category     *Category      `json:"category,omitempty" bun:"rel:belongs-to,join:category_id=id"`
	Transactions []*Transaction `json:"transactions,omitempty" bun:"rel:has-many,join:id=budget_id"`

	// Computed fields (not stored in DB)
	Spent     *decimal.Decimal `json:"spent,omitempty" bun:"-"`
	Remaining *decimal.Decimal `json:"remaining,omitempty" bun:"-"`

	Timestamps
}
