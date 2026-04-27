import { useEffect, useState, useCallback } from "react"
import { LayoutDashboard, Settings, Plus, X, Check, GripVertical, Edit2 } from "lucide-react"
import { useAuth } from "@/hooks"
import { useTheme } from "@/contexts/ThemeContext"
import { cn } from "@/lib/utils"
import WidgetRenderer from "@/components/widgets/WidgetRenderer"
import { accountsApi, dashboardApi } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Responsive, Layout } from "react-grid-layout"
import "react-grid-layout/css/styles.css"

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
  const { theme } = useTheme()
  const [widgets, setWidgets] = useState<Widget[]>([])
  const [accountId, setAccountId] = useState<number | null>(null)
  const [isCustomizing, setIsCustomizing] = useState(false)
  const [availableWidgets, setAvailableWidgets] = useState<any[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [layouts, setLayouts] = useState<{ [key: string]: Layout[] }>({})

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
    console.log("Loading widgets for account:", accountId)
    try {
      const response = await accountsApi.getMyAccount()
      console.log("Account API response:", response)
      if (response.data && response.data.length > 0) {
        const account = response.data[0]
        if (account.dashboard_layout) {
          console.log("Loaded layout from account:", account.dashboard_layout)
          const layout = JSON.parse(account.dashboard_layout)
          const arrangedLayout = autoArrangeWidgets(layout)
          setWidgets(arrangedLayout)
          // Initialize layouts for react-grid-layout
          const initialLayouts: { [key: string]: Layout[] } = {
            lg: arrangedLayout.map((w: Widget) => ({
              i: w.id,
              x: w.position.x,
              y: w.position.y,
              w: w.position.w,
              h: w.position.h,
              minW: 3,
              minH: 2,
            })),
          }
          setLayouts(initialLayouts)
          // Save to session storage
          sessionStorage.setItem(`dashboard-layout-${accountId}`, JSON.stringify(arrangedLayout))
        } else {
          console.log("No layout in account, trying session storage")
          // Try session storage as fallback
          const sessionLayout = sessionStorage.getItem(`dashboard-layout-${accountId}`)
          if (sessionLayout) {
            console.log("Loaded layout from session storage:", sessionLayout)
            const layout = JSON.parse(sessionLayout)
            const arrangedLayout = autoArrangeWidgets(layout)
            setWidgets(arrangedLayout)
            const initialLayouts: { [key: string]: Layout[] } = {
              lg: arrangedLayout.map((w: Widget) => ({
                i: w.id,
                x: w.position.x,
                y: w.position.y,
                w: w.position.w,
                h: w.position.h,
                minW: 3,
                minH: 2,
              })),
            }
            setLayouts(initialLayouts)
          } else {
            console.log("No layout in session storage, using default")
            const defaultLayout = getCustomLayout()
            setWidgets(defaultLayout)
            const initialLayouts: { [key: string]: Layout[] } = {
              lg: defaultLayout.map((w: Widget) => ({
                i: w.id,
                x: w.position.x,
                y: w.position.y,
                w: w.position.w,
                h: w.position.h,
                minW: 3,
                minH: 2,
              })),
            }
            setLayouts(initialLayouts)
          }
        }
      } else {
        console.log("No account data, using default layout")
        const defaultLayout = getCustomLayout()
        setWidgets(defaultLayout)
        const initialLayouts: { [key: string]: Layout[] } = {
          lg: defaultLayout.map((w: Widget) => ({
            i: w.id,
            x: w.position.x,
            y: w.position.y,
            w: w.position.w,
            h: w.position.h,
            minW: 3,
            minH: 2,
          })),
        }
        setLayouts(initialLayouts)
      }
    } catch (error) {
      console.error("Failed to load layout from account:", error)
      // Try session storage as fallback
      const sessionLayout = sessionStorage.getItem(`dashboard-layout-${accountId}`)
      if (sessionLayout) {
        console.log("Loaded layout from session storage after error:", sessionLayout)
        const layout = JSON.parse(sessionLayout)
        setWidgets(layout)
        const initialLayouts: { [key: string]: Layout[] } = {
          lg: layout.map((w: Widget) => ({
            i: w.id,
            x: w.position.x,
            y: w.position.y,
            w: w.position.w,
            h: w.position.h,
            minW: 3,
            minH: 2,
          })),
        }
        setLayouts(initialLayouts)
      } else {
        console.log("No layout in session storage after error, using default")
        const defaultLayout = getCustomLayout()
        setWidgets(defaultLayout)
        const initialLayouts: { [key: string]: Layout[] } = {
          lg: defaultLayout.map((w: Widget) => ({
            i: w.id,
            x: w.position.x,
            y: w.position.y,
            w: w.position.w,
            h: w.position.h,
            minW: 3,
            minH: 2,
          })),
        }
        setLayouts(initialLayouts)
      }
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

  async function toggleWidgetVisibility(widgetId: string) {
    const updatedWidgets = widgets.map(w =>
      w.id === widgetId ? { ...w, is_visible: !w.is_visible } : w
    )
    setWidgets(updatedWidgets)
    // Auto-save to session storage and database
    if (accountId) {
      const layoutJson = JSON.stringify(updatedWidgets)
      sessionStorage.setItem(`dashboard-layout-${accountId}`, layoutJson)
      console.log("Saved to session storage:", layoutJson)
      try {
        const saveResponse = await accountsApi.update(accountId, { dashboard_layout: layoutJson })
        console.log("Saved to account:", saveResponse)
      } catch (error) {
        console.error("Failed to save layout to account", error)
      }
    }
  }

  const handleLayoutChange = useCallback((layout: Layout[], layouts: { [key: string]: Layout[] }) => {
    setLayouts(layouts)
    // Update widget positions based on new layout
    const updatedWidgets = widgets.map(widget => {
      const layoutItem = layout.find(l => l.i === widget.id)
      if (layoutItem) {
        return {
          ...widget,
          position: {
            x: layoutItem.x,
            y: layoutItem.y,
            w: layoutItem.w,
            h: layoutItem.h,
          }
        }
      }
      return widget
    })
    setWidgets(updatedWidgets)
    
    // Auto-save to database
    if (accountId) {
      const layoutJson = JSON.stringify(updatedWidgets)
      sessionStorage.setItem(`dashboard-layout-${accountId}`, layoutJson)
      accountsApi.update(accountId, { dashboard_layout: layoutJson }).catch(error => {
        console.error("Failed to save layout to account", error)
      })
    }
  }, [widgets, accountId])

  async function saveLayout() {
    if (!accountId) return
    setIsSaving(true)
    try {
      const layoutJson = JSON.stringify(widgets)
      // Save to session storage
      sessionStorage.setItem(`dashboard-layout-${accountId}`, layoutJson)
      // Save to account
      await accountsApi.update(accountId, { dashboard_layout: layoutJson })
      setIsCustomizing(false)
    } catch (error) {
      console.error("Failed to save layout", error)
      // Still saved to session storage, so proceed
      setIsCustomizing(false)
    } finally {
      setIsSaving(false)
    }
  }

  async function addWidget(widgetType: string, widgetTitle: string) {
    const newWidget: Widget = {
      id: `${widgetType}-${Date.now()}`,
      type: widgetType,
      title: widgetTitle,
      size: "medium",
      position: { x: 0, y: 0, w: 6, h: 4 },
      is_visible: true,
      updated_at: new Date().toISOString()
    }
    const updatedWidgets = [...widgets, newWidget]
    setWidgets(updatedWidgets)
    
    // Update layouts
    const newLayout = {
      i: newWidget.id,
      x: 0,
      y: 0,
      w: 6,
      h: 4,
      minW: 3,
      minH: 2,
    }
    setLayouts({
      lg: [...(layouts.lg || []), newLayout]
    })
    
    // Auto-save to session storage and database
    if (accountId) {
      const layoutJson = JSON.stringify(updatedWidgets)
      sessionStorage.setItem(`dashboard-layout-${accountId}`, layoutJson)
      console.log("Added widget, saved to session storage:", layoutJson)
      try {
        const saveResponse = await accountsApi.update(accountId, { dashboard_layout: layoutJson })
        console.log("Added widget, saved to account:", saveResponse)
      } catch (error) {
        console.error("Failed to save layout to account", error)
      }
    }
  }

  async function removeWidget(widgetId: string) {
    const updatedWidgets = widgets.filter(w => w.id !== widgetId)
    setWidgets(updatedWidgets)
    
    // Update layouts
    setLayouts({
      lg: (layouts.lg || []).filter(l => l.i !== widgetId)
    })
    
    // Auto-save to session storage and database
    if (accountId) {
      const layoutJson = JSON.stringify(updatedWidgets)
      sessionStorage.setItem(`dashboard-layout-${accountId}`, layoutJson)
      console.log("Removed widget, saved to session storage:", layoutJson)
      try {
        const saveResponse = await accountsApi.update(accountId, { dashboard_layout: layoutJson })
        console.log("Removed widget, saved to account:", saveResponse)
      } catch (error) {
        console.error("Failed to save layout to account", error)
      }
    }
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

  // Auto-arrange widgets to prevent overlap
  function autoArrangeWidgets(widgetsToArrange: Widget[]): Widget[] {
    const arranged: Widget[] = []
    let currentY = 0
    let currentX = 0
    const cols = 12

    widgetsToArrange.forEach(widget => {
      const w = widget.position.w
      const h = widget.position.h

      // If current widget doesn't fit in current row, move to next row
      if (currentX + w > cols) {
        currentX = 0
        currentY += h
      }

      arranged.push({
        ...widget,
        position: { x: currentX, y: currentY, w, h }
      })

      currentX += w
    })

    return arranged
  }

  async function resetLayout() {
    if (!accountId) return
    const defaultLayout = getCustomLayout()
    setWidgets(defaultLayout)
    const initialLayouts: { [key: string]: Layout[] } = {
      lg: defaultLayout.map((w: Widget) => ({
        i: w.id,
        x: w.position.x,
        y: w.position.y,
        w: w.position.w,
        h: w.position.h,
        minW: 3,
        minH: 2,
      })),
    }
    setLayouts(initialLayouts)
    // Save to database
    const layoutJson = JSON.stringify(defaultLayout)
    sessionStorage.setItem(`dashboard-layout-${accountId}`, layoutJson)
    try {
      await accountsApi.update(accountId, { dashboard_layout: layoutJson })
    } catch (error) {
      console.error("Failed to reset layout", error)
    }
  }
  function getCustomLayout(): Widget[] {
    return [
      {
        id: "welcome-1",
        type: "welcome",
        title: "Welcome to Bêre Bietjie",
        size: "large",
        position: { x: 0, y: 0, w: 12, h: 2 },
        is_visible: true,
        updated_at: ""
      },
      {
        id: "getting-started-1",
        type: "getting_started",
        title: "Getting Started",
        size: "medium",
        position: { x: 0, y: 2, w: 6, h: 3 },
        is_visible: true,
        updated_at: ""
      },
      {
        id: "recent-transactions-1",
        type: "recent_transactions",
        title: "Recent Transactions",
        size: "medium",
        position: { x: 6, y: 2, w: 6, h: 3 },
        is_visible: true,
        updated_at: ""
      },
      {
        id: "savings-withdrawals-1",
        type: "savings_withdrawals",
        title: "Savings Withdrawals",
        size: "medium",
        position: { x: 0, y: 5, w: 6, h: 4 },
        is_visible: true,
        updated_at: ""
      },
      {
        id: "spending-trends-1",
        type: "spending_trends",
        title: "Spending Trends",
        size: "medium",
        position: { x: 6, y: 5, w: 6, h: 4 },
        is_visible: true,
        updated_at: ""
      },
      {
        id: "goals-overview-1",
        type: "goals_overview",
        title: "Savings Goals",
        size: "medium",
        position: { x: 0, y: 9, w: 12, h: 4 },
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
            <h1 className={cn(
              "text-2xl xs:text-3xl font-bold bg-clip-text text-transparent flex items-center gap-3",
              theme === "light"
                ? "bg-gradient-to-r from-[#7BA35E] to-[#9EC489]"
                : "bg-gradient-to-r from-[#B8D5A8] to-[#9EC489]"
            )}>
              <LayoutDashboard className={cn(
                "h-6 w-6 xs:h-7 xs:w-7 lg:h-8 lg:w-8",
                theme === "light" ? "text-[#9EC489]" : "text-[#9EC489]"
              )} />
              Dashboard
            </h1>
            <p className={cn(
              "mt-1 text-sm xs:text-base",
              theme === "light" ? "text-[#5A6B55]" : "text-[#B8B3A8]"
            )}>Your elegant financial overview</p>
          </div>
          <Button
            onClick={() => setIsCustomizing(!isCustomizing)}
            variant={isCustomizing ? "default" : "outline"}
            className={cn(
              isCustomizing
                ? "text-white shadow-lg"
                : "border-slate-600 text-slate-300 hover:bg-slate-800 hover:border-slate-500",
              theme === "light"
                ? isCustomizing ? "bg-gradient-to-r from-[#9EC489] to-[#7BA35E] hover:from-[#7BA35E] hover:to-[#5A6B45] shadow-[#9EC489]/20" : ""
                : isCustomizing ? "bg-gradient-to-r from-[#9EC489] to-[#7BA35E] hover:from-[#7BA35E] hover:to-[#5A6B45] shadow-[#9EC489]/20" : ""
            )}
          >
            {isCustomizing ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Done
              </>
            ) : (
              <>
                <Settings className={cn(
                  "h-5 w-5 mr-2",
                  theme === "light" ? "text-[#9EC489]" : "text-[#9EC489]"
                )} />
                Customize
              </>
            )}
          </Button>
        </div>

        {isCustomizing && (
          <div className={cn(
            "mb-6 p-4 rounded-lg border",
            theme === "light"
              ? "bg-[#E8E3D8] border-[#C5C0B5]"
              : "bg-[#242824] border-[#3A4038]"
          )}>
            <div className="flex items-center gap-2 mb-3">
              <span className={cn(
                "w-2 h-2 rounded-full",
                theme === "light" ? "bg-[#9EC489]" : "bg-[#9EC489]"
              )}></span>
              <p className={cn(
                "text-sm font-medium",
                theme === "light" ? "text-[#2D3A28]" : "text-[#E8E3D8]"
              )}>
                Customization Mode
              </p>
            </div>
            <p className={cn(
              "text-xs",
              theme === "light" ? "text-[#5A6B55]" : "text-[#B8B3A8]"
            )}>
              Drag widgets to rearrange, use the edit button to resize, or click the X to remove widgets.
            </p>
          </div>
        )}

        {/* Customization Panel */}
        {isCustomizing && (
          <Card className={cn(
            "mb-6 backdrop-blur-xl shadow-xl",
            theme === "light"
              ? "bg-[#E8E3D8]/80 border-[#C5C0B5]/50"
              : "bg-[#242824]/80 border-[#3A4038]/50"
          )}>
            <CardHeader>
              <CardTitle className={cn(
                "flex items-center gap-2",
                theme === "light" ? "text-[#2D3A28]" : "text-[#E8E3D8]"
              )}>
                <Settings className={cn(
                  "h-5 w-5",
                  theme === "light" ? "text-[#9EC489]" : "text-[#9EC489]"
                )} />
                Customize Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Current Widgets */}
              <div>
                <h3 className={cn(
                  "text-sm font-semibold mb-4 flex items-center gap-2",
                  theme === "light" ? "text-[#5A6B55]" : "text-[#B8B3A8]"
                )}>
                  <span className={cn(
                    "w-2 h-2 rounded-full",
                    theme === "light" ? "bg-[#9EC489]" : "bg-[#9EC489]"
                  )}></span>
                  Current Widgets
                </h3>
                <div className="grid gap-3">
                  {widgets.map((widget) => (
                    <div
                      key={widget.id}
                      className={cn(
                        "flex items-center justify-between p-4 rounded-xl border hover:border transition-all duration-200",
                        theme === "light"
                          ? "bg-white/60 border-[#C5C0B5]/50 hover:border-[#9EC489]"
                          : "bg-[#242824]/60 border-[#3A4038]/50 hover:border-[#9EC489]"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={widget.is_visible}
                          onChange={() => toggleWidgetVisibility(widget.id)}
                          className={cn(
                            "w-5 h-5 rounded cursor-pointer",
                            theme === "light"
                              ? "border-[#C5C0B5] bg-white text-[#9EC489] focus:ring-[#9EC489] focus:ring-offset-0"
                              : "border-[#3A4038] bg-[#242824] text-[#9EC489] focus:ring-[#9EC489] focus:ring-offset-0"
                          )}
                        />
                        <span className={cn(
                          "font-medium",
                          theme === "light" ? "text-[#2D3A28]" : "text-[#E8E3D8]"
                        )}>{widget.title}</span>
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
                  <h3 className={cn(
                    "text-sm font-semibold mb-4 flex items-center gap-2",
                    theme === "light" ? "text-[#5A6B55]" : "text-[#B8B3A8]"
                  )}>
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
                          className={cn(
                            "justify-start transition-all duration-200",
                            theme === "light"
                              ? "border-[#C5C0B5] text-[#5A6B55] hover:bg-[#D4C4A8] hover:border-[#9EC489]/50 hover:text-[#2D3A28]"
                              : "border-[#3A4038] text-[#B8B3A8] hover:bg-[#4A5048] hover:border-[#9EC489]/50 hover:text-[#E8E3D8]"
                          )}
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
                className={cn(
                  "w-full text-white font-medium shadow-lg transition-all duration-200",
                  theme === "light"
                    ? "bg-gradient-to-r from-[#9EC489] to-[#7BA35E] hover:from-[#7BA35E] hover:to-[#5A6B45] shadow-[#9EC489]/20"
                    : "bg-gradient-to-r from-[#9EC489] to-[#7BA35E] hover:from-[#7BA35E] hover:to-[#5A6B45] shadow-[#9EC489]/20"
                )}
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

              {/* Reset Layout Button */}
              <Button
                onClick={resetLayout}
                variant="outline"
                className={cn(
                  "w-full transition-all duration-200",
                  theme === "light"
                    ? "border-[#C5C0B5] text-[#5A6B55] hover:bg-[#D4C4A8] hover:border-[#9EC489]/50 hover:text-[#2D3A28]"
                    : "border-[#3A4038] text-[#B8B3A8] hover:bg-[#4A5048] hover:border-[#9EC489]/50 hover:text-[#E8E3D8]"
                )}
              >
                Reset to Default Layout
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Widget Grid */}
        <Responsive
          className="layout"
          layouts={layouts}
          onLayoutChange={handleLayoutChange}
          cols={{ lg: 12, md: 12, sm: 6, xs: 1, xxs: 1 }}
          rowHeight={120}
          isDraggable={isCustomizing}
          isResizable={isCustomizing}
          draggableHandle=".drag-handle"
          useCSSTransforms={true}
          margin={[12, 12]}
          containerPadding={[12, 12]}
          preventCollision={true}
          isBounded={true}
          allowOverlap={false}
        >
          {accountId && widgets
            .filter(w => w.is_visible)
            .map((widget) => (
              <div key={widget.id} className="relative">
                {isCustomizing && (
                  <div className="drag-handle absolute top-2 left-2 z-10 p-2 bg-slate-700 rounded-lg cursor-move hover:bg-slate-600 transition-colors">
                    <GripVertical className="h-4 w-4 text-slate-300" />
                  </div>
                )}
                <WidgetRenderer
                  widget={widget}
                  accountId={accountId}
                />
              </div>
          ))}
        </Responsive>
      </div>
  )
}
