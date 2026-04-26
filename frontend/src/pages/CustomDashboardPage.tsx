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
    <div className="responsive-margin py-6 xs:py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 xs:mb-8" data-tutorial="dashboard">
          <div>
            <h1 className="text-2xl xs:text-3xl font-bold bg-gradient-to-r from-emerald-300 to-green-300 bg-clip-text text-transparent flex items-center gap-3">
              <LayoutDashboard className="h-6 w-6 xs:h-7 xs:w-7 lg:h-8 lg:w-8 text-emerald-400" />
              Dashboard
            </h1>
            <p className="text-slate-400 mt-1 text-sm xs:text-base">Your elegant financial overview</p>
          </div>
          <Button
            onClick={() => setIsCustomizing(!isCustomizing)}
            variant={isCustomizing ? "default" : "outline"}
            className={isCustomizing 
              ? "bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-lg shadow-emerald-500/20" 
              : "border-slate-600 text-slate-300 hover:bg-slate-800 hover:border-slate-500"
            }
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
          <Card className="mb-6 bg-slate-800/80 backdrop-blur-xl border-slate-700/50 shadow-xl">
            <CardHeader>
              <CardTitle className="text-slate-100 flex items-center gap-2">
                <Settings className="h-5 w-5 text-emerald-400" />
                Customize Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Current Widgets */}
              <div>
                <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                  Current Widgets
                </h3>
                <div className="grid gap-3">
                  {widgets.map((widget) => (
                    <div
                      key={widget.id}
                      className="flex items-center justify-between p-4 bg-slate-900/60 rounded-xl border border-slate-700/50 hover:border-slate-600 transition-all duration-200"
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={widget.is_visible}
                          onChange={() => toggleWidgetVisibility(widget.id)}
                          className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0 cursor-pointer"
                        />
                        <span className="text-slate-200 font-medium">{widget.title}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeWidget(widget.id)}
                        className="text-slate-400 hover:text-red-400 hover:bg-red-500/10 h-9 w-9 transition-colors"
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
                  <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    Add Widgets
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {availableWidgets
                      .filter(aw => !widgets.some(w => w.type === aw.type))
                      .map((availableWidget) => (
                        <Button
                          key={availableWidget.type}
                          variant="outline"
                          onClick={() => addWidget(availableWidget.type, availableWidget.name)}
                          className="justify-start border-slate-600 text-slate-300 hover:bg-slate-800 hover:border-emerald-500/50 hover:text-emerald-300 transition-all duration-200"
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
                className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-medium shadow-lg shadow-emerald-500/20 transition-all duration-200"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                    Saving...
                  </>
                ) : (
                  "Save Layout"
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Widget Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
  )
}
