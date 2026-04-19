package debug

import (
	"fmt"
	"net/http"

	appcontext "github.com/julian/budget-buddy/core/context"
	"github.com/julian/budget-buddy/core/db"
	"github.com/julian/budget-buddy/core/helpers"
	"github.com/julian/budget-buddy/utils/types"
)

// DebugCategoryCreation bypasses all middleware to test database operations
func DebugCategoryCreation(w http.ResponseWriter, r *http.Request) {
	fmt.Printf("=== DEBUG: Category creation endpoint called ===\n")

	debugInfo := map[string]interface{}{
		"message": "Debug endpoint working",
		"method":  r.Method,
		"path":    r.URL.Path,
	}

	// Test database connection
	fmt.Printf("=== DEBUG: Testing database connection ===\n")
	dbConnection := appcontext.GetDb()
	if dbConnection == nil {
		fmt.Printf("=== DEBUG: Database connection is NIL ===\n")
		debugInfo["database_connection"] = "nil"
		helpers.RespondData(w, debugInfo, 1)
		return
	}

	fmt.Printf("=== DEBUG: Database connection established ===\n")
	debugInfo["database_connection"] = "ok"

	// Test if categories table exists by trying to query
	fmt.Printf("=== DEBUG: Testing categories table query ===\n")
	testCategories, count, err := db.QueryCategories(1, nil, nil)
	if err != nil {
		fmt.Printf("=== DEBUG: Categories query failed: %v ===\n", err)
		debugInfo["categories_table_error"] = err.Error()
	} else {
		fmt.Printf("=== DEBUG: Categories query successful, count: %d ===\n", count)
		debugInfo["categories_table"] = "ok"
		debugInfo["categories_count"] = count
		debugInfo["sample_categories"] = testCategories
	}

	// Test account existence
	fmt.Printf("=== DEBUG: Testing account table query ===\n")
	testAccounts, accountCount, accountErr := db.QueryAccounts(nil)
	if accountErr != nil {
		fmt.Printf("=== DEBUG: Account query failed: %v ===\n", accountErr)
		debugInfo["account_table_error"] = accountErr.Error()
	} else {
		fmt.Printf("=== DEBUG: Account query successful, count: %d ===\n", accountCount)
		debugInfo["account_table"] = "ok"
		debugInfo["account_count"] = accountCount
		if accountCount > 0 {
			debugInfo["sample_account"] = testAccounts[0]
		}
	}

	// Create a test account first if none exists
	var testAccountID int64 = 1
	if accountCount == 0 {
		fmt.Printf("=== DEBUG: Creating test account ===\n")
		testAccount := types.Account{
			Name:        "Debug Test Account",
			Type:        "personal",
			Description: "Auto-created test account for debugging",
		}

		accountInsertErr := db.InsertAccount(&testAccount)
		if accountInsertErr != nil {
			fmt.Printf("=== DEBUG: Account creation failed: %v ===\n", accountInsertErr)
			debugInfo["account_creation_error"] = accountInsertErr.Error()
		} else {
			fmt.Printf("=== DEBUG: Account creation successful ===\n")
			debugInfo["account_creation"] = "ok"
			debugInfo["created_account"] = testAccount
			testAccountID = testAccount.ID
		}
	} else {
		// Use existing account
		if accountCount > 0 {
			testAccountID = testAccounts[0].ID
			fmt.Printf("=== DEBUG: Using existing account ID: %d ===\n", testAccountID)
		}
	}

	// Test actual category insertion
	fmt.Printf("=== DEBUG: Testing category insertion ===\n")
	testCategory := types.Category{
		AccountID: testAccountID,
		Name:      "Debug Test Category",
		Type:      "expense",
	}

	insertErr := db.InsertCategory(&testCategory)
	if insertErr != nil {
		fmt.Printf("=== DEBUG: Category insertion failed: %v ===\n", insertErr)
		debugInfo["category_insertion_error"] = insertErr.Error()
	} else {
		fmt.Printf("=== DEBUG: Category insertion successful ===\n")
		debugInfo["category_insertion"] = "ok"
		debugInfo["inserted_category"] = testCategory
	}

	helpers.RespondData(w, debugInfo, 1)
}
