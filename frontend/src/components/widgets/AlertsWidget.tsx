import { useEffect, useState } from "react"
import { Bell, AlertTriangle, CheckCircle, Info, ChevronDown, ChevronUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { dashboardApi } from "@/lib/api"
import { formatDate } from "@/lib/utils"
import { useTheme } from "@/contexts/ThemeContext"
import { cn } from "@/lib/utils"

interface AlertsWidgetProps {
  accountId: number
  size?: string
}

interface Alert {
  id: number
  type: "warning" | "error" | "success" | "info"
  message: string
  created_at: string
  is_read: boolean
}

interface AlertsData {
  alerts: Alert[]
  unread_count: number
}

export default function AlertsWidget({ accountId, size }: AlertsWidgetProps) {
  const [data, setData] = useState<AlertsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isExpanded, setIsExpanded] = useState(false)
  const { theme } = useTheme()

  useEffect(() => {
    loadData()
  }, [accountId])

  async function loadData() {
    try {
      const response = await dashboardApi.getWidgetData(accountId, "alerts")
      setData(response.data)
    } catch (error) {
      console.error("Failed to load alerts widget data", error)
    } finally {
      setLoading(false)
    }
  }

  function getAlertIcon(type: string) {
    switch (type) {
      case "warning":
        return <AlertTriangle className={cn("h-4 w-4", theme === "light" ? "text-[#D9B44A]" : "text-[#C9A24A]")} />
      case "error":
        return <AlertTriangle className="h-4 w-4 text-red-400" />
      case "success":
        return <CheckCircle className={cn(
          "h-4 w-4",
          theme === "light" ? "text-[#6BAF92]" : "text-[#A8D5BA]"
        )} />
      default:
        return <Info className={cn("h-4 w-4", theme === "light" ? "text-[#6BAF92]" : "text-[#88B39B]")} />
    }
  }

  function getAlertBadge(type: string) {
    switch (type) {
      case "warning":
        return <Badge variant="secondary" className={cn(theme === "light" ? "bg-[#D9B44A]/20 text-[#D9B44A] border-[#D9B44A]/50" : "bg-[#C9A24A]/20 text-[#C9A24A] border-[#C9A24A]/50")}>Warning</Badge>
      case "error":
        return <Badge variant="destructive">Error</Badge>
      case "success":
        return <Badge className={cn(
          theme === "light" ? "bg-[#6BAF92]" : "bg-[#6BAF92]"
        )}>Success</Badge>
      default:
        return <Badge variant="outline">Info</Badge>
    }
  }

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className={cn("text-sm font-medium flex items-center gap-2", theme === "light" ? "text-[#1F2A24]" : "text-[#E7EFEA]")}>
            <Bell className="h-4 w-4" />
            Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <div className="animate-pulse bg-muted h-4 w-20 rounded"></div>
                <div className="animate-pulse bg-muted h-2 w-full rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data || !data.alerts || data.alerts.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className={cn("text-sm font-medium flex items-center gap-2", theme === "light" ? "text-[#1F2A24]" : "text-[#E7EFEA]")}>
            <Bell className="h-4 w-4" />
            Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm mb-2">No alerts</p>
            <p className="text-xs">You're all caught up!</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const defaultDisplayCount = size === "small" ? 2 : size === "large" ? 8 : 5
  const displayCount = isExpanded ? data.alerts.length : defaultDisplayCount
  const alerts = data.alerts.slice(0, displayCount)
  const hasMore = data.alerts.length > defaultDisplayCount

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className={cn("text-sm font-medium flex items-center justify-between", theme === "light" ? "text-[#1F2A24]" : "text-[#E7EFEA]")}>
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Alerts
            {data.unread_count > 0 && (
              <Badge variant="destructive" className="text-xs">
                {data.unread_count}
              </Badge>
            )}
          </div>
          {hasMore && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-6 px-2 text-xs"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-3 w-3 mr-1" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3 mr-1" />
                  Show All ({data.alerts.length})
                </>
              )}
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden flex flex-col">
        <div className="space-y-3 flex-1 overflow-auto">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={cn("p-3 rounded-lg border",
                alert.is_read
                  ? (theme === "light" ? "bg-[#E8DCC5]/30 border-[#E6E0D6]/50" : "bg-[#18231D]/30 border-[#2E3B35]/50")
                  : (theme === "light" ? "bg-[#E8DCC5]/60 border-[#E6E0D6]" : "bg-[#18231D]/60 border-[#2E3B35]")
              )}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex-shrink-0">{getAlertIcon(alert.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    {getAlertBadge(alert.type)}
                    {!alert.is_read && (
                      <span className={cn(
                        "w-2 h-2 rounded-full flex-shrink-0",
                        theme === "light" ? "bg-[#6BAF92]" : "bg-[#6BAF92]"
                      )}></span>
                    )}
                  </div>
                  <p className="text-sm truncate">{alert.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{formatDate(alert.created_at)}</p>
                </div>
              </div>
            </div>
          ))}
          
          {!isExpanded && hasMore && (
            <div className="text-center pt-2">
              <p className="text-xs text-muted-foreground">
                {data.alerts.length - defaultDisplayCount} more alerts
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
