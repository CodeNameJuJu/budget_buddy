package categories

import (
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/julian/budget-buddy/core/db"
	"github.com/julian/budget-buddy/core/helpers"
	"github.com/julian/budget-buddy/utils/types"
)

type PATCHCategoryRequest struct {
	Name   *string `json:"name,omitempty"`
	Icon   *string `json:"icon,omitempty"`
	Colour *string `json:"colour,omitempty"`
	Type   *string `json:"type,omitempty"`
}

func PATCHCategory(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		helpers.RespondError(w, http.StatusBadRequest, "Invalid category ID")
		return
	}

	var req PATCHCategoryRequest
	if err := helpers.DecodeBody(r, &req); err != nil {
		helpers.RespondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	category := types.Category{ID: id}
	if req.Name != nil {
		category.Name = *req.Name
	}
	if req.Icon != nil {
		category.Icon = req.Icon
	}
	if req.Colour != nil {
		category.Colour = req.Colour
	}
	if req.Type != nil {
		category.Type = *req.Type
	}

	if err := db.UpdateCategory(&category); err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Could not update category")
		return
	}

	helpers.RespondData(w, category, 1)
}
