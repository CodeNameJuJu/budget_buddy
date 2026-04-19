package dashboard

import (
	"net/http"

	appcontext "github.com/julian/budget-buddy/core/context"
	"github.com/julian/budget-buddy/core/helpers"
)

func POSTCreateTables(w http.ResponseWriter, r *http.Request) {
	db := appcontext.GetDb()

	// Create dashboard_layouts table
	_, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS dashboard_layouts (
			id SERIAL PRIMARY KEY,
			account_id INTEGER NOT NULL,
			name VARCHAR(255) NOT NULL,
			is_active BOOLEAN NOT NULL DEFAULT TRUE,
			layout TEXT NOT NULL,
			created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			modified_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)
	`)
	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Could not create dashboard_layouts table")
		return
	}

	// Create indexes
	_, err = db.Exec(`CREATE INDEX IF NOT EXISTS idx_dashboard_layouts_account_id ON dashboard_layouts(account_id)`)
	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Could not create indexes")
		return
	}

	_, err = db.Exec(`CREATE INDEX IF NOT EXISTS idx_dashboard_layouts_is_active ON dashboard_layouts(is_active)`)
	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Could not create indexes")
		return
	}

	helpers.RespondData(w, map[string]string{"message": "Dashboard tables created successfully"}, 1)
}
