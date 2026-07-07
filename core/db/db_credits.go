package db

import (
	"context"
	"time"

	appcontext "github.com/CodeNameJuJu/budget_buddy/core/context"
	"github.com/CodeNameJuJu/budget_buddy/utils/types"
	"github.com/shopspring/decimal"
)

// ====================================================================================================
// region Credit pots
// ====================================================================================================

func QueryCreditPots(accountID int64, potID *int64) ([]types.CreditPot, int, error) {
	db := appcontext.GetDb()
	var pots []types.CreditPot

	query := db.NewSelect().Model(&pots).
		Where("cp.account_id = ?", accountID).
		Where("cp.deleted_date IS NULL").
		Order("cp.name ASC")

	if potID != nil {
		query = query.Where("cp.id = ?", *potID)
	}

	count, err := query.ScanAndCount(context.Background())
	if err != nil {
		return nil, 0, err
	}

	// Calculate paid total for each pot
	for i := range pots {
		paid, calcErr := calculatePotPaid(pots[i].ID, pots[i].AccountID)
		if calcErr != nil {
			continue
		}
		pots[i].Paid = &paid
	}

	return pots, count, nil
}

func calculatePotPaid(potID int64, accountID int64) (decimal.Decimal, error) {
	db := appcontext.GetDb()
	var paid decimal.Decimal

	err := db.NewSelect().
		Model((*types.CreditPayment)(nil)).
		ColumnExpr("COALESCE(SUM(amount), 0)").
		Where("credit_pot_id = ?", potID).
		Where("account_id = ?", accountID).
		Where("deleted_date IS NULL").
		Scan(context.Background(), &paid)

	return paid, err
}

func InsertCreditPot(pot *types.CreditPot) error {
	db := appcontext.GetDb()
	_, err := db.NewInsert().Model(pot).
		Returning("*").
		Exec(context.Background())
	return err
}

func UpdateCreditPot(pot *types.CreditPot) error {
	db := appcontext.GetDb()
	now := time.Now()
	pot.ModifiedDate = &now

	_, err := db.NewUpdate().Model(pot).
		WherePK().
		OmitZero().
		Returning("*").
		Exec(context.Background())
	return err
}

func SoftDeleteCreditPotForAccount(id int64, accountID int64) error {
	db := appcontext.GetDb()
	now := time.Now()

	_, err := db.NewUpdate().
		Model((*types.CreditPot)(nil)).
		Set("deleted_date = ?", now).
		Where("id = ?", id).
		Where("account_id = ?", accountID).
		Where("deleted_date IS NULL").
		Exec(context.Background())
	return err
}

// endregion

// ====================================================================================================
// region Credit payments
// ====================================================================================================

func QueryCreditPayments(accountID int64, potID *int64) ([]types.CreditPayment, int, error) {
	db := appcontext.GetDb()
	var payments []types.CreditPayment

	query := db.NewSelect().Model(&payments).
		Relation("CreditPot").
		Where("cp.account_id = ?", accountID).
		Where("cp.deleted_date IS NULL").
		Order("cp.created_date DESC")

	if potID != nil {
		query = query.Where("cp.credit_pot_id = ?", *potID)
	}

	count, err := query.ScanAndCount(context.Background())
	return payments, count, err
}

func InsertCreditPayment(payment *types.CreditPayment) error {
	db := appcontext.GetDb()
	_, err := db.NewInsert().Model(payment).
		Returning("*").
		Exec(context.Background())
	return err
}

func SoftDeleteCreditPaymentForAccount(id int64, accountID int64) error {
	db := appcontext.GetDb()
	now := time.Now()

	_, err := db.NewUpdate().
		Model((*types.CreditPayment)(nil)).
		Set("deleted_date = ?", now).
		Where("id = ?", id).
		Where("account_id = ?", accountID).
		Where("deleted_date IS NULL").
		Exec(context.Background())
	return err
}

// endregion

// ====================================================================================================
// region Credit summary
// ====================================================================================================

type CreditSummary struct {
	TotalPayable decimal.Decimal   `json:"total_payable"`
	TotalPaid    decimal.Decimal   `json:"total_paid"`
	Remaining    decimal.Decimal   `json:"remaining"`
	Pots         []types.CreditPot `json:"pots"`
}

func GetCreditSummary(accountID int64) (*CreditSummary, error) {
	db := appcontext.GetDb()

	// Calculate total payable from all credit pots
	var totalPayable decimal.Decimal
	err := db.NewSelect().
		Model((*types.CreditPot)(nil)).
		ColumnExpr("COALESCE(SUM(total_payable), 0)").
		Where("account_id = ?", accountID).
		Where("deleted_date IS NULL").
		Scan(context.Background(), &totalPayable)
	if err != nil {
		return nil, err
	}

	// Calculate total paid from all credit payments
	var totalPaid decimal.Decimal
	err = db.NewSelect().
		Model((*types.CreditPayment)(nil)).
		ColumnExpr("COALESCE(SUM(amount), 0)").
		Where("account_id = ?", accountID).
		Where("deleted_date IS NULL").
		Scan(context.Background(), &totalPaid)
	if err != nil {
		return nil, err
	}

	// Get all pots with their paid amounts
	pots, _, err := QueryCreditPots(accountID, nil)
	if err != nil {
		return nil, err
	}

	remaining := totalPayable.Sub(totalPaid)

	return &CreditSummary{
		TotalPayable: totalPayable,
		TotalPaid:    totalPaid,
		Remaining:    remaining,
		Pots:         pots,
	}, nil
}

// endregion
