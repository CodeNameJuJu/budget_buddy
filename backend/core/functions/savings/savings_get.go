package savings

import (
	"net/http"
	"strconv"

	"github.com/CodeNameJuJu/budget_buddy/core/db"
	"github.com/CodeNameJuJu/budget_buddy/core/helpers"
)

func GETSavingsPots(w http.ResponseWriter, r *http.Request) {
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

	var potID *int64
	if idStr := r.URL.Query().Get("id"); idStr != "" {
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

	summary, err := db.GetSavingsSummary(accountID)
	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Could not get savings summary")
		return
	}

	helpers.RespondData(w, summary, 1)
}

func GETSavingsAllocations(w http.ResponseWriter, r *http.Request) {
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
