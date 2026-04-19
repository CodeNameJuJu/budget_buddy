package debug

import (
	"fmt"
	"net/http"

	"github.com/julian/budget-buddy/core/helpers"
)

// DebugCategoryCreation bypasses all middleware to test database operations
func DebugCategoryCreation(w http.ResponseWriter, r *http.Request) {
	fmt.Printf("=== DEBUG: Category creation endpoint called ===\n")
	
	// Test basic response
	helpers.RespondData(w, map[string]interface{}{
		"message": "Debug endpoint working",
		"method":  r.Method,
		"path":    r.URL.Path,
	}, 1)
}
