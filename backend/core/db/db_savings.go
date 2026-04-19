package db

import (
	"context"
	"time"

	appcontext "github.com/julian/budget-buddy/core/context"
	"github.com/julian/budget-buddy/utils/types"
	"github.com/shopspring/decimal"
)

// ====================================================================================================
// region Savings pots
// ====================================================================================================

func QuerySavingsPots(accountID int64, potID *int64) ([]types.SavingsPot, int, error) {
	db := appcontext.GetDb()
	var pots []types.SavingsPot

	query := db.NewSelect().Model(&pots).
		Where("sp.account_id = ?", accountID).
		Where("sp.deleted_date IS NULL").
		Order("sp.name ASC")

	if potID != nil {
		query = query.Where("sp.id = ?", *potID)
	}

	count, err := query.ScanAndCount(context.Background())
	if err != nil {
		return nil, 0, err
	}

	// Calculate allocated total for each pot
	for i := range pots {
		allocated, calcErr := calculatePotAllocated(pots[i].ID, pots[i].AccountID)
		if calcErr != nil {
			continue
		}
		pots[i].Allocated = &allocated
	}

	return pots, count, nil
}

func calculatePotAllocated(potID int64, accountID int64) (decimal.Decimal, error) {
	db := appcontext.GetDb()
	var allocated decimal.Decimal

	err := db.NewSelect().
		Model((*types.SavingsAllocation)(nil)).
		ColumnExpr("COALESCE(SUM(amount), 0)").
		Where("savings_pot_id = ?", potID).
		Where("account_id = ?", accountID).
		Where("deleted_date IS NULL").
		Scan(context.Background(), &allocated)

	return allocated, err
}

func InsertSavingsPot(pot *types.SavingsPot) error {
	db := appcontext.GetDb()
	_, err := db.NewInsert().Model(pot).
		Returning("*").
		Exec(context.Background())
	return err
}

func UpdateSavingsPot(pot *types.SavingsPot) error {
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

func SoftDeleteSavingsPot(id int64) error {
	db := appcontext.GetDb()
	now := time.Now()

	_, err := db.NewUpdate().
		Model((*types.SavingsPot)(nil)).
		Set("deleted_date = ?", now).
		Where("id = ?", id).
		Exec(context.Background())
	return err
}

// endregion

// ====================================================================================================
// region Savings allocations
// ====================================================================================================

func QuerySavingsAllocations(accountID int64, potID *int64) ([]types.SavingsAllocation, int, error) {
	db := appcontext.GetDb()
	var allocations []types.SavingsAllocation

	query := db.NewSelect().Model(&allocations).
		Relation("SavingsPot").
		Where("sa.account_id = ?", accountID).
		Where("sa.deleted_date IS NULL").
		Order("sa.created_date DESC")

	if potID != nil {
		query = query.Where("sa.savings_pot_id = ?", *potID)
	}

	count, err := query.ScanAndCount(context.Background())
	return allocations, count, err
}

func InsertSavingsAllocation(allocation *types.SavingsAllocation) error {
	db := appcontext.GetDb()
	_, err := db.NewInsert().Model(allocation).
		Returning("*").
		Exec(context.Background())
	return err
}

func SoftDeleteSavingsAllocation(id int64) error {
	db := appcontext.GetDb()
	now := time.Now()

	_, err := db.NewUpdate().
		Model((*types.SavingsAllocation)(nil)).
		Set("deleted_date = ?", now).
		Where("id = ?", id).
		Exec(context.Background())
	return err
}

// endregion

// ====================================================================================================
// region Savings summary
// ====================================================================================================

type SavingsSummary struct {
	SavingsBalance *decimal.Decimal   `json:"savings_balance"`
	TotalAllocated decimal.Decimal    `json:"total_allocated"`
	Unallocated    decimal.Decimal    `json:"unallocated"`
	Pots           []types.SavingsPot `json:"pots"`
}

func GetSavingsSummary(accountID int64) (*SavingsSummary, error) {
	db := appcontext.GetDb()

	// Get account savings balance
	var account types.Account
	err := db.NewSelect().Model(&account).
		Where("id = ?", accountID).
		Where("deleted_date IS NULL").
		Scan(context.Background())
	if err != nil {
		return nil, err
	}

	// Get all pots with their allocated amounts
	pots, _, err := QuerySavingsPots(accountID, nil)
	if err != nil {
		return nil, err
	}

	// Sum all allocations across all pots
	var totalAllocated decimal.Decimal
	for _, pot := range pots {
		if pot.Allocated != nil {
			totalAllocated = totalAllocated.Add(*pot.Allocated)
		}
	}

	unallocated := decimal.Zero
	if account.SavingsBalance != nil {
		unallocated = account.SavingsBalance.Sub(totalAllocated)
	}

	return &SavingsSummary{
		SavingsBalance: account.SavingsBalance,
		TotalAllocated: totalAllocated,
		Unallocated:    unallocated,
		Pots:           pots,
	}, nil
}

// endregion
