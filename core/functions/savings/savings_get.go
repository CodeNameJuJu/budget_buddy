package savings

import (
	"net/http"
	"strconv"

	"github.com/CodeNameJuJu/budget_buddy/core/db"
	"github.com/CodeNameJuJu/budget_buddy/core/functions/auth"
	"github.com/CodeNameJuJu/budget_buddy/core/helpers"
	"github.com/go-chi/chi/v5"
)

func GETSavingsPots(w http.ResponseWriter, r *http.Request) {
	accountID, ok := auth.GetAccountIDFromContext(r)
	if !ok {
		helpers.RespondError(w, http.StatusUnauthorized, "Account not found in context")
		return
	}

	var potID *int64
	idStr := chi.URLParam(r, "id")
	if idStr == "" {
		idStr = r.URL.Query().Get("id")
	}
	if idStr != "" {
		id, err := strconv.ParseInt(idStr, 10, 64)
		if err != nil {
			helpers.RespondError(w, http.StatusBadRequest, "Invalid pot ID")
			return
		}
		potID = &id
	}

	pots, count, err := db.QuerySavingsPots(accountID, potID)
	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Could not query savings pots")
		return
	}

	helpers.RespondData(w, pots, count)
}

func GETSavingsSummary(w http.ResponseWriter, r *http.Request) {
	accountID, ok := auth.GetAccountIDFromContext(r)
	if !ok {
		helpers.RespondError(w, http.StatusUnauthorized, "Account not found in context")
		return
	}

	summary, err := db.GetSavingsSummary(accountID)
	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Could not get savings summary")
		return
	}

	helpers.RespondData(w, summary, 1)
}

func GETSavingsAllocations(w http.ResponseWriter, r *http.Request) {
	accountID, ok := auth.GetAccountIDFromContext(r)
	if !ok {
		helpers.RespondError(w, http.StatusUnauthorized, "Account not found in context")
		return
	}

	var potID *int64
	if idStr := r.URL.Query().Get("savings_pot_id"); idStr != "" {
		id, err := strconv.ParseInt(idStr, 10, 64)
		if err != nil {
			helpers.RespondError(w, http.StatusBadRequest, "Invalid savings_pot_id")
			return
		}
		potID = &id
	}

	allocations, count, err := db.QuerySavingsAllocations(accountID, potID)
	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Could not query savings allocations")
		return
	}

	helpers.RespondData(w, allocations, count)
}
