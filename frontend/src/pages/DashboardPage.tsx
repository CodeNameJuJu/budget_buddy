import { useEffect, useState } from "react"
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowLeftRight,
  CreditCard,
  Heart,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { dashboardApi, type DashboardSummary } from "@/lib/api"
import { formatCurrency, formatDate } from "@/lib/utils"

const ACCOUNT_ID = 1

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSummary()
  }, [])

  async function loadSummary() {
    try {
      const res = await dashboardApi.summary(ACCOUNT_ID)
      setSummary(res.data)
    } catch {
      console.error("Failed to load dashboard")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    )
  }

  if (!summary) {
    return (
      <div className="text-center py-16">
        <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Welcome to Budget Buddy</h2>
        <p className="text-muted-foreground">
          Create an account and start adding transactions to see your dashboard.
        </p>
      </div>
    )
  }

  const income = parseFloat(summary.total_income)
  const expenses = parseFloat(summary.total_expenses)
  const balance = parseFloat(summary.balance)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Your financial overview for this month</p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total income
            </CardTitle>
            <div className="p-2 rounded-full bg-primary text-white">
              <TrendingUp className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-400">
              {formatCurrency(income)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Great progress this month</p>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total expenses
            </CardTitle>
            <div className="p-2 rounded-full bg-destructive text-white">
              <TrendingDown className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">
              {formatCurrency(expenses)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Manageable spending</p>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Balance
            </CardTitle>
            <div className="p-2 rounded-full bg-primary text-white">
              <Wallet className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${balance >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {formatCurrency(balance)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Healthy balance</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent transactions */}
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-primary text-white">
                <ArrowLeftRight className="h-4 w-4" />
              </div>
              Recent transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(!summary.recent_transactions || summary.recent_transactions.length === 0) ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No transactions yet
              </p>
            ) : (
              <div className="space-y-3">
                {(summary.recent_transactions ?? []).map((t) => (
                  <div key={t.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {t.description || t.category?.name || "Transaction"}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDate(t.date)}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Badge variant={t.type === "income" ? "income" : "expense"}>
                        {t.type}
                      </Badge>
                      <span className={`text-sm font-semibold ${t.type === "income" ? "text-emerald-400" : "text-red-400"}`}>
                        {t.type === "income" ? "+" : "-"}{formatCurrency(t.amount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top spending categories */}
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-accent text-white">
                <CreditCard className="h-4 w-4" />
              </div>
              Top spending categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(!summary.top_categories || summary.top_categories.length === 0) ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No expense data yet
              </p>
            ) : (
              <div className="space-y-4">
                {(summary.top_categories ?? []).map((cat) => {
                  const total = parseFloat(cat.total)
                  const percentage = expenses > 0 ? (total / expenses) * 100 : 0
                  return (
                    <div key={cat.category_id} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{cat.category_name}</span>
                        <span className="text-muted-foreground">{formatCurrency(total)}</span>
                      </div>
                      <div className="h-4 bg-zinc-600 rounded-full overflow-hidden">
                        <div
                          className="h-full gradient-primary rounded-full transition-all duration-700 ease-out progress-bar-fill"
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
