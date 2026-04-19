package types

import "github.com/uptrace/bun"

// Category represents a transaction category (e.g. Groceries, Rent, Salary).
type Category struct {
	bun.BaseModel `bun:"table:categories,alias:cat"`

	ID        int64   `json:"id" bun:"id,pk,autoincrement"`
	AccountID int64   `json:"account_id" bun:"account_id,notnull"`
	Name      string  `json:"name" bun:"name,notnull"`
	Icon      *string `json:"icon,omitempty" bun:"icon"`
	Colour    *string `json:"colour,omitempty" bun:"colour"`
	Type      string  `json:"type" bun:"type,notnull"` // "income" or "expense"

	Account *Account `json:"account,omitempty" bun:"rel:belongs-to,join:account_id=id"`

	Timestamps
}
