import { lazy, Suspense } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"
import type { Widget } from "@/lib/api"

// Lazy load widget components to improve performance
const WelcomeWidget = lazy(() => import("./WelcomeWidget"))
const GettingStartedWidget = lazy(() => import("./GettingStartedWidget"))
const BalanceWidget = lazy(() => import("./BalanceWidget"))
const RecentTransactionsWidget = lazy(() => import("./RecentTransactionsWidget"))
const BudgetProgressWidget = lazy(() => import("./BudgetProgressWidget"))
const GoalsOverviewWidget = lazy(() => import("./GoalsOverviewWidget"))
const SpendingTrendsWidget = lazy(() => import("./SpendingTrendsWidget"))
const SavingsWithdrawalsWidget = lazy(() => import("./SavingsWithdrawalsWidget"))

// Placeholder for widgets not yet implemented
const PlaceholderWidget = ({ widgetType }: { widgetType: string }) => (
  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-medium flex items-center gap-2">
        <AlertCircle className="h-4 w-4" />
        {widgetType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-center text-muted-foreground py-8">
        <AlertCircle className="h-8 w-8 mx-auto mb-2" />
        <p className="text-sm">Widget coming soon</p>
      </div>
    </CardContent>
  </Card>
)

interface WidgetRendererProps {
  widget: Widget
  accountId: number
}

export default function WidgetRenderer({ widget, accountId }: WidgetRendererProps) {
  const renderWidget = () => {
    switch (widget.type) {
      case "welcome":
        return (
          <Suspense fallback={<WidgetSkeleton title="Welcome" />}>
            <WelcomeWidget />
          </Suspense>
        )
      
      case "getting_started":
        return (
          <Suspense fallback={<WidgetSkeleton title="Getting Started" />}>
            <GettingStartedWidget />
          </Suspense>
        )
      
      case "balance":
        return (
          <Suspense fallback={<WidgetSkeleton title="Account Balance" />}>
            <BalanceWidget accountId={accountId} />
          </Suspense>
        )
      
      case "recent_transactions":
        return (
          <Suspense fallback={<WidgetSkeleton title="Recent Transactions" />}>
            <RecentTransactionsWidget accountId={accountId} size={widget.size} />
          </Suspense>
        )
      
      case "budget_progress":
        return (
          <Suspense fallback={<WidgetSkeleton title="Budget Progress" />}>
            <BudgetProgressWidget accountId={accountId} size={widget.size} />
          </Suspense>
        )
      
      case "goals_overview":
        return (
          <Suspense fallback={<WidgetSkeleton title="Savings Goals" />}>
            <GoalsOverviewWidget accountId={accountId} size={widget.size} />
          </Suspense>
        )
      
      case "spending_trends":
        return (
          <Suspense fallback={<WidgetSkeleton title="Spending Trends" />}>
            <SpendingTrendsWidget accountId={accountId} size={widget.size} />
          </Suspense>
        )
      
      case "savings_withdrawals":
        return (
          <Suspense fallback={<WidgetSkeleton title="Savings Withdrawals" />}>
            <SavingsWithdrawalsWidget accountId={accountId} size={widget.size} />
          </Suspense>
        )
      
      default:
        return <PlaceholderWidget widgetType={widget.type} />
    }
  }

  return (
    <div 
      className="transition-all duration-200"
      style={{
        gridColumn: `span ${widget.position.w}`,
        gridRow: `span ${widget.position.h}`,
      }}
    >
      {renderWidget()}
    </div>
  )
}

// Skeleton loading component
function WidgetSkeleton({ title }: { title: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">
          <div className="animate-pulse bg-muted h-4 w-24 rounded"></div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="animate-pulse bg-muted h-8 w-32 rounded"></div>
          <div className="animate-pulse bg-muted h-4 w-20 rounded"></div>
          <div className="animate-pulse bg-muted h-4 w-16 rounded"></div>
        </div>
      </CardContent>
    </Card>
  )
}
