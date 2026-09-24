package recurring

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/CodeNameJuJu/budget_buddy/core/db"
	"github.com/CodeNameJuJu/budget_buddy/core/functions/auth"
	"github.com/CodeNameJuJu/budget_buddy/core/helpers"
	"github.com/CodeNameJuJu/budget_buddy/utils/types"
	"github.com/go-chi/chi/v5"
)

type TriggerRecurringRequest struct {
	Date  string `json:"date,omitempty"`  // Optional YYYY-MM-DD, defaults to today
	Force bool   `json:"force,omitempty"` // Create even if already triggered this period
}

type TriggerRecurringResponse struct {
	Created []types.Transaction          `json:"created"`
	Skipped []types.RecurringTransaction `json:"skipped"` // Already triggered this period
}

// POSTTriggerRecurringTransaction creates this period's transaction for a
// single recurring template.
func POSTTriggerRecurringTransaction(w http.ResponseWriter, r *http.Request) {
	accountID, ok := auth.GetAccountIDFromContext(r)
	if !ok {
		helpers.RespondError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		helpers.RespondError(w, http.StatusBadRequest, "Invalid recurring transaction ID")
		return
	}

	req, err := decodeTriggerRequest(r)
	if err != nil {
		helpers.RespondError(w, http.StatusBadRequest, err.Error())
		return
	}

	items, _, err := db.QueryRecurringTransactions(db.RecurringTransactionFilters{AccountID: accountID, RecurringID: &id})
	if err != nil || len(items) == 0 {
		helpers.RespondError(w, http.StatusNotFound, "Recurring transaction not found")
		return
	}

	result, err := triggerItems(accountID, items, req)
	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Could not create transaction")
		return
	}
	if len(result.Created) == 0 {
		helpers.RespondError(w, http.StatusConflict, "This recurring transaction has already been captured for the current period")
		return
	}

	helpers.RespondData(w, result, len(result.Created))
}

// POSTTriggerBudgetRecurring creates transactions for every active recurring
// template on a budget that has not yet been triggered this period.
func POSTTriggerBudgetRecurring(w http.ResponseWriter, r *http.Request) {
	accountID, ok := auth.GetAccountIDFromContext(r)
	if !ok {
		helpers.RespondError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	budgetID, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		helpers.RespondError(w, http.StatusBadRequest, "Invalid budget ID")
		return
	}

	req, err := decodeTriggerRequest(r)
	if err != nil {
		helpers.RespondError(w, http.StatusBadRequest, err.Error())
		return
	}
	// Triggering a whole budget never duplicates already captured items
	req.Force = false

	items, _, err := db.QueryRecurringTransactions(db.RecurringTransactionFilters{AccountID: accountID, BudgetID: &budgetID, ActiveOnly: true})
	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Could not query recurring transactions")
		return
	}

	result, err := triggerItems(accountID, items, req)
	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Could not create transactions")
		return
	}

	helpers.RespondData(w, result, len(result.Created))
}

func decodeTriggerRequest(r *http.Request) (TriggerRecurringRequest, error) {
	var req TriggerRecurringRequest
	if r.ContentLength == 0 {
		return req, nil
	}
	if err := helpers.DecodeBody(r, &req); err != nil {
		return req, fmt.Errorf("Invalid request body")
	}
	if req.Date != "" {
		if _, err := time.Parse("2006-01-02", req.Date); err != nil {
			return req, fmt.Errorf("date must be in YYYY-MM-DD format")
		}
	}
	return req, nil
}

func triggerItems(accountID int64, items []types.RecurringTransaction, req TriggerRecurringRequest) (TriggerRecurringResponse, error) {
	result := TriggerRecurringResponse{Created: []types.Transaction{}, Skipped: []types.RecurringTransaction{}}

	_, loc := db.GetAccountBillingSettings(accountID)
	timeNow := time.Now().In(loc)
	date := time.Date(timeNow.Year(), timeNow.Month(), timeNow.Day(), 0, 0, 0, 0, time.UTC)
	if req.Date != "" {
		date, _ = time.Parse("2006-01-02", req.Date)
	}

	for i := range items {
		item := items[i]
		if !item.IsActive || (item.TriggeredThisPeriod && !req.Force) {
			result.Skipped = append(result.Skipped, item)
			continue
		}

		budgetID := item.BudgetID
		recurringID := item.ID
		description := item.Description
		transaction := types.Transaction{
			AccountID:              accountID,
			CategoryID:             item.CategoryID,
			BudgetID:               &budgetID,
			RecurringTransactionID: &recurringID,
			Amount:                 item.Amount,
			Type:                   item.Type,
			Description:            &description,
			Date:                   date,
			Notes:                  item.Notes,
		}
		if err := db.InsertTransaction(&transaction); err != nil {
			return result, err
		}
		result.Created = append(result.Created, transaction)
	}

	return result, nil
}
