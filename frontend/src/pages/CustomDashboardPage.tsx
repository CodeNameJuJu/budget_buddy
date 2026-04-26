import { useEffect, useState } from "react"
import { LayoutDashboard, Settings, Plus, X, Check } from "lucide-react"
import { useAuth } from "@/hooks"
import WidgetRenderer from "@/components/widgets/WidgetRenderer"
import { accountsApi, dashboardApi } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Widget {
  id: string
  type: string
  title: string
  size: string
  position: { x: number; y: number; w: number; h: number }
  is_visible: boolean
  updated_at: string
}

export default function CustomDashboardPage() {
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const [widgets, setWidgets] = useState<Widget[]>([])
  const [accountId, setAccountId] = useState<number | null>(null)
  const [isCustomizing, setIsCustomizing] = useState(false)
  const [availableWidgets, setAvailableWidgets] = useState<any[]>([])
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    loadUserAccount()
  }, [])

  useEffect(() => {
    if (accountId) {
      loadWidgets()
      loadAvailableWidgets()
      // Simulate loading
      setTimeout(() => {
        setLoading(false)
      }, 1000)
    }
  }, [accountId])

  async function loadWidgets() {
    try {
      const response = await dashboardApi.getLayout(accountId)
      if (response.data) {
        // Parse layout from JSON string
        const layout = JSON.parse(response.data.layout)
        setWidgets(layout)
      } else {
        setWidgets(getCustomLayout())
      }
    } catch {
      setWidgets(getCustomLayout())
    }
  }

  async function loadAvailableWidgets() {
    try {
      const response = await dashboardApi.getAvailableWidgets()
      setAvailableWidgets(response.data || [])
    } catch (error) {
      console.error("Failed to load available widgets", error)
    }
  }

  function toggleWidgetVisibility(widgetId: string) {
    setWidgets(widgets.map(w =>
      w.id === widgetId ? { ...w, is_visible: !w.is_visible } : w
    ))
  }

  async function saveLayout() {
    if (!accountId) return
    setIsSaving(true)
    try {
      await dashboardApi.saveLayout({
        account_id: accountId,
        name: "Default",
        layout: JSON.stringify(widgets)
      })
      setIsCustomizing(false)
    } catch (error) {
      console.error("Failed to save layout", error)
    } finally {
      setIsSaving(false)
    }
  }

  function addWidget(widgetType: string, widgetTitle: string) {
    const newWidget: Widget = {
      id: `${widgetType}-${Date.now()}`,
      type: widgetType,
      title: widgetTitle,
      size: "medium",
      position: { x: 0, y: widgets.length * 3, w: 6, h: 3 },
      is_visible: true,
      updated_at: new Date().toISOString()
    }
    setWidgets([...widgets, newWidget])
  }

  function removeWidget(widgetId: string) {
    setWidgets(widgets.filter(w => w.id !== widgetId))
  }

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

  // Clean layout with proper widget sizing
  function getCustomLayout(): Widget[] {
    return [
      {
        id: "welcome-1",
        type: "welcome",
        title: "Welcome to Budget Buddy",
        size: "large",
        position: { x: 0, y: 0, w: 12, h: 4 },
        is_visible: true,
        updated_at: ""
      },
      {
        id: "getting-started-1",
        type: "getting_started",
        title: "Getting Started",
        size: "medium",
        position: { x: 0, y: 4, w: 6, h: 3 },
        is_visible: true,
        updated_at: ""
      },
      {
        id: "recent-transactions-1",
        type: "recent_transactions",
        title: "Recent Transactions",
        size: "medium",
        position: { x: 6, y: 4, w: 6, h: 3 },
        is_visible: true,
        updated_at: ""
      },
      {
        id: "savings-withdrawals-1",
        type: "savings_withdrawals",
        title: "Savings Withdrawals",
        size: "medium",
        position: { x: 0, y: 7, w: 6, h: 4 },
        is_visible: true,
        updated_at: ""
      },
      {
        id: "spending-trends-1",
        type: "spending_trends",
        title: "Spending Trends",
        size: "medium",
        position: { x: 6, y: 7, w: 6, h: 4 },
        is_visible: true,
        updated_at: ""
      },
      {
        id: "goals-overview-1",
        type: "goals_overview",
        title: "Savings Goals",
        size: "medium",
        position: { x: 0, y: 11, w: 12, h: 4 },
        is_visible: true,
        updated_at: ""
      }
    ]
  }

  if (loading) {
    return (
      <div className="space-y-4 xs:space-y-6">
        <div className="responsive-margin">
          <h1 className="mobile-title flex items-center gap-2 text-slate-100">
            <LayoutDashboard className="h-4 w-4 xs:h-5 xs:w-5 lg:h-6 lg:w-6" />
            Dashboard
          </h1>
          <p className="mobile-text text-slate-400">Your elegant financial overview</p>
        </div>
        
        <div className="grid-responsive-xs">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-24 xs:h-32 lg:h-40">
              <div className="h-full bg-blue-800/30 rounded-lg animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 xs:space-y-6">
      <div className="responsive-margin flex items-center justify-between" data-tutorial="dashboard">
        <div>
          <h1 className="mobile-title flex items-center gap-2 text-slate-100">
            <LayoutDashboard className="h-4 w-4 xs:h-5 xs:w-5 lg:h-6 lg:w-6" />
            Dashboard
          </h1>
          <p className="mobile-text text-slate-400">Your elegant financial overview</p>
        </div>
        <Button
          onClick={() => setIsCustomizing(!isCustomizing)}
          variant={isCustomizing ? "default" : "outline"}
          className={isCustomizing ? "bg-emerald-600 hover:bg-emerald-700" : "border-slate-600 text-slate-300"}
        >
          {isCustomizing ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Done
            </>
          ) : (
            <>
              <Settings className="h-4 w-4 mr-2" />
              Customize
            </>
          )}
        </Button>
      </div>

      {/* Customization Panel */}
      {isCustomizing && (
        <div className="responsive-margin">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-100">Customize Dashboard</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current Widgets */}
              <div>
                <h3 className="text-sm font-medium text-slate-400 mb-3">Current Widgets</h3>
                <div className="grid gap-2">
                  {widgets.map((widget) => (
                    <div
                      key={widget.id}
                      className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={widget.is_visible}
                          onChange={() => toggleWidgetVisibility(widget.id)}
                          className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-slate-200">{widget.title}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeWidget(widget.id)}
                        className="text-slate-400 hover:text-red-400 h-8 w-8"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Available Widgets */}
              {availableWidgets.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-slate-400 mb-3">Add Widgets</h3>
                  <div className="grid gap-2">
                    {availableWidgets
                      .filter(aw => !widgets.some(w => w.type === aw.type))
                      .map((availableWidget) => (
                        <Button
                          key={availableWidget.type}
                          variant="outline"
                          onClick={() => addWidget(availableWidget.type, availableWidget.name)}
                          className="justify-start border-slate-600 text-slate-300 hover:bg-slate-800"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          {availableWidget.name}
                        </Button>
                      ))}
                  </div>
                </div>
              )}

              {/* Save Button */}
              <Button
                onClick={saveLayout}
                disabled={isSaving}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                {isSaving ? "Saving..." : "Save Layout"}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Widget Grid */}
      <div className="responsive-margin">
        <div className="grid-responsive">
          {accountId && widgets
            .filter(w => w.is_visible)
            .map((widget) => (
            <WidgetRenderer
              key={widget.id}
              widget={widget}
              accountId={accountId}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
