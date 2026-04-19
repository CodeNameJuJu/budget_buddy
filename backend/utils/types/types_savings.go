package types

import (
	"github.com/shopspring/decimal"
	"github.com/uptrace/bun"
)

// SavingsPot represents a named savings category/bucket (e.g. "Emergency fund", "Holiday").
type SavingsPot struct {
	bun.BaseModel `bun:"table:savings_pots,alias:sp"`

	ID                 int64            `json:"id" bun:"id,pk,autoincrement"`
	AccountID          int64            `json:"account_id" bun:"account_id,notnull"`
	Name               string           `json:"name" bun:"name,notnull"`
	Icon               *string          `json:"icon,omitempty" bun:"icon"`
	Colour             *string          `json:"colour,omitempty" bun:"colour"`
	Target             *decimal.Decimal `json:"target,omitempty" bun:"target,type:numeric(12,2)"`
	Contribution       *decimal.Decimal `json:"contribution,omitempty" bun:"contribution,type:numeric(12,2)"`
	ContributionPeriod *string          `json:"contribution_period,omitempty" bun:"contribution_period"`

	Account     *Account             `json:"account,omitempty" bun:"rel:belongs-to,join:account_id=id"`
	Allocations []*SavingsAllocation `json:"allocations,omitempty" bun:"rel:has-many,join:id=savings_pot_id"`

	// Computed field (not stored in DB)
	Allocated *decimal.Decimal `json:"allocated,omitempty" bun:"-"`

	Timestamps
}

// SavingsAllocation represents money moved into or out of a savings pot.
// Positive amount = deposit, negative amount = withdrawal.
type SavingsAllocation struct {
	bun.BaseModel `bun:"table:savings_allocations,alias:sa"`

	ID           int64           `json:"id" bun:"id,pk,autoincrement"`
	AccountID    int64           `json:"account_id" bun:"account_id,notnull"`
	SavingsPotID int64           `json:"savings_pot_id" bun:"savings_pot_id,notnull"`
	Amount       decimal.Decimal `json:"amount" bun:"amount,notnull,type:numeric(12,2)"`
	Notes        *string         `json:"notes,omitempty" bun:"notes"`

	Account    *Account    `json:"account,omitempty" bun:"rel:belongs-to,join:account_id=id"`
	SavingsPot *SavingsPot `json:"savings_pot,omitempty" bun:"rel:belongs-to,join:savings_pot_id=id"`

	Timestamps
}
