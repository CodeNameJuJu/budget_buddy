package accounts

import (
	"net/http"
	"strconv"

	"github.com/CodeNameJuJu/budget_buddy/core/db"
	"github.com/CodeNameJuJu/budget_buddy/core/helpers"
)

func GETAccount(w http.ResponseWriter, r *http.Request) {
	var accountID *int64
	if idStr := r.URL.Query().Get("id"); idStr != "" {
		id, err := strconv.ParseInt(idStr, 10, 64)
		if err != nil {
			helpers.RespondError(w, http.StatusBadRequest, "Invalid account ID")
			return
		}
		accountID = &id
	}

	accounts, count, err := db.QueryAccounts(accountID)
	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Could not query accounts")
		return
	}

	helpers.RespondData(w, accounts, count)
}
