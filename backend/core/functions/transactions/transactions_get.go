package transactions

import (
	"net/http"
	"strconv"
	"time"

	"github.com/julian/budget-buddy/core/db"
	"github.com/julian/budget-buddy/core/helpers"
)

func GETTransactions(w http.ResponseWriter, r *http.Request) {
	accountIDStr := r.URL.Query().Get("account_id")
	if accountIDStr == "" {
		helpers.RespondError(w, http.StatusBadRequest, "account_id is required")
		return
	}

	accountID, err := strconv.ParseInt(accountIDStr, 10, 64)
	if err != nil {
		helpers.RespondError(w, http.StatusBadRequest, "Invalid account_id")
		return
	}

	filters := db.TransactionFilters{
		AccountID: accountID,
	}

	if idStr := r.URL.Query().Get("id"); idStr != "" {
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
