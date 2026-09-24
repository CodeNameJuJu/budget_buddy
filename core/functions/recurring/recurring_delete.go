package recurring

import (
	"net/http"
	"strconv"

	"github.com/CodeNameJuJu/budget_buddy/core/db"
	"github.com/CodeNameJuJu/budget_buddy/core/functions/auth"
	"github.com/CodeNameJuJu/budget_buddy/core/helpers"
	"github.com/go-chi/chi/v5"
)

func DELETERecurringTransaction(w http.ResponseWriter, r *http.Request) {
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

	if err := db.SoftDeleteRecurringTransactionForAccount(id, accountID); err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Could not delete recurring transaction")
		return
	}

	helpers.RespondData(w, nil, 0)
}
