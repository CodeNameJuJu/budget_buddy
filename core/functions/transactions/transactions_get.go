package transactions

import (
	"context"
	"net/http"
	"strconv"
	"time"

	appcontext "github.com/CodeNameJuJu/budget_buddy/core/context"
	"github.com/CodeNameJuJu/budget_buddy/core/db"
	"github.com/CodeNameJuJu/budget_buddy/core/functions/auth"
	"github.com/CodeNameJuJu/budget_buddy/core/helpers"
	"github.com/CodeNameJuJu/budget_buddy/utils/types"
	"github.com/go-chi/chi/v5"
)

func GETTransactions(w http.ResponseWriter, r *http.Request) {
	accountID, ok := auth.GetAccountIDFromContext(r)
	if !ok {
		helpers.RespondError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	filters := db.TransactionFilters{
		AccountID: accountID,
	}

	idStr := chi.URLParam(r, "id")
	if idStr == "" {
		idStr = r.URL.Query().Get("id")
	}
	if idStr != "" {
		id, err := strconv.ParseInt(idStr, 10, 64)
		if err != nil {
			helpers.RespondError(w, http.StatusBadRequest, "Invalid transaction ID")
			return
		}
		filters.TransactionID = &id
	}

	if catStr := r.URL.Query().Get("category_id"); catStr != "" {
		catID, err := strconv.ParseInt(catStr, 10, 64)
		if err != nil {
			helpers.RespondError(w, http.StatusBadRequest, "Invalid category_id")
			return
		}
		filters.CategoryID = &catID
	}

	if budStr := r.URL.Query().Get("budget_id"); budStr != "" {
		budID, err := strconv.ParseInt(budStr, 10, 64)
		if err != nil {
			helpers.RespondError(w, http.StatusBadRequest, "Invalid budget_id")
			return
		}
		filters.BudgetID = &budID
	}

	if t := r.URL.Query().Get("type"); t != "" {
		filters.Type = &t
	}

	// Default to current billing cycle if no date range provided
	dateFromProvided := r.URL.Query().Get("date_from") != ""
	dateToProvided := r.URL.Query().Get("date_to") != ""

	if !dateFromProvided && !dateToProvided {
		// Get account to retrieve billing cycle day
		var account types.Account
		err := appcontext.GetDb().NewSelect().
			Model(&account).
			Where("id = ?", accountID).
			Scan(context.Background())
		if err != nil {
			helpers.RespondError(w, http.StatusInternalServerError, "Could not get account")
			return
		}

		billingCycleDay := 25
		if account.BillingCycleDay != nil && *account.BillingCycleDay > 0 && *account.BillingCycleDay <= 31 {
			billingCycleDay = *account.BillingCycleDay
		}

		now := time.Now()
		var from, to time.Time
		if now.Day() >= billingCycleDay {
			from = time.Date(now.Year(), now.Month(), billingCycleDay, 0, 0, 0, 0, now.Location())
			to = from.AddDate(0, 1, 0).Add(-time.Nanosecond)
		} else {
			from = time.Date(now.Year(), now.Month(), billingCycleDay, 0, 0, 0, 0, now.Location()).AddDate(0, -1, 0)
			to = time.Date(now.Year(), now.Month(), billingCycleDay, 23, 59, 59, 999999999, now.Location()).Add(-time.Nanosecond)
		}
		filters.DateFrom = &from
		filters.DateTo = &to
	} else {
		if fromStr := r.URL.Query().Get("date_from"); fromStr != "" {
			from, err := time.Parse("2006-01-02", fromStr)
			if err != nil {
				helpers.RespondError(w, http.StatusBadRequest, "Invalid date_from format, use YYYY-MM-DD")
				return
			}
			filters.DateFrom = &from
		}

		if toStr := r.URL.Query().Get("date_to"); toStr != "" {
			to, err := time.Parse("2006-01-02", toStr)
			if err != nil {
				helpers.RespondError(w, http.StatusBadRequest, "Invalid date_to format, use YYYY-MM-DD")
				return
			}
			filters.DateTo = &to
		}
	}

	if limitStr := r.URL.Query().Get("limit"); limitStr != "" {
		limit, _ := strconv.Atoi(limitStr)
		filters.Limit = limit
	}

	if offsetStr := r.URL.Query().Get("offset"); offsetStr != "" {
		offset, _ := strconv.Atoi(offsetStr)
		filters.Offset = offset
	}

	transactions, count, err := db.QueryTransactions(filters)
	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Could not query transactions")
		return
	}

	helpers.RespondData(w, transactions, count)
}

func GETTransactionsBySavingsPot(w http.ResponseWriter, r *http.Request) {
	accountID, ok := auth.GetAccountIDFromContext(r)
	if !ok {
		helpers.RespondError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	savingsPotIDStr := r.URL.Query().Get("savings_pot_id")
	if savingsPotIDStr == "" {
		helpers.RespondError(w, http.StatusBadRequest, "savings_pot_id is required")
		return
	}

	savingsPotID, err := strconv.ParseInt(savingsPotIDStr, 10, 64)
	if err != nil {
		helpers.RespondError(w, http.StatusBadRequest, "Invalid savings_pot_id")
		return
	}

	transactions, count, err := db.QueryTransactionsBySavingsPot(accountID, savingsPotID)
	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Could not query transactions")
		return
	}

	helpers.RespondData(w, transactions, count)
}

func GETTransactionsByCreditPot(w http.ResponseWriter, r *http.Request) {
	accountID, ok := auth.GetAccountIDFromContext(r)
	if !ok {
		helpers.RespondError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	creditPotIDStr := r.URL.Query().Get("credit_pot_id")
	if creditPotIDStr == "" {
		helpers.RespondError(w, http.StatusBadRequest, "credit_pot_id is required")
		return
	}

	creditPotID, err := strconv.ParseInt(creditPotIDStr, 10, 64)
	if err != nil {
		helpers.RespondError(w, http.StatusBadRequest, "Invalid credit_pot_id")
		return
	}

	transactions, count, err := db.QueryTransactionsByCreditPot(accountID, creditPotID)
	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Could not query transactions")
		return
	}

	helpers.RespondData(w, transactions, count)
}
