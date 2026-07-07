package savings

import (
	"net/http"
	"strconv"

	"github.com/CodeNameJuJu/budget_buddy/core/db"
	"github.com/CodeNameJuJu/budget_buddy/core/functions/auth"
	"github.com/CodeNameJuJu/budget_buddy/core/helpers"
	"github.com/CodeNameJuJu/budget_buddy/utils/types"
	"github.com/go-chi/chi/v5"
	"github.com/shopspring/decimal"
)

type PATCHPotRequest struct {
	Name               *string `json:"name,omitempty"`
	Icon               *string `json:"icon,omitempty"`
	Colour             *string `json:"colour,omitempty"`
	Target             *string `json:"target,omitempty"`
	Contribution       *string `json:"contribution,omitempty"`
	ContributionPeriod *string `json:"contribution_period,omitempty"`
}

func PATCHPot(w http.ResponseWriter, r *http.Request) {
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

	// Verify ownership
	existing, _, err := db.QuerySavingsPots(accountID, &id)
	if err != nil || len(existing) == 0 {
		helpers.RespondError(w, http.StatusNotFound, "Savings pot not found")
		return
	}

	var req PATCHPotRequest
	if err := helpers.DecodeBody(r, &req); err != nil {
		helpers.RespondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	pot := types.SavingsPot{ID: id}

	if req.Name != nil {
		pot.Name = *req.Name
	}
	if req.Icon != nil {
		pot.Icon = req.Icon
	}
	if req.Colour != nil {
		pot.Colour = req.Colour
	}
	if req.Target != nil {
		t, parseErr := decimal.NewFromString(*req.Target)
		if parseErr != nil {
			helpers.RespondError(w, http.StatusBadRequest, "Invalid target amount")
			return
		}
		pot.Target = &t
	}
	if req.Contribution != nil {
		c, parseErr := decimal.NewFromString(*req.Contribution)
		if parseErr != nil {
			helpers.RespondError(w, http.StatusBadRequest, "Invalid contribution amount")
			return
		}
		pot.Contribution = &c
	}
	if req.ContributionPeriod != nil {
		switch *req.ContributionPeriod {
		case "weekly", "fortnightly", "monthly":
			pot.ContributionPeriod = req.ContributionPeriod
		default:
			helpers.RespondError(w, http.StatusBadRequest, "contribution_period must be weekly, fortnightly, or monthly")
			return
		}
	}

	if err := db.UpdateSavingsPot(&pot); err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Could not update savings pot")
		return
	}

	helpers.RespondData(w, pot, 1)
}
