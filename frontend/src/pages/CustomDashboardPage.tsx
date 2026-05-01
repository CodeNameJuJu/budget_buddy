import { useEffect, useState } from "react"
import { LayoutDashboard, Settings, Plus, X, Check, GripVertical } from "lucide-react"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { useAuth } from "@/hooks"
import { useTheme } from "@/contexts/ThemeContext"
import { cn } from "@/lib/utils"
import WidgetRenderer from "@/components/widgets/WidgetRenderer"
import { accountsApi, dashboardApi, dashboardLayoutsApi } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Widget {
  id: string
  type: string
  title: string
  size: string
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
      const response = await dashboardLayoutsApi.get()
      if (response.data) {
        const layout = JSON.parse(response.data.layout)
        setWidgets(layout)
        // Sync to session storage for this device
        sessionStorage.setItem(`dashboard-layout-${accountId}`, JSON.stringify(layout))
      } else {
        const defaultLayout = getCustomLayout()
        setWidgets(defaultLayout)
        sessionStorage.setItem(`dashboard-layout-${accountId}`, JSON.stringify(defaultLayout))
      }
    } catch (error) {
      console.error("Failed to load layout from dashboard_layouts API:", error)
      const defaultLayout = getCustomLayout()
      setWidgets(defaultLayout)
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
      try {
        await dashboardLayoutsApi.save(layoutJson)
      } catch (error) {
        console.error("Failed to save layout", error)
      }
    }
  }


  async function saveLayout() {
    if (!accountId) return
    setIsSaving(true)
    try {
      const layoutJson = JSON.stringify(widgets)
      // Save to session storage
      sessionStorage.setItem(`dashboard-layout-${accountId}`, layoutJson)
      // Save to dashboard_layouts table
      await dashboardLayoutsApi.save(layoutJson)
      setIsCustomizing(false)
    } catch (error) {
      console.error("Failed to save layout", error)
      // Still saved to session storage, so proceed
      setIsCustomizing(false)
    } finally {
      setIsSaving(false)
    }
  }

  async function toggleCustomizeMode() {
    if (isCustomizing) {
      await saveLayout()
      return
    }

    setIsCustomizing(true)
  }

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return

    const items = Array.from(widgets)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    setWidgets(items)

    // Auto-save on reordering
    if (accountId) {
      const layoutJson = JSON.stringify(items)
      sessionStorage.setItem(`dashboard-layout-${accountId}`, layoutJson)
      try {
        await dashboardLayoutsApi.save(layoutJson)
      } catch (error) {
        console.error("Failed to save layout after reordering", error)
      }
    }
  }

  async function addWidget(widgetType: string, widgetTitle: string) {
    const newWidget: Widget = {
      id: `${widgetType}-${Date.now()}`,
      type: widgetType,
      title: widgetTitle,
      size: "medium",
      is_visible: true,
      updated_at: new Date().toISOString()
    }
    const updatedWidgets = [...widgets, newWidget]
    setWidgets(updatedWidgets)
    
    // Auto-save to session storage and database
    if (accountId) {
      const layoutJson = JSON.stringify(updatedWidgets)
      sessionStorage.setItem(`dashboard-layout-${accountId}`, layoutJson)
      try {
        await dashboardLayoutsApi.save(layoutJson)
      } catch (error) {
        console.error("Failed to save layout", error)
      }
    }
  }

  async function removeWidget(widgetId: string) {
    const updatedWidgets = widgets.filter(w => w.id !== widgetId)
    setWidgets(updatedWidgets)
    
    // Auto-save to session storage and database
    if (accountId) {
      const layoutJson = JSON.stringify(updatedWidgets)
      sessionStorage.setItem(`dashboard-layout-${accountId}`, layoutJson)
      try {
        await dashboardLayoutsApi.save(layoutJson)
      } catch (error) {
        console.error("Failed to save layout", error)
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


  async function resetLayout() {
    if (!accountId) return
    const defaultLayout = getCustomLayout()
    setWidgets(defaultLayout)
    // Save to database
    const layoutJson = JSON.stringify(defaultLayout)
    sessionStorage.setItem(`dashboard-layout-${accountId}`, layoutJson)
    try {
      await dashboardLayoutsApi.save(layoutJson)
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
        is_visible: true,
        updated_at: ""
      },
      {
        id: "getting-started-1",
        type: "getting_started",
        title: "Getting Started",
        size: "large",
        is_visible: true,
        updated_at: ""
      },
      {
        id: "recent-transactions-1",
        type: "recent_transactions",
        title: "Recent Transactions",
        size: "medium",
        is_visible: true,
        updated_at: ""
      },
      {
        id: "savings-withdrawals-1",
        type: "savings_withdrawals",
        title: "Savings Withdrawals",
        size: "medium",
        is_visible: true,
        updated_at: ""
      },
      {
        id: "spending-trends-1",
        type: "spending_trends",
        title: "Spending Trends",
        size: "medium",
        is_visible: true,
        updated_at: ""
      },
      {
        id: "goals-overview-1",
        type: "goals_overview",
        title: "Savings Goals",
        size: "medium",
        is_visible: true,
        updated_at: ""
      }
    ]
  }

  function getWidgetDescription(widgetType: string): string {
    const descriptions: { [key: string]: string } = {
      welcome: "Personalized welcome message and quick introduction to the app",
      getting_started: "Step-by-step guide to help you get started with Bêre Bietjie",
      recent_transactions: "View your latest transactions and quickly add new ones",
      savings_withdrawals: "Track your savings withdrawals and deposits",
      spending_trends: "Visualize your spending patterns over time",
      goals_overview: "Monitor progress toward your savings goals",
      budget_progress: "Track how much of your budget you've used",
      balance: "View your account balance and financial summary",
      account_summary: "Overview of all your linked accounts",
      category_breakdown: "See spending breakdown by category",
      monthly_comparison: "Compare your spending across different months",
      upcoming_bills: "Track upcoming bills and due dates",
      alerts: "View important alerts and notifications",
      financial_health: "Assess your overall financial health score"
    }
    return descriptions[widgetType] || "Custom widget for your dashboard"
  }

  if (loading) {
    return (
      <div className="space-y-4 xs:space-y-6">
        <div className="responsive-margin">
          <h1 className={cn("mobile-title flex items-center gap-2", theme === "light" ? "text-[#1F2A24]" : "text-[#E7EFEA]")}>
            <LayoutDashboard className="h-4 w-4 xs:h-5 xs:w-5 lg:h-6 lg:w-6" />
            Dashboard
          </h1>
          <p className={cn("mobile-text", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>Your elegant financial overview</p>
        </div>
        
        <div className="grid-responsive-xs">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-24 xs:h-32 lg:h-40">
              <div className={cn("h-full rounded-lg animate-pulse", theme === "light" ? "bg-[#6BAF92]/30" : "bg-[#6BAF92]/30")}></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="py-6 xs:py-8">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-6 xs:mb-8" data-tutorial="dashboard">
          <div className="flex-1 min-w-0">
            <h1 className={cn(
              "text-xl xs:text-2xl lg:text-3xl font-bold bg-clip-text text-transparent flex items-center gap-2 xs:gap-3",
              theme === "light"
                ? "bg-gradient-to-r from-[#5E9C7E] to-[#6BAF92]"
                : "bg-gradient-to-r from-[#A8D5BA] to-[#6BAF92]"
            )}>
              <LayoutDashboard className={cn(
                "h-5 w-5 xs:h-6 xs:w-6 lg:h-8 lg:w-8 flex-shrink-0",
                theme === "light" ? "text-[#6BAF92]" : "text-[#6BAF92]"
              )} />
              <span className="truncate">Dashboard</span>
            </h1>
            <p className={cn(
              "mt-1 text-xs xs:text-sm",
              theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]"
            )}>Your elegant financial overview</p>
          </div>
          <Button
            onClick={toggleCustomizeMode}
            variant={isCustomizing ? "default" : "outline"}
            className={cn(
              "flex-shrink-0 text-xs xs:text-sm px-3 xs:px-4 py-2",
              isCustomizing
                ? "text-white shadow-lg"
                : cn(theme === "light" ? "border-[#E6E0D6] text-[#6C7A73] hover:bg-[#E8DCC5] hover:border-[#6BAF92]" : "border-[#2E3B35] text-[#A7B3AD] hover:bg-[#18231D] hover:border-[#6BAF92]"),
              theme === "light"
                ? isCustomizing ? "bg-gradient-to-r from-[#6BAF92] to-[#5E9C7E] hover:from-[#5E9C7E] hover:to-[#5A6B45] shadow-[#6BAF92]/20" : ""
                : isCustomizing ? "bg-gradient-to-r from-[#6BAF92] to-[#5E9C7E] hover:from-[#5E9C7E] hover:to-[#5A6B45] shadow-[#6BAF92]/20" : ""
            )}
          >
            {isCustomizing ? (
              <>
                <Check className="h-4 w-4 mr-1 xs:mr-2" />
                <span className="hidden xs:inline">Done</span>
                <span className="xs:hidden">Done</span>
              </>
            ) : (
              <>
                <Settings className={cn(
                  "h-4 w-4 xs:h-5 xs:w-5 mr-1 xs:mr-2",
                  theme === "light" ? "text-[#6BAF92]" : "text-[#6BAF92]"
                )} />
                <span className="hidden xs:inline">Customize</span>
                <span className="xs:hidden">Customize</span>
              </>
            )}
          </Button>
        </div>


        {/* Customization Panel */}
        {isCustomizing && (
          <Card className={cn(
            "mb-6 backdrop-blur-xl shadow-xl",
            theme === "light"
              ? "bg-[#E8DCC5]/80 border-[#E6E0D6]/50"
              : "bg-[#18231D]/80 border-[#2E3B35]/50"
          )}>
            <CardHeader>
              <CardTitle className={cn(
                "flex items-center gap-2",
                theme === "light" ? "text-[#1F2A24]" : "text-[#E7EFEA]"
              )}>
                <Settings className={cn(
                  "h-5 w-5",
                  theme === "light" ? "text-[#6BAF92]" : "text-[#6BAF92]"
                )} />
                Customize Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* All Widgets Grid */}
              <div>
                <h3 className={cn(
                  "text-sm font-semibold mb-4 flex items-center gap-2",
                  theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]"
                )}>
                  <span className={cn(
                    "w-2 h-2 rounded-full",
                    theme === "light" ? "bg-[#6BAF92]" : "bg-[#6BAF92]"
                  )}></span>
                  Select Widgets to Display
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {[...widgets, ...availableWidgets.filter(aw => !widgets.some(w => w.type === aw.type))].map((widget) => (
                    <div
                      key={widget.id || widget.type}
                      className={cn(
                        "flex flex-col gap-2 p-4 rounded-xl border transition-all duration-200",
                        theme === "light"
                          ? "bg-white/60 border-[#E6E0D6]/50 hover:border-[#6BAF92]"
                          : "bg-[#18231D]/60 border-[#2E3B35]/50 hover:border-[#6BAF92]"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={widget.is_visible || false}
                          onChange={() => widget.id ? toggleWidgetVisibility(widget.id) : addWidget(widget.type, widget.name)}
                          className={cn(
                            "w-5 h-5 rounded cursor-pointer flex-shrink-0",
                            theme === "light"
                              ? "border-[#E6E0D6] bg-white text-[#6BAF92] focus:ring-[#6BAF92] focus:ring-offset-0"
                              : "border-[#2E3B35] bg-[#18231D] text-[#6BAF92] focus:ring-[#6BAF92] focus:ring-offset-0"
                          )}
                        />
                        <span className={cn(
                          "font-medium text-sm",
                          theme === "light" ? "text-[#1F2A24]" : "text-[#E7EFEA]"
                        )}>{widget.title || widget.name}</span>
                      </div>
                      <p className={cn(
                        "text-xs",
                        theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]"
                      )}>
                        {getWidgetDescription(widget.type)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reset Layout Button */}
              <Button
                onClick={resetLayout}
                variant="outline"
                className={cn(
                  "w-full transition-all duration-200",
                  theme === "light"
                    ? "border-[#E6E0D6] text-[#6C7A73] hover:bg-[#D9B44A] hover:border-[#6BAF92]/50 hover:text-[#1F2A24]"
                    : "border-[#2E3B35] text-[#A7B3AD] hover:bg-[#C9A24A] hover:border-[#6BAF92]/50 hover:text-[#E7EFEA]"
                )}
              >
                Reset to Default Layout
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Widget Grid */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="dashboard-widgets">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 xs:gap-6"
              >
                {accountId && widgets
                  .filter(w => w.is_visible)
                  .map((widget, index) => (
                    <Draggable
                      key={widget.id}
                      draggableId={widget.id}
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={cn(
                            widget.size === "large" ? "lg:col-span-3 sm:col-span-2" : "",
                            snapshot.isDragging ? "opacity-50 scale-105" : "",
                            "cursor-grab active:cursor-grabbing"
                          )}
                        >
                          <div className="absolute top-2 right-2 z-10 p-1 rounded hover:bg-black/10 dark:hover:bg-white/10">
                            <GripVertical className="h-5 w-5" />
                          </div>
                          <WidgetRenderer
                            widget={widget}
                            accountId={accountId}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
  )
}
