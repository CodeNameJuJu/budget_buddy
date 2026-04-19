package main

import (
	"context"
	"fmt"
	"time"

	appcontext "github.com/julian/budget-buddy/core/context"
	"github.com/julian/budget-buddy/utils/types"
)

func main() {
	// Initialize database context
	appcontext.Init()

	db := appcontext.GetDb()

	// Test date range for current month
	now := time.Now()
	startDate := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
	endDate := startDate.AddDate(0, 1, 0).Add(-time.Nanosecond)

	fmt.Printf("Testing query for period: %s to %s\n", startDate, endDate)

	// Test simple query first
	var count int
	err := db.NewSelect().
		Model((*types.Transaction)(nil)).
		Where("account_id = ?", 1).
		Where("type = ?", "expense").
		Where("date >= ? AND date <= ?", startDate, endDate).
		Where("deleted_date IS NULL").
		Count(context.Background(), &count)

	if err != nil {
		fmt.Printf("Error in simple query: %v\n", err)
		return
	}

	fmt.Printf("Found %d expense transactions for current month\n", count)

	// Test the problematic join query
	type CategorySpending struct {
		CategoryID       int64  `bun:"category_id"`
		CategoryName     string `bun:"category_name"`
		TotalAmount      string `bun:"total_amount"`
		TransactionCount int    `bun:"transaction_count"`
	}

	var categorySpending []CategorySpending
	err = db.NewSelect().
		ColumnExpr("t.category_id, c.name as category_name, COALESCE(SUM(t.amount), 0) as total_amount, COUNT(t.id) as transaction_count").
		TableExpr("transactions AS t").
		Join("LEFT JOIN categories c ON t.category_id = c.id").
		Where("t.account_id = ?", 1).
		Where("t.type = ?", "expense").
		Where("t.date >= ? AND t.date <= ?", startDate, endDate).
		Where("t.deleted_date IS NULL").
		Where("t.category_id IS NOT NULL").
		Group("t.category_id, c.name").
		Order("total_amount DESC").
		Scan(context.Background(), &categorySpending)

	if err != nil {
		fmt.Printf("Error in join query: %v\n", err)
		return
	}

	fmt.Printf("Found %d categories with spending\n", len(categorySpending))
	for _, cs := range categorySpending {
		fmt.Printf("Category: %s, Amount: %s, Count: %d\n", cs.CategoryName, cs.TotalAmount, cs.TransactionCount)
	}
}
