package db

import (
	"context"
	"time"

	"github.com/shopspring/decimal"
	appcontext "github.com/CodeNameJuJu/budget_buddy/core/context"
	"github.com/CodeNameJuJu/budget_buddy/utils/types"
)

func QuerySavingsGoals(accountID int64, goalID *int64) ([]types.SavingsGoal, int, error) {
	db := appcontext.GetDb()
	var goals []types.SavingsGoal

	query := db.NewSelect().Model(&goals).
		Relation("Account").
		Where("sg.account_id = ?", accountID).
		Where("sg.deleted_date IS NULL").
		Order("sg.priority ASC, sg.name ASC")

	if goalID != nil {
		query = query.Where("sg.id = ?", *goalID)
	}

	count, err := query.ScanAndCount(context.Background())
	if err != nil {
		return nil, 0, err
	}

	// Calculate computed fields for each goal
	now := time.Now()
	for i := range goals {
		goal := &goals[i]
		
		// Calculate progress percentage
		if goal.TargetAmount.GreaterThan(decimal.Zero) {
			goal.ProgressPercentage = goal.CurrentAmount.Div(goal.TargetAmount).Mul(decimal.NewFromInt(100))
			if goal.ProgressPercentage.GreaterThan(decimal.NewFromInt(100)) {
				goal.ProgressPercentage = decimal.NewFromInt(100)
			}
		} else {
			goal.ProgressPercentage = decimal.Zero
		}

		// Calculate remaining amount
		goal.RemainingAmount = goal.TargetAmount.Sub(goal.CurrentAmount)
		if goal.RemainingAmount.LessThan(decimal.Zero) {
			goal.RemainingAmount = decimal.Zero
		}

		// Calculate monthly required amount
		if goal.TargetDate != nil && goal.TargetDate.After(now) {
			monthsUntilTarget := int(goal.TargetDate.Sub(now).Hours() / 24 / 30)
			if monthsUntilTarget > 0 {
				goal.MonthlyRequired = goal.RemainingAmount.Div(decimal.NewFromInt(int64(monthsUntilTarget)))
			} else {
				goal.MonthlyRequired = goal.RemainingAmount
			}
		} else {
			goal.MonthlyRequired = decimal.Zero
		}
	}

	return goals, count, nil
}

func QueryGoalContributions(accountID int64, goalID *int64) ([]types.GoalContribution, int, error) {
	db := appcontext.GetDb()
	var contributions []types.GoalContribution

	query := db.NewSelect().Model(&contributions).
		Relation("Goal").
		Where("gc.account_id = ?", accountID).
		Where("gc.deleted_date IS NULL").
		Order("gc.date DESC")

	if goalID != nil {
		query = query.Where("gc.goal_id = ?", *goalID)
	}

	count, err := query.ScanAndCount(context.Background())
	if err != nil {
		return nil, 0, err
	}

	return contributions, count, nil
}

func InsertSavingsGoal(goal *types.SavingsGoal) error {
	db := appcontext.GetDb()
	_, err := db.NewInsert().Model(goal).
		Returning("*").
		Exec(context.Background())
	return err
}

func UpdateSavingsGoal(goal *types.SavingsGoal) error {
	db := appcontext.GetDb()
	now := time.Now()
	goal.ModifiedDate = &now

	_, err := db.NewUpdate().Model(goal).
		WherePK().
		OmitZero().
		Returning("*").
		Exec(context.Background())
	return err
}

func SoftDeleteSavingsGoal(id int64) error {
	db := appcontext.GetDb()
	now := time.Now()

	_, err := db.NewUpdate().
		Model((*types.SavingsGoal)(nil)).
		Set("deleted_date = ?", now).
		Where("id = ?", id).
		Exec(context.Background())
	return err
}

func InsertGoalContribution(contribution *types.GoalContribution) error {
	db := appcontext.GetDb()
	_, err := db.NewInsert().Model(contribution).
		Returning("*").
		Exec(context.Background())
	if err != nil {
		return err
	}

	// Update the goal's current amount
	return UpdateGoalCurrentAmount(contribution.GoalID, contribution.AccountID, contribution.Amount)
}

func UpdateGoalCurrentAmount(goalID int64, accountID int64, additionalAmount decimal.Decimal) error {
	db := appcontext.GetDb()
	
	_, err := db.NewUpdate().
		Model((*types.SavingsGoal)(nil)).
		Set("current_amount = current_amount + ?", additionalAmount).
		Where("id = ?", goalID).
		Where("account_id = ?", accountID).
		Exec(context.Background())
	
	return err
}

func SoftDeleteGoalContribution(id int64) error {
	db := appcontext.GetDb()
	now := time.Now()

	// Get the contribution to subtract from goal
	var contribution types.GoalContribution
	err := db.NewSelect().
		Model(&contribution).
		Where("id = ?", id).
		Where("deleted_date IS NULL").
		Scan(context.Background())
	if err != nil {
		return err
	}

	// Soft delete the contribution
	_, err = db.NewUpdate().
		Model((*types.GoalContribution)(nil)).
		Set("deleted_date = ?", now).
		Where("id = ?", id).
		Exec(context.Background())
	if err != nil {
		return err
	}

	// Subtract the amount from the goal
	return UpdateGoalCurrentAmount(contribution.GoalID, contribution.AccountID, contribution.Amount.Neg())
}

func GetGoalsSummary(accountID int64) (map[string]int, error) {
	db := appcontext.GetDb()
	
	// Get goal counts by category
	type CategoryCount struct {
		Category string `bun:"category"`
		Count    int    `bun:"count"`
	}
	
	var categoryCounts []CategoryCount
	err := db.NewSelect().
		ColumnExpr("category, COUNT(*) as count").
		Model((*types.SavingsGoal)(nil)).
		Where("account_id = ?", accountID).
		Where("deleted_date IS NULL").
		Where("is_active = ?", true).
		Group("category").
		Scan(context.Background(), &categoryCounts)
	if err != nil {
		return nil, err
	}

	summary := make(map[string]int)
	for _, cc := range categoryCounts {
		summary[cc.Category] = cc.Count
	}

	return summary, nil
}
