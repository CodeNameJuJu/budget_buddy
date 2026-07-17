package types

import (
	"github.com/shopspring/decimal"
	"github.com/uptrace/bun"
)

// CreditPot represents a credit/debt source (e.g. "Credit card", "Personal loan").
type CreditPot struct {
	bun.BaseModel `bun:"table:credit_pots,alias:cp"`

	ID             int64            `json:"id" bun:"id,pk,autoincrement"`
	AccountID      int64            `json:"account_id" bun:"account_id,notnull"`
	Name           string           `json:"name" bun:"name,notnull"`
	Icon           *string          `json:"icon,omitempty" bun:"icon"`
	Colour         *string          `json:"colour,omitempty" bun:"colour"`
	TotalPayable   decimal.Decimal  `json:"total_payable" bun:"total_payable,notnull,type:numeric(12,2)"`
	MonthlyPayment *decimal.Decimal `json:"monthly_payment,omitempty" bun:"monthly_payment,type:numeric(12,2)"`
	PaymentPeriod  *string          `json:"payment_period,omitempty" bun:"payment_period"`
	InterestRate   *decimal.Decimal `json:"interest_rate,omitempty" bun:"interest_rate,type:numeric(5,2)"`
	InterestPeriod *string          `json:"interest_period,omitempty" bun:"interest_period"`

	Account  *Account         `json:"account,omitempty" bun:"rel:belongs-to,join:account_id=id"`
	Payments []*CreditPayment `json:"payments,omitempty" bun:"rel:has-many,join:id=credit_pot_id"`

	// Computed field (not stored in DB)
	Paid *decimal.Decimal `json:"paid,omitempty" bun:"-"`

	Timestamps
}

// CreditPayment represents a payment made towards a credit pot.
type CreditPayment struct {
	bun.BaseModel `bun:"table:credit_payments,alias:cp"`

	ID          int64           `json:"id" bun:"id,pk,autoincrement"`
	AccountID   int64           `json:"account_id" bun:"account_id,notnull"`
	CreditPotID int64           `json:"credit_pot_id" bun:"credit_pot_id,notnull"`
	Amount      decimal.Decimal `json:"amount" bun:"amount,notnull,type:numeric(12,2)"`
	Notes       *string         `json:"notes,omitempty" bun:"notes"`

	Account   *Account   `json:"account,omitempty" bun:"rel:belongs-to,join:account_id=id"`
	CreditPot *CreditPot `json:"credit_pot,omitempty" bun:"rel:belongs-to,join:credit_pot_id=id"`

	Timestamps
}
