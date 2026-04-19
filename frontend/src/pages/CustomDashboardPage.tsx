import { useEffect, useState } from "react"
import { LayoutDashboard } from "lucide-react"
import WidgetRenderer from "@/components/widgets/WidgetRenderer"
import { dashboardApi, type Widget, type DashboardLayout } from "@/lib/api"

const ACCOUNT_ID = 1

export default function CustomDashboardPage() {
  const [widgets, setWidgets] = useState<Widget[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboard()
  }, [])

  async function loadDashboard() {
    setLoading(true)
    try {
      const response = await dashboardApi.getLayout(ACCOUNT_ID)
      
      // Parse widgets from layout
      if (response.data?.layout) {
        const parsedWidgets = JSON.parse(response.data.layout)
        setWidgets(parsedWidgets.filter((w: Widget) => w.is_visible))
      }
    } catch (error) {
      console.error("Failed to load dashboard", error)
    } finally {
      setLoading(false)
    }
  }

  // Clean layout with full-width widgets for better readability
  function getCustomLayout(): Widget[] {
    return [
      {
        id: "balance-1",
        type: "balance",
        title: "Account Balance",
        size: "medium",
        position: { x: 0, y: 0, w: 12, h: 3 },
        is_visible: true,
        updated_at: ""
      },
      {
        id: "budget-progress-1",
        type: "budget_progress",
        title: "Budget Progress",
        size: "medium",
        position: { x: 0, y: 3, w: 12, h: 4 },
        is_visible: true,
        updated_at: ""
      },
      {
        id: "recent-transactions-1",
        type: "recent_transactions",
        title: "Recent Transactions",
        size: "medium",
        position: { x: 0, y: 7, w: 12, h: 4 },
        is_visible: true,
        updated_at: ""
      },
      {
        id: "savings-withdrawals-1",
        type: "savings_withdrawals",
        title: "Savings Withdrawals",
        size: "medium",
        position: { x: 0, y: 11, w: 12, h: 4 },
        is_visible: true,
        updated_at: ""
      },
      {
        id: "spending-trends-1",
        type: "spending_trends",
        title: "Spending Trends",
        size: "medium",
        position: { x: 0, y: 15, w: 12, h: 4 },
        is_visible: true,
        updated_at: ""
      },
      {
        id: "goals-overview-1",
        type: "goals_overview",
        title: "Savings Goals",
        size: "medium",
        position: { x: 0, y: 19, w: 12, h: 4 },
        is_visible: true,
        updated_at: ""
      }
    ]
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold tracking-tight flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5 lg:h-6 lg:w-6" />
            Dashboard
          </h1>
          <p className="text-muted-foreground text-sm lg:text-base">Your personalized financial overview</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="col-span-1 lg:col-span-12 h-32 lg:h-40">
              <div className="h-full bg-muted rounded-lg animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const customWidgets = getCustomLayout()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold tracking-tight flex items-center gap-2">
          <LayoutDashboard className="h-5 w-5 lg:h-6 lg:w-6" />
          Dashboard
        </h1>
        <p className="text-muted-foreground text-sm lg:text-base">Your personalized financial overview</p>
      </div>

      {/* Dashboard Grid - Mobile Responsive */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-4">
        {customWidgets.map((widget) => (
          <div 
            key={widget.id} 
            className="lg:col-span-12"
            style={{
              gridColumn: `span ${widget.position.w}`,
              gridRow: `span ${widget.position.h}`,
            }}
          >
            <WidgetRenderer widget={widget} accountId={ACCOUNT_ID} />
          </div>
        ))}
      </div>
    </div>
  )
}
