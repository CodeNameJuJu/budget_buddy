package categories

import (
	"net/http"
	"strconv"

	"github.com/CodeNameJuJu/budget_buddy/core/db"
	"github.com/CodeNameJuJu/budget_buddy/core/functions/auth"
	"github.com/CodeNameJuJu/budget_buddy/core/helpers"
	"github.com/go-chi/chi/v5"
)

func GETCategories(w http.ResponseWriter, r *http.Request) {
	accountID, ok := auth.GetAccountIDFromContext(r)
	if !ok {
		helpers.RespondError(w, http.StatusUnauthorized, "Account not found in context")
		return
	}

	var categoryID *int64
	idStr := chi.URLParam(r, "id")
	if idStr == "" {
		idStr = r.URL.Query().Get("id")
	}
	if idStr != "" {
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
