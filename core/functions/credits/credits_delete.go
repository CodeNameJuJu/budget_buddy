package credits

import (
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/CodeNameJuJu/budget_buddy/core/db"
	"github.com/CodeNameJuJu/budget_buddy/core/helpers"
)

func DELETECreditPot(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		helpers.RespondError(w, http.StatusBadRequest, "Invalid pot ID")
		return
	}

	if err := db.SoftDeleteCreditPot(id); err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Could not delete credit pot")
		return
	}

	helpers.RespondData(w, nil, 0)
}

func DELETECreditPayment(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		helpers.RespondError(w, http.StatusBadRequest, "Invalid payment ID")
		return
	}

	if err := db.SoftDeleteCreditPayment(id); err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Could not delete credit payment")
		return
	}

	helpers.RespondData(w, nil, 0)
}
