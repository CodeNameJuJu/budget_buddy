package transactions

import (
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/julian/budget-buddy/core/db"
	"github.com/julian/budget-buddy/core/helpers"
)

func DELETETransaction(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		helpers.RespondError(w, http.StatusBadRequest, "Invalid transaction ID")
		return
	}

	if err := db.SoftDeleteTransaction(id); err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Could not delete transaction")
		return
	}

	helpers.RespondData(w, nil, 0)
}
