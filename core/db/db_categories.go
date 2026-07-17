package db

import (
	"context"
	"time"

	"github.com/CodeNameJuJu/budget_buddy/utils/types"
)

func QueryCategories(accountID int64, categoryID *int64, categoryType *string) ([]types.Category, int, error) {
	db := GetDb()
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
	db := GetDb()
	_, err := db.NewInsert().Model(category).
		Returning("*").
		Exec(context.Background())
	return err
}

func UpdateCategory(category *types.Category) error {
	db := GetDb()
	now := time.Now()
	category.ModifiedDate = &now

	_, err := db.NewUpdate().Model(category).
		WherePK().
		OmitZero().
		Returning("*").
		Exec(context.Background())
	return err
}

func SoftDeleteCategoryForAccount(id int64, accountID int64) error {
	db := GetDb()
	now := time.Now()

	_, err := db.NewUpdate().
		Model((*types.Category)(nil)).
		Set("deleted_date = ?", now).
		Where("id = ?", id).
		Where("account_id = ?", accountID).
		Where("deleted_date IS NULL").
		Exec(context.Background())
	return err
}
