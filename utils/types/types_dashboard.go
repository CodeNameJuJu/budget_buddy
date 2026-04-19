package types

import (
	"time"

	"github.com/uptrace/bun"
)

// WidgetType represents different widget types
type WidgetType string

const (
	WidgetBalance            WidgetType = "balance"
	WidgetRecentTransactions WidgetType = "recent_transactions"
	WidgetBudgetProgress     WidgetType = "budget_progress"
	WidgetGoalsOverview      WidgetType = "goals_overview"
	WidgetSpendingTrends     WidgetType = "spending_trends"
	WidgetCategoryBreakdown  WidgetType = "category_breakdown"
	WidgetFinancialHealth    WidgetType = "financial_health"
	WidgetAlerts             WidgetType = "alerts"
	WidgetSavingsSummary     WidgetType = "savings_summary"
)

// WidgetSize represents widget size options
type WidgetSize string

const (
	SizeSmall  WidgetSize = "small"
	SizeMedium WidgetSize = "medium"
	SizeLarge  WidgetSize = "large"
	SizeFull   WidgetSize = "full"
)

// DashboardLayout represents a user's dashboard configuration
type DashboardLayout struct {
	bun.BaseModel `bun:"table:dashboard_layouts,alias:dl"`

	ID        int64  `json:"id" bun:"id,pk,autoincrement"`
	AccountID int64  `json:"account_id" bun:"account_id,notnull"`
	Name      string `json:"name" bun:"name,notnull"` // e.g., "Main Dashboard"
	IsActive  bool   `json:"is_active" bun:"is_active,notnull,default:true"`
	Layout    string `json:"layout" bun:"layout,notnull"` // JSON configuration

	Timestamps
}

// Widget represents a single widget on the dashboard
type Widget struct {
	ID        string     `json:"id"` // Unique identifier for this widget instance
	Type      WidgetType `json:"type"`
	Title     string     `json:"title"`
	Size      WidgetSize `json:"size"`
	Position  Position   `json:"position"`
	Config    string     `json:"config,omitempty"` // JSON configuration specific to widget type
	IsVisible bool       `json:"is_visible"`
	UpdatedAt time.Time  `json:"updated_at"`
}

// Position represents widget position on the grid
type Position struct {
	X int `json:"x"`
	Y int `json:"y"`
	W int `json:"w"` // width
	H int `json:"h"` // height
}

// WidgetDefinition defines available widget types and their properties
type WidgetDefinition struct {
	Type         WidgetType   `json:"type"`
	Name         string       `json:"name"`
	Description  string       `json:"description"`
	DefaultSize  WidgetSize   `json:"default_size"`
	Sizes        []WidgetSize `json:"available_sizes"`
	MinSize      WidgetSize   `json:"min_size"`
	MaxSize      WidgetSize   `json:"max_size"`
	Configurable bool         `json:"configurable"`
}

// WidgetData represents the data payload for a widget
type WidgetData struct {
	WidgetID    string      `json:"widget_id"`
	Type        WidgetType  `json:"type"`
	Data        interface{} `json:"data"`
	Error       *string     `json:"error,omitempty"`
	LastUpdated time.Time   `json:"last_updated"`
}
