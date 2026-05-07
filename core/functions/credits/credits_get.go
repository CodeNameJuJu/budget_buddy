package credits

import (
	"net/http"
	"strconv"

	"github.com/CodeNameJuJu/budget_buddy/core/db"
	"github.com/CodeNameJuJu/budget_buddy/core/helpers"
)

func GETCreditPots(w http.ResponseWriter, r *http.Request) {
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

	pots, count, err := db.QueryCreditPots(accountID, potID)
	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Could not query credit pots")
		return
	}

	helpers.RespondData(w, pots, count)
}

func GETCreditSummary(w http.ResponseWriter, r *http.Request) {
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

	summary, err := db.GetCreditSummary(accountID)
	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Could not get credit summary")
		return
	}

	helpers.RespondData(w, summary, 1)
}

func GETCreditPayments(w http.ResponseWriter, r *http.Request) {
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
