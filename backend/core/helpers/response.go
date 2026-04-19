package helpers

import (
	"encoding/json"
	"net/http"

	"github.com/julian/budget-buddy/utils/types"
)

func RespondJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(data)
}

func RespondData(w http.ResponseWriter, data interface{}, count int) {
	RespondJSON(w, http.StatusOK, types.APIResponse{
		Data:  data,
		Count: count,
	})
}

func RespondError(w http.ResponseWriter, status int, message string) {
	RespondJSON(w, status, types.APIResponse{
		Error: message,
	})
}

func DecodeBody(r *http.Request, v interface{}) error {
	defer r.Body.Close()
	return json.NewDecoder(r.Body).Decode(v)
}
