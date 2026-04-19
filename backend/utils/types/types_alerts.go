package types

import (
	"time"

	"github.com/uptrace/bun"
)

type AlertType string

const (
	AlertBudgetThreshold    AlertType = "budget_threshold"
	AlertBudgetExceeded     AlertType = "budget_exceeded"
	AlertGoalAchieved       AlertType = "goal_achieved"
	AlertGoalMilestone      AlertType = "goal_milestone"
	AlertWeeklySummary      AlertType = "weekly_summary"
	AlertMonthlySummary     AlertType = "monthly_summary"
)

type AlertSeverity string

const (
	SeverityInfo     AlertSeverity = "info"
	SeverityWarning  AlertSeverity = "warning"
	SeverityCritical AlertSeverity = "critical"
)

// Alert represents a notification for the user
type Alert struct {
	bun.BaseModel `bun:"table:alerts,alias:a"`

	ID          int64          `json:"id" bun:"id,pk,autoincrement"`
	AccountID   int64          `json:"account_id" bun:"account_id,notnull"`
	Type        AlertType      `json:"type" bun:"type,notnull"`
	Title       string         `json:"title" bun:"title,notnull"`
	Message     string         `json:"message" bun:"message,notnull"`
	Severity    AlertSeverity  `json:"severity" bun:"severity,notnull"`
	IsRead      bool           `json:"is_read" bun:"is_read,notnull,default:false"`
	ExpiresAt   *time.Time     `json:"expires_at,omitempty" bun:"expires_at"`
	ReferenceID *int64         `json:"reference_id,omitempty" bun:"reference_id"` // ID of related entity (budget, goal, etc.)
	Metadata    *string        `json:"metadata,omitempty" bun:"metadata"` // JSON metadata

	Timestamps
}

// AlertPreference represents user notification preferences
type AlertPreference struct {
	bun.BaseModel `bun:"table:alert_preferences,alias:ap"`

	ID        int64     `json:"id" bun:"id,pk,autoincrement"`
	AccountID int64     `json:"account_id" bun:"account_id,notnull"`
	Type      AlertType `json:"type" bun:"type,notnull"`
	Enabled   bool      `json:"enabled" bun:"enabled,notnull,default:true"`
	Threshold *int      `json:"threshold,omitempty" bun:"threshold"` // For threshold-based alerts

	Timestamps
}

// AlertRule represents automated alert rules
type AlertRule struct {
	bun.BaseModel `bun:"table:alert_rules,alias:ar"`

	ID          int64           `json:"id" bun:"id,pk,autoincrement"`
	AccountID   int64           `json:"account_id" bun:"account_id,notnull"`
	Type        AlertType       `json:"type" bun:"type,notnull"`
	Name        string          `json:"name" bun:"name,notnull"`
	Description *string         `json:"description,omitempty" bun:"description"`
	Conditions  string          `json:"conditions" bun:"conditions,notnull"` // JSON conditions
	IsActive    bool            `json:"is_active" bun:"is_active,notnull,default:true"`
	LastTrigger *time.Time      `json:"last_triggered,omitempty" bun:"last_triggered"`

	Timestamps
}
