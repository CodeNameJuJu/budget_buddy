package credits

import (
	"net/http"
	"strconv"

	"github.com/CodeNameJuJu/budget_buddy/core/db"
	"github.com/CodeNameJuJu/budget_buddy/core/functions/auth"
	"github.com/CodeNameJuJu/budget_buddy/core/helpers"
	"github.com/go-chi/chi/v5"
)

func GETCreditPots(w http.ResponseWriter, r *http.Request) {
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

	pots, count, err := db.QueryCreditPots(accountID, potID)
	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Could not query credit pots")
		return
	}

	helpers.RespondData(w, pots, count)
}

func GETCreditSummary(w http.ResponseWriter, r *http.Request) {
	accountID, ok := auth.GetAccountIDFromContext(r)
	if !ok {
		helpers.RespondError(w, http.StatusUnauthorized, "Account not found in context")
		return
	}

	summary, err := db.GetCreditSummary(accountID)
	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Could not get credit summary")
		return
	}

	helpers.RespondData(w, summary, 1)
}

func GETCreditPayments(w http.ResponseWriter, r *http.Request) {
	accountID, ok := auth.GetAccountIDFromContext(r)
	if !ok {
		helpers.RespondError(w, http.StatusUnauthorized, "Account not found in context")
		return
	}

	var potID *int64
	if idStr := r.URL.Query().Get("credit_pot_id"); idStr != "" {
		id, err := strconv.ParseInt(idStr, 10, 64)
		if err != nil {
			helpers.RespondError(w, http.StatusBadRequest, "Invalid credit_pot_id")
			return
		}
		potID = &id
	}

	payments, count, err := db.QueryCreditPayments(accountID, potID)
	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Could not query credit payments")
		return
	}

	helpers.RespondData(w, payments, count)
}
