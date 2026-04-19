package categories

import (
	"net/http"
	"strconv"

	"github.com/CodeNameJuJu/budget_buddy/core/db"
	"github.com/CodeNameJuJu/budget_buddy/core/helpers"
)

func GETCategories(w http.ResponseWriter, r *http.Request) {
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

	var categoryID *int64
	if idStr := r.URL.Query().Get("id"); idStr != "" {
		id, err := strconv.ParseInt(idStr, 10, 64)
		if err != nil {
			helpers.RespondError(w, http.StatusBadRequest, "Invalid category ID")
			return
		}
		categoryID = &id
	}

	var categoryType *string
	if t := r.URL.Query().Get("type"); t != "" {
		categoryType = &t
	}

	categories, count, err := db.QueryCategories(accountID, categoryID, categoryType)
	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Could not query categories")
		return
	}

	helpers.RespondData(w, categories, count)
}
