package budgets

import (
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/julian/budget-buddy/core/db"
	"github.com/julian/budget-buddy/core/helpers"
)

func DELETEBudget(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		helpers.RespondError(w, http.StatusBadRequest, "Invalid budget ID")
		return
	}

	if err := db.SoftDeleteBudget(id); err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Could not delete budget")
		return
	}

	helpers.RespondData(w, nil, 0)
}
