package account_merge

import (
	"net/http"

	"github.com/CodeNameJuJu/budget_buddy/core/functions/auth"
	"github.com/CodeNameJuJu/budget_buddy/core/helpers"
	"github.com/CodeNameJuJu/budget_buddy/utils/types"
)

type AccountMergeHandler struct {
	mergeService *AccountMergeService
}

func NewAccountMergeHandler() *AccountMergeHandler {
	return &AccountMergeHandler{
		mergeService: NewAccountMergeService(),
	}
}

// CreateMergeToken creates a merge token for a partner
func (h *AccountMergeHandler) CreateMergeToken(w http.ResponseWriter, r *http.Request) {
	userID, ok := auth.GetUserIDFromContext(r)
	if !ok {
		helpers.RespondError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	var req types.CreateAccountMergeRequest
	if err := helpers.DecodeBody(r, &req); err != nil {
		helpers.RespondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.PartnerEmail == "" {
		helpers.RespondError(w, http.StatusBadRequest, "Partner email is required")
		return
	}

	mergeToken, err := h.mergeService.CreateMergeToken(userID, req.PartnerEmail)
	if err != nil {
		helpers.RespondError(w, http.StatusBadRequest, err.Error())
		return
	}

	helpers.RespondData(w, mergeToken, http.StatusCreated)
}

// AcceptMerge accepts a merge request
func (h *AccountMergeHandler) AcceptMerge(w http.ResponseWriter, r *http.Request) {
	userID, ok := auth.GetUserIDFromContext(r)
	if !ok {
		helpers.RespondError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	var req types.AcceptAccountMergeRequest
	if err := helpers.DecodeBody(r, &req); err != nil {
		helpers.RespondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.Token == "" {
		helpers.RespondError(w, http.StatusBadRequest, "Token is required")
		return
	}

	err := h.mergeService.AcceptMerge(userID, req.Token)
	if err != nil {
		helpers.RespondError(w, http.StatusBadRequest, err.Error())
		return
	}

	helpers.RespondData(w, map[string]string{"message": "Accounts merged successfully"}, http.StatusOK)
}

// GetPendingMergeTokens gets pending merge tokens for the current user
func (h *AccountMergeHandler) GetPendingMergeTokens(w http.ResponseWriter, r *http.Request) {
	userID, ok := auth.GetUserIDFromContext(r)
	if !ok {
		helpers.RespondError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	tokens, err := h.mergeService.GetPendingMergeTokens(userID)
	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	helpers.RespondData(w, tokens, http.StatusOK)
}
