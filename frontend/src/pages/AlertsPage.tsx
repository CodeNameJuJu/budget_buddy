import { useEffect, useState } from "react"
import { Bell, BellOff, Check, Settings, Info, AlertTriangle, AlertCircle, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { alertsApi, type Alert, type AlertPreference } from "@/lib/api"
import { formatDate } from "@/lib/utils"

const ACCOUNT_ID = 1

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [preferences, setPreferences] = useState<AlertPreference[]>([])
  const [loading, setLoading] = useState(true)
  const [showPreferences, setShowPreferences] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [alertsRes, prefsRes] = await Promise.all([
        alertsApi.list(ACCOUNT_ID),
        alertsApi.getPreferences(ACCOUNT_ID),
      ])
      setAlerts(alertsRes.data || [])
      setPreferences(prefsRes.data || [])
      setUnreadCount(alertsRes.data?.filter(a => !a.is_read).length || 0)
    } catch (error) {
      console.error("Failed to load alerts", error)
    } finally {
      setLoading(false)
    }
  }

  async function markAsRead(alertID: number) {
    try {
      await alertsApi.markAsRead(alertID)
      setAlerts(alerts.map(alert => 
        alert.id === alertID ? { ...alert, is_read: true } : alert
      ))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error("Failed to mark alert as read", error)
    }
  }

  async function markAllAsRead() {
    try {
      await alertsApi.markAllAsRead(ACCOUNT_ID)
      setAlerts(alerts.map(alert => ({ ...alert, is_read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error("Failed to mark all alerts as read", error)
    }
  }

  async function updatePreference(preference: AlertPreference) {
    try {
      const updated = await alertsApi.updatePreference({
        account_id: ACCOUNT_ID,
        type: preference.type,
        enabled: preference.enabled,
        threshold: preference.threshold,
      })
      setPreferences(preferences.map(p => 
        p.type === preference.type ? updated.data : p
      ))
    } catch (error) {
      console.error("Failed to update preference", error)
    }
  }

  async function triggerAlerts() {
    try {
      await alertsApi.triggerAlerts(ACCOUNT_ID)
      loadData() // Reload alerts to show newly generated ones
    } catch (error) {
      console.error("Failed to trigger alerts", error)
    }
  }

  function getAlertIcon(severity: string) {
    switch (severity) {
      case "critical": return <AlertTriangle className="h-4 w-4 text-red-500" />
      case "warning": return <AlertCircle className="h-4 w-4 text-yellow-500" />
      default: return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  function getSeverityColor(severity: string) {
    switch (severity) {
      case "critical": return "border-red-500 bg-red-50 dark:bg-red-900/20"
      case "warning": return "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20"
      default: return "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
    }
  }

  function getAlertTypeLabel(type: string) {
    switch (type) {
      case "budget_threshold": return "Budget Threshold"
      case "budget_exceeded": return "Budget Exceeded"
      case "goal_achieved": return "Goal Achieved"
      case "goal_milestone": return "Goal Milestone"
      case "weekly_summary": return "Weekly Summary"
      case "monthly_summary": return "Monthly Summary"
      default: return type
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading alerts...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Bell className="h-6 w-6" />
            Alerts
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </h1>
          <p className="text-muted-foreground">Stay informed about your finances</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={triggerAlerts} variant="outline" size="sm">
            Check for New Alerts
          </Button>
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead} variant="outline" size="sm">
              Mark All as Read
            </Button>
          )}
          <Button onClick={() => setShowPreferences(!showPreferences)} variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Preferences
          </Button>
        </div>
      </div>

      {/* Alert Preferences */}
      {showPreferences && (
        <Card>
          <CardHeader>
            <CardTitle>Alert Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {preferences.map((pref) => (
              <div key={pref.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <Label className="font-medium">{getAlertTypeLabel(pref.type)}</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {pref.type === "budget_threshold" && 
                      "Get notified when you reach a certain percentage of your budget"
                    }
                    {pref.type === "goal_achieved" && 
                      "Get notified when you achieve your savings goals"
                    }
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  {pref.type === "budget_threshold" && (
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`threshold-${pref.id}`} className="text-sm">Threshold:</Label>
                      <Input
                        id={`threshold-${pref.id}`}
                        type="number"
                        min="1"
                        max="100"
                        value={pref.threshold || 70}
                        onChange={(e) => {
                          const newPref = { ...pref, threshold: parseInt(e.target.value) }
                          setPreferences(preferences.map(p => p.id === pref.id ? newPref : p))
                          updatePreference(newPref)
                        }}
                        className="w-16 h-8 text-sm"
                      />
                      <span className="text-sm text-muted-foreground">%</span>
                    </div>
                  )}
                  <Switch
                    checked={pref.enabled}
                    onCheckedChange={(enabled: boolean) => {
                      const newPref = { ...pref, enabled }
                      setPreferences(preferences.map(p => p.id === pref.id ? newPref : p))
                      updatePreference(newPref)
                    }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Alerts List */}
      <div className="space-y-4">
        {alerts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BellOff className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No alerts</h3>
              <p className="text-muted-foreground text-center mt-2">
                You're all caught up! Check back later for new notifications.
              </p>
            </CardContent>
          </Card>
        ) : (
          alerts.map((alert) => (
            <Card 
              key={alert.id} 
              className={`transition-all duration-200 ${!alert.is_read ? 'shadow-md' : ''} ${getSeverityColor(alert.severity)}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {getAlertIcon(alert.severity)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{alert.title}</h4>
                        {!alert.is_read && (
                          <Badge variant="secondary" className="text-xs">
                            New
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{alert.message}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatDate(alert.created_date)}</span>
                        <span>•</span>
                        <span>{getAlertTypeLabel(alert.type)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {!alert.is_read && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => markAsRead(alert.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
