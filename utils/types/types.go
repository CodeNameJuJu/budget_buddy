package types

import "time"

// APIResponse is the standard response wrapper for all API responses.
type APIResponse struct {
	Data  interface{} `json:"data,omitempty"`
	Error string      `json:"error,omitempty"`
	Count int         `json:"count,omitempty"`
}

// Timestamps contains shared timestamp fields for all database models.
type Timestamps struct {
	CreatedDate  time.Time  `json:"created_date" bun:"created_date,default:current_timestamp"`
	ModifiedDate *time.Time `json:"modified_date,omitempty" bun:"modified_date"`
	DeletedDate  *time.Time `json:"deleted_date,omitempty" bun:"deleted_date"`
}
