package categories

import (
	"fmt"
	"net/http"

	"github.com/CodeNameJuJu/budget_buddy/core/db"
	"github.com/CodeNameJuJu/budget_buddy/core/helpers"
	"github.com/CodeNameJuJu/budget_buddy/utils/types"
)

type POSTCategoryRequest struct {
	AccountID int64   `json:"account_id"`
	Name      string  `json:"name"`
	Icon      *string `json:"icon,omitempty"`
	Colour    *string `json:"colour,omitempty"`
	Type      string  `json:"type"`
}

func (p *POSTCategoryRequest) Validate() error {
	if p.AccountID == 0 {
		return fmt.Errorf("account_id is required")
	}
	if p.Name == "" {
		return fmt.Errorf("name is required")
	}
	if p.Type != "income" && p.Type != "expense" {
		return fmt.Errorf("type must be 'income' or 'expense'")
	}
	return nil
}

func POSTCategory(w http.ResponseWriter, r *http.Request) {
	var req POSTCategoryRequest
	if err := helpers.DecodeBody(r, &req); err != nil {
		helpers.RespondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if err := req.Validate(); err != nil {
		helpers.RespondError(w, http.StatusBadRequest, err.Error())
		return
	}

	category := types.Category{
		AccountID: req.AccountID,
		Name:      req.Name,
		Icon:      req.Icon,
		Colour:    req.Colour,
		Type:      req.Type,
	}

	if err := db.InsertCategory(&category); err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Could not create category")
		return
	}

	helpers.RespondData(w, category, 1)
}
