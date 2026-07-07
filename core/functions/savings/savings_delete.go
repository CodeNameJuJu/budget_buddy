package savings

import (
	"net/http"
	"strconv"

	"github.com/CodeNameJuJu/budget_buddy/core/db"
	"github.com/CodeNameJuJu/budget_buddy/core/functions/auth"
	"github.com/CodeNameJuJu/budget_buddy/core/helpers"
	"github.com/go-chi/chi/v5"
)

func DELETEPot(w http.ResponseWriter, r *http.Request) {
	accountID, ok := auth.GetAccountIDFromContext(r)
	if !ok {
		helpers.RespondError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		helpers.RespondError(w, http.StatusBadRequest, "Invalid pot ID")
		return
	}

	if err := db.SoftDeleteSavingsPotForAccount(id, accountID); err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Could not delete savings pot")
		return
	}

	helpers.RespondData(w, nil, 0)
}

func DELETEAllocation(w http.ResponseWriter, r *http.Request) {
	accountID, ok := auth.GetAccountIDFromContext(r)
	if !ok {
		helpers.RespondError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		helpers.RespondError(w, http.StatusBadRequest, "Invalid allocation ID")
		return
	}

	if err := db.SoftDeleteSavingsAllocationForAccount(id, accountID); err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Could not delete savings allocation")
		return
	}

	helpers.RespondData(w, nil, 0)
}
