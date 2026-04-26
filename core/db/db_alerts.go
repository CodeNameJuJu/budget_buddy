package db

import (
	"context"
	"fmt"
	"time"

	appcontext "github.com/CodeNameJuJu/budget_buddy/core/context"
	"github.com/CodeNameJuJu/budget_buddy/utils/types"
	"github.com/shopspring/decimal"
)

func CreateAlert(alert *types.Alert) error {
	db := appcontext.GetDb()
	_, err := db.NewInsert().Model(alert).
		Returning("*").
		Exec(context.Background())
	return err
}

func GetAlerts(accountID int64, unreadOnly bool, limit int) ([]types.Alert, int, error) {
	db := appcontext.GetDb()
	var alerts []types.Alert

	query := db.NewSelect().Model(&alerts).
		Where("account_id = ?", accountID).
		Order("created_date DESC")

	if unreadOnly {
		query = query.Where("is_read = ?", false)
	}

	if limit > 0 {
		query = query.Limit(limit)
	}

	count, err := query.ScanAndCount(context.Background())
	if err != nil {
		return nil, 0, err
	}

	// Clean up expired alerts
	go cleanupExpiredAlerts(accountID)

	return alerts, count, nil
}

func MarkAlertAsRead(alertID int64) error {
	db := appcontext.GetDb()
	now := time.Now()

	_, err := db.NewUpdate().
		Model((*types.Alert)(nil)).
		Set("is_read = ?", true).
		Set("modified_date = ?", now).
		Where("id = ?", alertID).
		Exec(context.Background())
	return err
}

func MarkAllAlertsAsRead(accountID int64) error {
	db := appcontext.GetDb()
	now := time.Now()

	_, err := db.NewUpdate().
		Model((*types.Alert)(nil)).
		Set("is_read = ?", true).
		Set("modified_date = ?", now).
		Where("account_id = ?", accountID).
		Where("is_read = ?", false).
		Exec(context.Background())
	return err
}

func cleanupExpiredAlerts(accountID int64) {
	dbConn := appcontext.GetDb()
	now := time.Now()

	dbConn.NewDelete().
		Model((*types.Alert)(nil)).
		Where("account_id = ?", accountID).
		Where("expires_at IS NOT NULL").
		Where("expires_at < ?", now).
		Exec(context.Background())
}

// Alert generation functions
func GenerateBudgetThresholdAlerts(accountID int64) error {
	// Get user's alert preferences
	preferences, err := GetAlertPreferences(accountID)
	if err != nil {
		return err
	}

	// Check if budget threshold alerts are enabled
	budgetThresholdPref := getPreferenceByType(preferences, types.AlertBudgetThreshold)
	if budgetThresholdPref == nil || !budgetThresholdPref.Enabled {
		return nil
	}

	// Get active budgets
	budgets, _, err := QueryBudgets(accountID, nil)
	if err != nil {
		return err
	}

	threshold := 70 // Default threshold
	if budgetThresholdPref.Threshold != nil {
		threshold = *budgetThresholdPref.Threshold
	}

	for _, budget := range budgets {
		if budget.StartDate.After(time.Now()) || (budget.EndDate != nil && budget.EndDate.Before(time.Now())) {
			continue // Skip inactive budgets
		}

		if budget.Spent == nil {
			continue
		}

		// Calculate percentage used
		percentage := budget.Spent.Div(budget.Amount).Mul(decimal.NewFromInt(100))
		percentageInt := int(percentage.IntPart())

		// Check if threshold is crossed
		if percentageInt >= threshold {
			// Check if alert already exists for this budget
			exists, err := alertExists(accountID, types.AlertBudgetThreshold, budget.ID)
			if err != nil {
				continue
			}
			if exists {
				continue // Alert already exists
			}

			// Create alert
			severity := types.SeverityWarning
			if percentageInt >= 90 {
				severity = types.SeverityCritical
			}

			alert := &types.Alert{
				AccountID: accountID,
				Type:      types.AlertBudgetThreshold,
				Title:     "Budget Threshold Alert",
				Message: fmt.Sprintf("You've used %d%% of your '%s' budget (%s of %s)",
					percentageInt, budget.Name,
					formatCurrency(budget.Spent.String()),
					formatCurrency(budget.Amount.String())),
				Severity:    severity,
				ReferenceID: &budget.ID,
				ExpiresAt:   timePtr(time.Now().Add(24 * time.Hour)), // Expire in 24 hours
			}

			if err := CreateAlert(alert); err != nil {
				return err
			}
		}
	}

	return nil
}

