package savings

import (
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/julian/budget-buddy/core/db"
	"github.com/julian/budget-buddy/core/helpers"
)

func DELETEPot(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		helpers.RespondError(w, http.StatusBadRequest, "Invalid pot ID")
		return
	}

	if err := db.SoftDeleteSavingsPot(id); err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Could not delete savings pot")
		return
	}

	helpers.RespondData(w, nil, 0)
}

func DELETEAllocation(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		helpers.RespondError(w, http.StatusBadRequest, "Invalid allocation ID")
		return
	}

	if err := db.SoftDeleteSavingsAllocation(id); err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Could not delete savings allocation")
		return
	}

	helpers.RespondData(w, nil, 0)
}
