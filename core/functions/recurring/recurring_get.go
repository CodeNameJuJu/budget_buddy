package recurring

import (
	"net/http"
	"strconv"

	"github.com/CodeNameJuJu/budget_buddy/core/db"
	"github.com/CodeNameJuJu/budget_buddy/core/functions/auth"
	"github.com/CodeNameJuJu/budget_buddy/core/helpers"
	"github.com/go-chi/chi/v5"
)

func GETRecurringTransactions(w http.ResponseWriter, r *http.Request) {
	accountID, ok := auth.GetAccountIDFromContext(r)
	if !ok {
		helpers.RespondError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	filters := db.RecurringTransactionFilters{AccountID: accountID}

	idStr := chi.URLParam(r, "id")
	if idStr == "" {
		idStr = r.URL.Query().Get("id")
	}
	if idStr != "" {
		id, err := strconv.ParseInt(idStr, 10, 64)
		if err != nil {
			helpers.RespondError(w, http.StatusBadRequest, "Invalid recurring transaction ID")
			return
		}
		filters.RecurringID = &id
	}

	if budgetStr := r.URL.Query().Get("budget_id"); budgetStr != "" {
		budgetID, err := strconv.ParseInt(budgetStr, 10, 64)
		if err != nil {
			helpers.RespondError(w, http.StatusBadRequest, "Invalid budget_id")
			return
		}
		filters.BudgetID = &budgetID
	}

	filters.ActiveOnly = r.URL.Query().Get("active_only") == "true"

	items, count, err := db.QueryRecurringTransactions(filters)
	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Could not query recurring transactions")
		return
	}

	helpers.RespondData(w, items, count)
}
