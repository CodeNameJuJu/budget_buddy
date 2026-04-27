package debug

import (
	"net/http"

	appcontext "github.com/CodeNameJuJu/budget_buddy/core/context"
	"github.com/CodeNameJuJu/budget_buddy/core/db"
	"github.com/CodeNameJuJu/budget_buddy/core/helpers"
	"github.com/CodeNameJuJu/budget_buddy/utils/types"
)

// DebugCategoryCreation bypasses all middleware to test database operations
func DebugCategoryCreation(w http.ResponseWriter, r *http.Request) {
	debugInfo := map[string]interface{}{
		"message": "Debug endpoint working",
		"method":  r.Method,
		"path":    r.URL.Path,
	}

	// Test database connection
	dbConnection := appcontext.GetDb()
	if dbConnection == nil {
		debugInfo["database_connection"] = "nil"
		helpers.RespondData(w, debugInfo, 1)
		return
	}

	debugInfo["database_connection"] = "ok"

	// Test if categories table exists by trying to query
	testCategories, count, err := db.QueryCategories(1, nil, nil)
	if err != nil {
		debugInfo["categories_table_error"] = err.Error()
	} else {
		debugInfo["categories_table"] = "ok"
		debugInfo["categories_count"] = count
		debugInfo["sample_categories"] = testCategories
	}

	// Test account existence
	testAccounts, accountCount, accountErr := db.QueryAccounts(nil)
	if accountErr != nil {
		debugInfo["account_table_error"] = accountErr.Error()
	} else {
		debugInfo["account_table"] = "ok"
		debugInfo["account_count"] = accountCount
		if accountCount > 0 {
			debugInfo["sample_account"] = testAccounts[0]
		}
	}

	// Create a test account first if none exists
	var testAccountID int64 = 1
	if accountCount == 0 {
		testAccount := types.Account{
			Name:     "Debug Test Account",
			Email:    "debug@test.com",
			Currency: "ZAR",
		}

		accountInsertErr := db.InsertAccount(&testAccount)
		if accountInsertErr != nil {
			debugInfo["account_creation_error"] = accountInsertErr.Error()
		} else {
			debugInfo["account_creation"] = "ok"
			debugInfo["created_account"] = testAccount
			testAccountID = testAccount.ID
		}
	} else {
		// Use existing account
		if accountCount > 0 {
			testAccountID = testAccounts[0].ID
		}
	}

	// Test actual category insertion
	testCategory := types.Category{
		AccountID: testAccountID,
		Name:      "Debug Test Category",
		Type:      "expense",
	}

	insertErr := db.InsertCategory(&testCategory)
	if insertErr != nil {
		debugInfo["category_insertion_error"] = insertErr.Error()
	} else {
		debugInfo["category_insertion"] = "ok"
		debugInfo["inserted_category"] = testCategory
	}

	helpers.RespondData(w, debugInfo, 1)
}
