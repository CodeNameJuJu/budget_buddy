import { useEffect, useState } from "react"
import { LayoutDashboard } from "lucide-react"
import { useAuth } from "@/hooks"

export default function CustomDashboardPage() {
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setLoading(false)
    }, 1000)
  }, [])

  // Clean layout with full-width widgets for better readability
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
        position: { x: 0, y: 4, w: 12, h: 3 },
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
          <h1 className="mobile-title flex items-center gap-2 text-purple-100">
            <LayoutDashboard className="h-4 w-4 xs:h-5 xs:w-5 lg:h-6 lg:w-6" />
            Dashboard
          </h1>
          <p className="mobile-text text-purple-200">Your personalized financial overview</p>
        </div>
        
        <div className="grid-responsive-xs">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-24 xs:h-32 lg:h-40">
              <div className="h-full bg-purple-900/50 rounded-lg animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 xs:space-y-6">
      <div className="responsive-margin">
        <h1 className="mobile-title flex items-center gap-2 text-purple-100">
          <LayoutDashboard className="h-4 w-4 xs:h-5 xs:w-5 lg:h-6 lg:w-6" />
          Dashboard
        </h1>
        <p className="mobile-text text-purple-200">Your personalized financial overview</p>
      </div>

      {/* Simple Welcome Card */}
      <div className="grid-responsive">
        <div className="bg-purple-950/50 backdrop-blur-md border border-purple-800/50 rounded-lg p-6 shadow-lg">
          <h2 className="text-xl font-bold text-purple-100 mb-4">Welcome to Budget Buddy!</h2>
          <p className="text-purple-200 mb-4">
            Hi {user?.email || 'User'}! Your financial dashboard is ready to use.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-purple-900/50 rounded-lg p-4">
              <h3 className="text-purple-100 font-semibold mb-2">Track Expenses</h3>
              <p className="text-purple-200 text-sm">Monitor your spending patterns</p>
            </div>
            <div className="bg-purple-900/50 rounded-lg p-4">
              <h3 className="text-purple-100 font-semibold mb-2">Set Budgets</h3>
              <p className="text-purple-200 text-sm">Create and manage your budgets</p>
            </div>
            <div className="bg-purple-900/50 rounded-lg p-4">
              <h3 className="text-purple-100 font-semibold mb-2">Save Money</h3>
              <p className="text-purple-200 text-sm">Achieve your financial goals</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
