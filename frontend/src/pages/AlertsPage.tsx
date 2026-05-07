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
  ExternalLink,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { alertsApi, accountsApi, type Alert, type AlertPreference, type Account } from "@/lib/api"
import { formatDate } from "@/lib/utils"
import { useTheme } from "@/contexts/ThemeContext"
import { cn } from "@/lib/utils"
import { useNavigate } from "react-router-dom"

export default function AlertsPage() {
  const { theme } = useTheme()
  const navigate = useNavigate()
  const [accountId, setAccountId] = useState<number | null>(null)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [preferences, setPreferences] = useState<AlertPreference[]>([])
  const [loading, setLoading] = useState(true)
  const [showPreferences, setShowPreferences] = useState(false)
  const [alertType, setAlertType] = useState<string>("all")
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
      const alertTypeToSend = alertType === "all" ? "" : alertType
      await alertsApi.triggerAlerts(accountId, alertTypeToSend)
      loadData() // Reload alerts to show newly generated ones
    } catch (error) {
      console.error("Failed to trigger alerts", error)
    }
  }

  function getAlertIcon(severity: string) {
    switch (severity) {
      case "critical": return <AlertTriangle className="h-4 w-4 text-red-400" />
      case "warning": return <AlertCircle className={cn(
        "h-4 w-4",
        theme === "light" ? "text-[#C97C5D]" : "text-[#B46B52]"
      )} />
      default: return <Info className={cn(
        "h-4 w-4",
        theme === "light" ? "text-[#6BAF92]" : "text-[#88B39B]"
      )} />
    }
  }

  function getSeverityColor(severity: string) {
    switch (severity) {
      case "critical": return "border-red-500/50 bg-red-900/20"
      case "warning": return theme === "light" ? "border-[#C97C5D]/50 bg-[#C97C5D]/20" : "border-[#B46B52]/50 bg-[#B46B52]/20"
      default: return theme === "light" ? "border-[#6BAF92]/50 bg-[#6BAF92]/20" : "border-[#6BAF92]/50 bg-[#6BAF92]/20"
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
      case "unusual_transaction": return "Unusual Transaction"
      case "bill_reminder": return "Bill Reminder"
      case "bill_overdue": return "Bill Overdue"
      default: return type
    }
  }

  function getAlertNavigation(alert: Alert): { path: string; label: string } | null {
    if (!alert.reference_id) return null

    switch (alert.type) {
      case "budget_threshold":
      case "budget_exceeded":
        return { path: "/finance", label: "View Budget" }
      case "goal_achieved":
      case "goal_milestone":
        return { path: "/savings", label: "View Goal" }
      case "unusual_transaction":
        return { path: "/finance", label: "View Transaction" }
      case "bill_reminder":
      case "bill_overdue":
        return { path: "/finance", label: "View Bill" }
      default:
        return null
    }
  }

  function getQuickActions(alert: Alert): { label: string; action: () => void }[] {
    const actions: { label: string; action: () => void }[] = []

    switch (alert.type) {
      case "budget_threshold":
      case "budget_exceeded":
        actions.push({ label: "Adjust Budget", action: () => navigate("/finance") })
        break
      case "goal_achieved":
      case "goal_milestone":
        actions.push({ label: "View Goal", action: () => navigate("/savings") })
        break
      case "unusual_transaction":
        actions.push({ label: "View Transaction", action: () => navigate("/finance") })
        break
      case "bill_reminder":
      case "bill_overdue":
        actions.push({ label: "Pay Bill", action: () => navigate("/finance") })
        break
    }

    return actions
  }

  function handleAlertClick(alert: Alert) {
    const nav = getAlertNavigation(alert)
    if (nav) {
      navigate(nav.path)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className={theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]"}>Loading alerts...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 px-2 sm:px-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={cn(
            "text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2",
            theme === "light" ? "text-[#1F2A24]" : "text-[#E7EFEA]"
          )}>
            <Bell className="h-5 w-5 sm:h-6 sm:w-6" />
            Alerts
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2 text-xs">
                {unreadCount}
              </Badge>
            )}
          </h1>
          <p className={cn("text-sm sm:text-base", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>Stay informed about your finances</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <select
            value={alertType}
            onChange={(e) => setAlertType(e.target.value)}
            className={cn(
              "flex h-10 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 flex-1 sm:flex-none sm:w-[140px]",
              theme === "light"
                ? "border-[#E6E0D6] bg-white text-[#1F2A24] focus:ring-[#D9B44A]"
                : "border-[#2E3B35] bg-[#18231D] text-[#E7EFEA] focus:ring-[#C9A24A]"
            )}
          >
            <option value="all">All Alerts</option>
            <option value="weekly">Weekly Summary</option>
            <option value="monthly">Monthly Summary</option>
          </select>
          <Button onClick={triggerAlerts} variant="outline" size="sm" className="flex-1 sm:flex-none">
            Check for New Alerts
          </Button>
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead} variant="outline" size="sm" className="flex-1 sm:flex-none">
              Mark All as Read
            </Button>
          )}
          <Button onClick={() => setShowPreferences(!showPreferences)} variant="outline" size="sm" className="flex-1 sm:flex-none">
            <Settings className="h-4 w-4 mr-2" />
            Preferences
          </Button>
        </div>
      </div>

      {/* Alert Preferences */}
      {showPreferences && (
        <Card className={cn(
          "border",
          theme === "light" ? "bg-[#E8DCC5]/50 border-[#E6E0D6]" : "bg-[#18231D]/50 border-[#2E3B35]"
        )}>
          <CardHeader>
            <CardTitle className={cn("text-base sm:text-lg", theme === "light" ? "text-[#1F2A24]" : "text-[#E7EFEA]")}>Alert Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {preferences.map((pref) => (
              <div key={pref.id} className={cn(
                "flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 border rounded-lg",
                theme === "light" ? "border-[#E6E0D6]" : "border-[#2E3B35]"
              )}>
                <div className="flex-1">
                  <Label className={cn("font-medium text-sm sm:text-base", theme === "light" ? "text-[#1F2A24]" : "text-[#E7EFEA]")}>{getAlertTypeLabel(pref.type)}</Label>
                  <p className={cn(
                    "text-xs sm:text-sm mt-1",
                    theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]"
                  )}>
                    {pref.type === "budget_threshold" && 
                      "Get notified when you reach a certain percentage of your budget"
                    }
                    {pref.type === "goal_achieved" && 
                      "Get notified when you achieve your savings goals"
                    }
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
                  {pref.type === "budget_threshold" && (
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`threshold-${pref.id}`} className={cn("text-xs sm:text-sm", theme === "light" ? "text-[#1F2A24]" : "text-[#E7EFEA]")}>Threshold:</Label>
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
                      <span className={cn("text-xs sm:text-sm", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>%</span>
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
          <Card className={cn(
            "border",
            theme === "light" ? "bg-[#E8DCC5]/50 border-[#E6E0D6]" : "bg-[#18231D]/50 border-[#2E3B35]"
          )}>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BellOff className={cn(
                "h-12 w-12 mb-4",
                theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]"
              )} />
              <h3 className={cn(
                "text-lg font-medium",
                theme === "light" ? "text-[#1F2A24]" : "text-[#E7EFEA]"
              )}>No alerts</h3>
              <p className={cn(
                "text-center mt-2",
                theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]"
              )}>
                You're all caught up! Check back later for new notifications.
              </p>
            </CardContent>
          </Card>
        ) : (
          alerts.map((alert) => (
            <Card
              key={alert.id}
              className={`transition-all duration-200 ${!alert.is_read ? 'shadow-md' : ''} ${getSeverityColor(alert.severity)} ${getAlertNavigation(alert) ? 'cursor-pointer hover:shadow-lg' : ''}`}
              onClick={() => {
                const nav = getAlertNavigation(alert)
                if (nav) {
                  handleAlertClick(alert)
                }
              }}
            >
              <CardContent className="p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    {getAlertIcon(alert.severity)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h4 className="font-medium text-sm sm:text-base">{alert.title}</h4>
                        {!alert.is_read && (
                          <Badge variant="secondary" className="text-xs">
                            New
                          </Badge>
                        )}
                        {getAlertNavigation(alert) && (
                          <Badge variant="outline" className="text-xs flex items-center gap-1">
                            <ExternalLink className="h-3 w-3" />
                            {getAlertNavigation(alert)?.label}
                          </Badge>
                        )}
                      </div>
                      <p className={cn(
                        "text-xs sm:text-sm mb-2",
                        theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]"
                      )}>{alert.message}</p>
                      <div className={cn(
                        "flex flex-wrap items-center gap-2 text-xs",
                        theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]"
                      )}>
                        <span>{formatDate(alert.created_date)}</span>
                        <span>•</span>
                        <span>{getAlertTypeLabel(alert.type)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:ml-4 w-full sm:w-auto justify-end">
                    {getQuickActions(alert).map((action, idx) => (
                      <Button
                        key={idx}
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          action.action()
                        }}
                        className="text-xs h-8"
                      >
                        {action.label}
                      </Button>
                    ))}
                    {!alert.is_read && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          markAsRead(alert.id)
                        }}
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