func GenerateGoalAchievementAlerts(accountID int64) error {
	// Get user's alert preferences
	preferences, err := GetAlertPreferences(accountID)
	if err != nil {
		return err
	}

	// Check if goal achievement alerts are enabled
	goalAchievedPref := getPreferenceByType(preferences, types.AlertGoalAchieved)
	if goalAchievedPref == nil || !goalAchievedPref.Enabled {
		return nil
	}

	// Get active goals
	goals, _, err := QuerySavingsGoals(accountID, nil)
	if err != nil {
		return err
	}

	for _, goal := range goals {
		if !goal.IsActive {
			continue
		}

		// Check if goal is achieved (100%)
		if goal.ProgressPercentage.GreaterThanOrEqual(decimal.NewFromInt(100)) {
			// Check if alert already exists for this goal
			exists, err := alertExists(accountID, types.AlertGoalAchieved, goal.ID)
			if err != nil {
				continue
			}
			if exists {
				continue // Alert already exists
			}

			// Create achievement alert
			alert := &types.Alert{
				AccountID: accountID,
				Type:      types.AlertGoalAchieved,
				Title:     "Goal Achieved! 🎉",
				Message: fmt.Sprintf("Congratulations! You've achieved your '%s' goal by saving %s!",
					goal.Name, formatCurrency(goal.CurrentAmount.String())),
				Severity:    types.SeverityInfo,
				ReferenceID: &goal.ID,
			}

			if err := CreateAlert(alert); err != nil {
				return err
			}
		}
	}

	return nil
}

func GetAlertPreferences(accountID int64) ([]types.AlertPreference, error) {
	db := appcontext.GetDb()
	var preferences []types.AlertPreference

	err := db.NewSelect().Model(&preferences).
		Where("account_id = ?", accountID).
		Scan(context.Background())
	if err != nil {
		return nil, err
	}

	return preferences, nil
}

func UpdateAlertPreference(preference *types.AlertPreference) error {
	db := appcontext.GetDb()
	now := time.Now()
	preference.ModifiedDate = &now

	// Check if preference exists
	var existing types.AlertPreference
	err := db.NewSelect().
		Model(&existing).
		Where("account_id = ?", preference.AccountID).
		Where("type = ?", preference.Type).
		Scan(context.Background())

	if err != nil {
		// Preference doesn't exist, create it
		preference.CreatedDate = &now
		_, err = db.NewInsert().Model(preference).Exec(context.Background())
		return err
	}

	// Preference exists, update it
	preference.ID = existing.ID
	preference.CreatedDate = existing.CreatedDate
	_, err = db.NewUpdate().Model(preference).
		WherePK().
		OmitZero().
		Returning("*").
		Exec(context.Background())
	return err
}

func alertExists(accountID int64, alertType types.AlertType, referenceID int64) (bool, error) {
	dbConn := appcontext.GetDb()
	var count int

	count, err := dbConn.NewSelect().
		Model((*types.Alert)(nil)).
		Where("account_id = ?", accountID).
		Where("type = ?", alertType).
		Where("reference_id = ?", referenceID).
		Where("is_read = ?", false).
		Count(context.Background())

	return count > 0, err
}

func getPreferenceByType(preferences []types.AlertPreference, alertType types.AlertType) *types.AlertPreference {
	for _, pref := range preferences {
		if pref.Type == alertType {
			return &pref
		}
	}
	return nil
}

func timePtr(t time.Time) *time.Time {
	return &t
}

func formatCurrency(amount string) string {
	// Simple formatting for now - could be enhanced
	return "R" + amount
}
