package categories

import (
	"net/http"
	"strconv"

	"github.com/CodeNameJuJu/budget_buddy/core/db"
	"github.com/CodeNameJuJu/budget_buddy/core/functions/auth"
	"github.com/CodeNameJuJu/budget_buddy/core/helpers"
	"github.com/CodeNameJuJu/budget_buddy/utils/types"
	"github.com/go-chi/chi/v5"
)

type PATCHCategoryRequest struct {
	Name   *string `json:"name,omitempty"`
	Icon   *string `json:"icon,omitempty"`
	Colour *string `json:"colour,omitempty"`
	Type   *string `json:"type,omitempty"`
}

func PATCHCategory(w http.ResponseWriter, r *http.Request) {
	accountID, ok := auth.GetAccountIDFromContext(r)
	if !ok {
		helpers.RespondError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		helpers.RespondError(w, http.StatusBadRequest, "Invalid category ID")
		return
	}

	// Verify ownership
	existing, _, err := db.QueryCategories(accountID, &id, nil)
	if err != nil || len(existing) == 0 {
		helpers.RespondError(w, http.StatusNotFound, "Category not found")
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
