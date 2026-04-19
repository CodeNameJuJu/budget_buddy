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
      <div className="space-y-4 xs:space-y-6">
        <div className="responsive-margin">
          <h1 className="mobile-title flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4 xs:h-5 xs:w-5 lg:h-6 lg:w-6" />
            Dashboard
          </h1>
          <p className="mobile-text text-muted-foreground">Your personalized financial overview</p>
        </div>
        
        <div className="grid-responsive-xs">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-24 xs:h-32 lg:h-40">
              <div className="h-full bg-muted rounded-lg animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const customWidgets = getCustomLayout()

  return (
    <div className="space-y-4 xs:space-y-6">
      <div className="responsive-margin">
        <h1 className="mobile-title flex items-center gap-2">
          <LayoutDashboard className="h-4 w-4 xs:h-5 xs:w-5 lg:h-6 lg:w-6" />
          Dashboard
        </h1>
        <p className="mobile-text text-muted-foreground">Your personalized financial overview</p>
      </div>

      {/* Dashboard Grid - 100% Responsive */}
      <div className="grid-responsive">
        {customWidgets.map((widget) => (
          <div 
            key={widget.id} 
            className="mobile-card animate-scale-in"
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
