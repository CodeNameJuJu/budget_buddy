package types

import (
	"time"

	"github.com/shopspring/decimal"
	"github.com/uptrace/bun"
)

// Account represents a user account in the system.
type Account struct {
	bun.BaseModel `bun:"table:accounts,alias:a"`

	ID             int64            `json:"id" bun:"id,pk,autoincrement"`
	Name           string           `json:"name" bun:"name,notnull"`
	Email          string           `json:"email" bun:"email,notnull,unique"`
	Currency       string           `json:"currency" bun:"currency,notnull,default:'ZAR'"`
	Timezone       *string          `json:"timezone,omitempty" bun:"timezone"`
	SavingsBalance *decimal.Decimal `json:"savings_balance,omitempty" bun:"savings_balance,type:numeric(12,2)"`

	Timestamps
}

// DashboardLayout represents a custom dashboard configuration
type DashboardLayout struct {
	bun.BaseModel `bun:"table:dashboard_layouts,alias:dl"`

	ID           int64     `json:"id" bun:"id,pk,autoincrement"`
	AccountID    int64     `json:"account_id" bun:"account_id,notnull"`
	Name         string    `json:"name" bun:"name,notnull"`
	IsActive     bool      `json:"is_active" bun:"is_active,notnull"`
	Layout       string    `json:"layout" bun:"layout,notnull"`
	CreatedDate  time.Time `json:"created_date" bun:"created_date"`
	ModifiedDate time.Time `json:"modified_date" bun:"modified_date"`
}
