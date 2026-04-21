package types

import (
	"github.com/shopspring/decimal"
	"github.com/uptrace/bun"
)

// Account represents a user account in the system.
type Account struct {
	bun.BaseModel `bun:"table:accounts,alias:a"`

	ID             int64            `json:"id" bun:"id,pk,autoincrement"`
	UserID         int64            `json:"user_id" bun:"user_id,notnull"`
	Name           string           `json:"name" bun:"name,notnull"`
	Email          string           `json:"email" bun:"email,notnull,unique"`
	Currency       string           `json:"currency" bun:"currency,notnull,default:'ZAR'"`
	Timezone       *string          `json:"timezone,omitempty" bun:"timezone"`
	SavingsBalance *decimal.Decimal `json:"savings_balance,omitempty" bun:"savings_balance,type:numeric(12,2)"`

	Timestamps
}
