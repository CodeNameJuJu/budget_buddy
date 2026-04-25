package accounts

import (
	"net/http"
	"strconv"

	"github.com/CodeNameJuJu/budget_buddy/core/db"
	"github.com/CodeNameJuJu/budget_buddy/core/helpers"
)

func GETAccount(w http.ResponseWriter, r *http.Request) {
	// Get user ID from context (set by auth middleware). The middleware stores
	// the user's ID as int (matching types.User.ID), so we must assert int and
	// then convert to int64 for the db query.
	userIDInt, ok := r.Context().Value("user_id").(int)
	if !ok {
		helpers.RespondError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}
	userID := int64(userIDInt)

	var accountID *int64
	if idStr := r.URL.Query().Get("id"); idStr != "" {
		id, err := strconv.ParseInt(idStr, 10, 64)
		if err != nil {
			helpers.RespondError(w, http.StatusBadRequest, "Invalid account ID")
			return
		}
		accountID = &id
	}

	accounts, count, err := db.QueryAccounts(accountID, &userID)
	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Could not query accounts")
		return
	}

	helpers.RespondData(w, accounts, count)
}

func GETMyAccount(w http.ResponseWriter, r *http.Request) {
	// Get user ID from context (set by auth middleware). The middleware stores
	// it as int; convert to int64 for the db query.
	userIDInt, ok := r.Context().Value("user_id").(int)
	if !ok {
		helpers.RespondError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}
	userID := int64(userIDInt)

	// Query accounts for the current user only
	accounts, count, err := db.QueryAccounts(nil, &userID)
	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Could not query user accounts")
		return
	}

	helpers.RespondData(w, accounts, count)
}
