package tags

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/CodeNameJuJu/budget_buddy/core/db"
	"github.com/CodeNameJuJu/budget_buddy/core/helpers"
)

type TagStats struct {
	Tag         string `json:"tag"`
	Count       int    `json:"count"`
	TotalAmount string `json:"total_amount"`
}

type PopularTag struct {
	Tag      string `json:"tag"`
	Count    int    `json:"count"`
	Category string `json:"category"`
}

// Popular tags for suggestions
var popularTags = []PopularTag{
	{Tag: "urgent", Count: 0, Category: "priority"},
	{Tag: "recurring", Count: 0, Category: "frequency"},
	{Tag: "business", Count: 0, Category: "purpose"},
	{Tag: "personal", Count: 0, Category: "purpose"},
	{Tag: "one-time", Count: 0, Category: "frequency"},
	{Tag: "subscription", Count: 0, Category: "type"},
	{Tag: "emergency", Count: 0, Category: "priority"},
	{Tag: "planned", Count: 0, Category: "planning"},
	{Tag: "impulse", Count: 0, Category: "planning"},
	{Tag: "essential", Count: 0, Category: "priority"},
	{Tag: "optional", Count: 0, Category: "priority"},
	{Tag: "investment", Count: 0, Category: "purpose"},
	{Tag: "gift", Count: 0, Category: "type"},
	{Tag: "refund", Count: 0, Category: "type"},
	{Tag: "bonus", Count: 0, Category: "type"},
}

func GETTagStats(w http.ResponseWriter, r *http.Request) {
	accountIDStr := r.URL.Query().Get("account_id")
	if accountIDStr == "" {
		helpers.RespondError(w, http.StatusBadRequest, "account_id is required")
		return
	}

	accountID, err := strconv.ParseInt(accountIDStr, 10, 64)
	if err != nil {
		helpers.RespondError(w, http.StatusBadRequest, "Invalid account_id")
		return
	}

	// Get all transactions with tags
	transactions, _, err := db.QueryTransactions(db.TransactionFilters{
		AccountID: accountID,
	})
	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Could not query transactions")
		return
	}

	// Count tags
	tagMap := make(map[string]TagStats)
	for _, transaction := range transactions {
		if transaction.Tags != nil && *transaction.Tags != "" {
			var tags []string
			if err := json.Unmarshal([]byte(*transaction.Tags), &tags); err == nil {
				for _, tag := range tags {
					if stats, exists := tagMap[tag]; exists {
						stats.Count++
						// Note: We would need to parse and add the amount, but for simplicity, we'll just count
					} else {
						tagMap[tag] = TagStats{
							Tag:   tag,
							Count: 1,
						}
					}
				}
			}
		}
	}

	// Convert to slice
	var tagStats []TagStats
	for _, stats := range tagMap {
		tagStats = append(tagStats, stats)
	}

	helpers.RespondData(w, tagStats, len(tagStats))
}

func GETPopularTags(w http.ResponseWriter, r *http.Request) {
	accountIDStr := r.URL.Query().Get("account_id")
	if accountIDStr == "" {
		helpers.RespondError(w, http.StatusBadRequest, "account_id is required")
		return
	}

	accountID, err := strconv.ParseInt(accountIDStr, 10, 64)
	if err != nil {
		helpers.RespondError(w, http.StatusBadRequest, "Invalid account_id")
		return
	}

	// Get user's transactions to count their tag usage
	transactions, _, err := db.QueryTransactions(db.TransactionFilters{
		AccountID: accountID,
	})
	if err != nil {
		helpers.RespondError(w, http.StatusInternalServerError, "Could not query transactions")
		return
	}

	// Count user's tag usage
	userTagCounts := make(map[string]int)
	for _, transaction := range transactions {
		if transaction.Tags != nil && *transaction.Tags != "" {
			var tags []string
			if err := json.Unmarshal([]byte(*transaction.Tags), &tags); err == nil {
				for _, tag := range tags {
					userTagCounts[tag]++
				}
			}
		}
	}

	// Update popular tags with user counts
	var result []PopularTag
	for _, popularTag := range popularTags {
		count := userTagCounts[popularTag.Tag]
		result = append(result, PopularTag{
			Tag:      popularTag.Tag,
			Count:    count,
			Category: popularTag.Category,
		})
	}

	helpers.RespondData(w, result, len(result))
}
