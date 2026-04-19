package types

import (
	"time"

	"github.com/shopspring/decimal"
	"github.com/uptrace/bun"
)

// Transaction represents a financial transaction (income or expense).
type Transaction struct {
	bun.BaseModel `bun:"table:transactions,alias:t"`

	ID          int64           `json:"id" bun:"id,pk,autoincrement"`
	AccountID   int64           `json:"account_id" bun:"account_id,notnull"`
	CategoryID  *int64          `json:"category_id,omitempty" bun:"category_id"`
	BudgetID    *int64          `json:"budget_id,omitempty" bun:"budget_id"`
	Amount      decimal.Decimal `json:"amount" bun:"amount,notnull,type:numeric(12,2)"`
	Type        string          `json:"type" bun:"type,notnull"` // "income" or "expense"
	Description *string         `json:"description,omitempty" bun:"description"`
	Date        time.Time       `json:"date" bun:"date,notnull"`
	Notes       *string         `json:"notes,omitempty" bun:"notes"`
	Tags        *string         `json:"tags,omitempty" bun:"tags"` // JSON array of tags

	Account  *Account  `json:"account,omitempty" bun:"rel:belongs-to,join:account_id=id"`
	Category *Category `json:"category,omitempty" bun:"rel:belongs-to,join:category_id=id"`
	Budget   *Budget   `json:"budget,omitempty" bun:"rel:belongs-to,join:budget_id=id"`

	Timestamps
}
