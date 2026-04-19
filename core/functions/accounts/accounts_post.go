package accounts

import (
	"fmt"
	"log"
	"net/http"

	"github.com/CodeNameJuJu/budget_buddy/core/db"
	"github.com/CodeNameJuJu/budget_buddy/core/helpers"
	"github.com/CodeNameJuJu/budget_buddy/utils/types"
)

type POSTAccountRequest struct {
	Name     string  `json:"name"`
	Email    string  `json:"email"`
	Currency string  `json:"currency"`
	Timezone *string `json:"timezone,omitempty"`
}

func (p *POSTAccountRequest) Validate() error {
	if p.Name == "" {
		return fmt.Errorf("name is required")
	}
	if p.Email == "" {
		return fmt.Errorf("email is required")
	}
	if p.Currency == "" {
		p.Currency = "ZAR"
	}
	return nil
}

func POSTAccount(w http.ResponseWriter, r *http.Request) {
	var req POSTAccountRequest
	if err := helpers.DecodeBody(r, &req); err != nil {
		helpers.RespondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if err := req.Validate(); err != nil {
		helpers.RespondError(w, http.StatusBadRequest, err.Error())
		return
	}

	account := types.Account{
		Name:     req.Name,
		Email:    req.Email,
		Currency: req.Currency,
		Timezone: req.Timezone,
	}

	if err := db.InsertAccount(&account); err != nil {
		log.Printf("InsertAccount error: %v", err)
		helpers.RespondError(w, http.StatusInternalServerError, "Could not create account")
		return
	}

	helpers.RespondData(w, account, 1)
}
