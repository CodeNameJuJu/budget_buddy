import { useState, useEffect } from "react"
import {
  Bell,
  BellOff,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Info,
  Check,
  Settings,
  ChevronDown,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { alertsApi, accountsApi, type Alert, type AlertPreference, type Account } from "@/lib/api"
import { formatDate } from "@/lib/utils"

export default function AlertsPage() {
  const [accountId, setAccountId] = useState<number | null>(null)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [preferences, setPreferences] = useState<AlertPreference[]>([])
  const [loading, setLoading] = useState(true)
  const [showPreferences, setShowPreferences] = useState(false)
  const [alertType, setAlertType] = useState<string>("")
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    loadUserAccount()
  }, [])

  useEffect(() => {
    if (accountId) {
      loadData()
    }
  }, [accountId])

  async function loadUserAccount() {
    try {
      const response = await accountsApi.getMyAccount()
      if (response.data && response.data.length > 0) {
        setAccountId(response.data[0].id)
      }
    } catch (error) {
      console.error("Failed to load user account", error)
    }
  }

  async function loadData() {
    if (!accountId) return
    
    setLoading(true)
    try {
      const [alertsRes, prefsRes] = await Promise.all([
        alertsApi.list(accountId),
        alertsApi.getPreferences(accountId),
      ])
      setAlerts(alertsRes.data || [])
      setPreferences(prefsRes.data || [])
      setUnreadCount(alertsRes.data?.filter(a => !a.is_read).length || 0)
    } catch {
      console.error("Failed to load alerts")
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
    if (!accountId) return
    
    try {
      await alertsApi.markAllAsRead(accountId)
      setAlerts(alerts.map(alert => ({ ...alert, is_read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error("Failed to mark all as read", error)
    }
  }

  async function updatePreference(preference: AlertPreference) {
    if (!accountId) return
    
    try {
      const updated = await alertsApi.updatePreference({
        account_id: accountId,
        type: preference.type,
        enabled: preference.enabled,
        threshold: preference.threshold,
      })
      setPreferences(preferences.map(p => 
        p.id === preference.id ? updated.data : p
      ))
    } catch (error) {
      console.error("Failed to update preference", error)
    }
  }

  async function triggerAlerts() {
    if (!accountId) return
    
    try {
      await alertsApi.triggerAlerts(accountId, alertType)
      loadData() // Reload alerts to show newly generated ones
    } catch (error) {
      console.error("Failed to trigger alerts", error)
    }
  }

  function getAlertIcon(severity: string) {
    switch (severity) {
      case "critical": return <AlertTriangle className="h-4 w-4 text-red-400" />
      case "warning": return <AlertCircle className="h-4 w-4 text-yellow-400" />
      default: return <Info className="h-4 w-4 text-blue-400" />
    }
  }

  function getSeverityColor(severity: string) {
    switch (severity) {
      case "critical": return "border-red-500/50 bg-red-900/20"
      case "warning": return "border-yellow-500/50 bg-yellow-900/20"
      default: return "border-blue-500/50 bg-blue-900/20"
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
        <p className="text-slate-400">Loading alerts...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <Bell className="h-6 w-6" />
            Alerts
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </h1>
          <p className="text-slate-400">Stay informed about your finances</p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                {alertType === "" ? "All Alerts" : alertType === "weekly" ? "Weekly" : alertType === "monthly" ? "Monthly" : alertType}
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setAlertType("")}>All Alerts</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setAlertType("weekly")}>Weekly Summary</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setAlertType("monthly")}>Monthly Summary</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle>Alert Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {preferences.map((pref) => (
              <div key={pref.id} className="flex items-center justify-between p-3 border border-slate-600 rounded-lg">
                <div className="flex-1">
                  <Label className="font-medium">{getAlertTypeLabel(pref.type)}</Label>
                  <p className="text-sm text-slate-400 mt-1">
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
                      <span className="text-sm text-slate-400">%</span>
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
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BellOff className="h-12 w-12 text-slate-500 mb-4" />
              <h3 className="text-lg font-medium text-slate-100">No alerts</h3>
              <p className="text-slate-400 text-center mt-2">
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
                      <p className="text-sm text-slate-400 mb-2">{alert.message}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
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
