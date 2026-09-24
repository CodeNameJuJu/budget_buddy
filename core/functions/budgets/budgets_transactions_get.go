package budgets

import (
	"net/http"
	"strconv"

	"github.com/CodeNameJuJu/budget_buddy/core/db"
	"github.com/CodeNameJuJu/budget_buddy/core/functions/auth"
	"github.com/CodeNameJuJu/budget_buddy/core/helpers"
	"github.com/go-chi/chi/v5"
)

// GETBudgetTransactions returns the transactions counted against a budget in
// its current period. This uses the same matching rule and period window as
// the spent amount on the budget, so the list always reconciles with the
// progress bar.
func GETBudgetTransactions(w http.ResponseWriter, r *http.Request) {
	accountID, ok := auth.GetAccountIDFromContext(r)
	if !ok {
		helpers.RespondError(w, http.StatusUnauthorized, "Account not found in context")
		return
	}

	budgetID, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		helpers.RespondError(w, http.StatusBadRequest, "Invalid budget ID")
		return
	}

	budgets, _, err := db.QueryBudgets(accountID, &budgetID)
	if err != nil || len(budgets) == 0 {
		helpers.RespondError(w, http.StatusNotFound, "Budget not found")
		return
	}

	transactions, count, err := db.QueryBudgetTransactions(&budgets[0])
	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Could not query budget transactions")
		return
	}

	helpers.RespondData(w, transactions, count)
}
