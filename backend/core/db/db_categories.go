package db

import (
	"context"
	"fmt"
	"time"

	appcontext "github.com/julian/budget-buddy/core/context"
	"github.com/julian/budget-buddy/utils/types"
)

func QueryCategories(accountID int64, categoryID *int64, categoryType *string) ([]types.Category, int, error) {
	db := appcontext.GetDb()
	var categories []types.Category

	query := db.NewSelect().Model(&categories).
		Where("cat.account_id = ?", accountID).
		Where("cat.deleted_date IS NULL").
		Order("cat.name ASC")

	if categoryID != nil {
		query = query.Where("cat.id = ?", *categoryID)
	}

	if categoryType != nil {
		query = query.Where("cat.type = ?", *categoryType)
	}

	count, err := query.ScanAndCount(context.Background())
	return categories, count, err
}

func InsertCategory(category *types.Category) error {
	db := appcontext.GetDb()
	if db == nil {
		return fmt.Errorf("database connection is nil")
	}

	// Set timestamps before insertion
	now := time.Now()
	category.CreatedDate = &now
	category.ModifiedDate = &now

	fmt.Printf("Attempting to insert category: %+v\n", category)

	_, err := db.NewInsert().Model(category).
		Returning("*").
		Exec(context.Background())

	if err != nil {
		fmt.Printf("Database insertion error: %v\n", err)
		return fmt.Errorf("failed to insert category: %w", err)
	}

	fmt.Printf("Category inserted successfully: %+v\n", category)
	return nil
}

func UpdateCategory(category *types.Category) error {
	db := appcontext.GetDb()
	now := time.Now()
	category.ModifiedDate = &now

	_, err := db.NewUpdate().Model(category).
		WherePK().
		OmitZero().
		Returning("*").
		Exec(context.Background())
	return err
}

func SoftDeleteCategory(id int64) error {
	db := appcontext.GetDb()
	now := time.Now()

	_, err := db.NewUpdate().
		Model((*types.Category)(nil)).
		Set("deleted_date = ?", now).
		Where("id = ?", id).
		Exec(context.Background())
	return err
}
