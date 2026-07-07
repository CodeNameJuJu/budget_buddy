package tags

import (
	"encoding/json"
	"net/http"

	"github.com/CodeNameJuJu/budget_buddy/core/db"
	"github.com/CodeNameJuJu/budget_buddy/core/functions/auth"
	"github.com/CodeNameJuJu/budget_buddy/core/helpers"
	"github.com/shopspring/decimal"
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
	accountID, ok := auth.GetAccountIDFromContext(r)
	if !ok {
		helpers.RespondError(w, http.StatusUnauthorized, "Account not found in context")
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
					stats, exists := tagMap[tag]
					if exists {
						stats.Count++
						currentTotal, _ := decimal.NewFromString(stats.TotalAmount)
						stats.TotalAmount = currentTotal.Add(transaction.Amount).String()
						tagMap[tag] = stats
					} else {
						tagMap[tag] = TagStats{
							Tag:         tag,
							Count:       1,
							TotalAmount: transaction.Amount.String(),
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
	accountID, ok := auth.GetAccountIDFromContext(r)
	if !ok {
		helpers.RespondError(w, http.StatusUnauthorized, "Account not found in context")
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
