import { useEffect, useState } from "react"
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowLeftRight,
  CreditCard,
  Heart,
  Target,
  AlertCircle,
  PiggyBank,
  BarChart3,
  Activity,
  Bell,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { dashboardApi, budgetsApi, savingsApi, alertsApi, type DashboardSummary, type Budget, type SavingsPot, type Alert } from "@/lib/api"
import { formatCurrency, formatDate, formatPercentage } from "@/lib/utils"

const ACCOUNT_ID = 1

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [savings, setSavings] = useState<SavingsPot[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSummary()
  }, [])

  async function loadSummary() {
    try {
      console.log("Loading dashboard data...")
      const [summaryRes, budgetsRes, savingsRes, alertsRes] = await Promise.all([
        dashboardApi.summary(ACCOUNT_ID),
        budgetsApi.list(ACCOUNT_ID),
        savingsApi.listPots(ACCOUNT_ID),
        alertsApi.list(ACCOUNT_ID, false, 5), // Get last 5 alerts
      ])
      
      console.log("API responses:", {
        summary: summaryRes,
        budgets: budgetsRes,
        savings: savingsRes,
        alerts: alertsRes
      })
      
      setSummary(summaryRes.data)
      setBudgets(budgetsRes.data || [])
      setSavings(savingsRes.data || [])
      setAlerts(alertsRes.data || [])
      
      console.log("State set:", {
        summary: summaryRes.data,
        budgets: budgetsRes.data,
        savings: savingsRes.data,
        alerts: alertsRes.data
      })
    } catch (error) {
      console.error("Failed to load dashboard", error)
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

  
  const income = parseFloat(summary?.total_income || "0")
  const expenses = parseFloat(summary?.total_expenses || "0")
  const balance = parseFloat(summary?.balance || "0")

  return (
    <div className="space-y-8">
      {/* Debug Info */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
        <h3 className="text-sm font-medium text-slate-300 mb-2">Debug Info:</h3>
        <div className="text-xs text-slate-400 space-y-1">
          <p>Loading: {loading ? 'Yes' : 'No'}</p>
          <p>Summary: {summary ? 'Loaded' : 'Null'}</p>
          <p>Budgets: {budgets.length} items</p>
          <p>Savings: {savings.length} items</p>
          <p>Alerts: {alerts.length} items</p>
          <p>Account ID: {ACCOUNT_ID}</p>
        </div>
      </div>
      
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
            {(!summary?.recent_transactions || summary.recent_transactions.length === 0) ? (
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
            {(!summary?.top_categories || summary.top_categories.length === 0) ? (
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

      {/* Additional widgets row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Budget Progress */}
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-orange-600 text-white transition-colors duration-200">
                <Target className="h-4 w-4" />
              </div>
              Budget Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            {budgets.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No budgets set up
              </p>
            ) : (
              <div className="space-y-3">
                {budgets.slice(0, 3).map((budget) => {
                  const spent = parseFloat(budget.amount || "0") * 0.65 // Mock spent amount
                  const percentage = (spent / parseFloat(budget.amount || "1")) * 100
                  return (
                    <div key={budget.id} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{budget.name}</span>
                        <span className="text-muted-foreground">
                          {formatCurrency(spent)} / {formatCurrency(parseFloat(budget.amount || "0"))}
                        </span>
                      </div>
                      <div className="h-2 bg-zinc-600 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ease-out ${
                            percentage > 80 ? 'bg-red-500' : percentage > 60 ? 'bg-orange-500' : 'bg-emerald-500'
                          }`}
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

        {/* Quick Stats */}
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-purple-600 text-white transition-colors duration-200">
                <Activity className="h-4 w-4" />
              </div>
              Quick Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">
                    {summary?.recent_transactions?.length || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">Transactions</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">
                    {summary?.top_categories?.length || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">Categories</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Avg Transaction</span>
                  <span className="text-blue-400">
                    {formatCurrency(
                      (parseFloat(summary?.total_expenses || "0") + parseFloat(summary?.total_income || "0")) / 
                      Math.max(1, (summary?.recent_transactions?.length || 0))
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Savings Rate</span>
                  <span className="text-emerald-400">
                    {formatPercentage(
                      parseFloat(summary?.total_income || "0") > 0 
                        ? (parseFloat(summary?.total_income || "0") - parseFloat(summary?.total_expenses || "0")) / parseFloat(summary?.total_income || "1") * 100
                        : 0
                    )}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Alerts */}
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-red-600 text-white transition-colors duration-200">
                <Bell className="h-4 w-4" />
              </div>
              Recent Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {alerts.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No new alerts
              </p>
            ) : (
              <div className="space-y-2">
                {alerts.map((alert) => (
                  <div key={alert.id} className="flex items-start gap-2 p-2 rounded-lg bg-zinc-800/50">
                    <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{alert.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(alert.created_date)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom widgets row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Savings Summary */}
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-teal-600 text-white transition-colors duration-200">
                <PiggyBank className="h-4 w-4" />
              </div>
              Savings Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            {savings.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No savings accounts
              </p>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-teal-400">
                      {formatCurrency(savings.reduce((sum, pot) => sum + parseFloat(pot.allocated || "0"), 0))}
                    </div>
                    <p className="text-xs text-muted-foreground">Total Allocated</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-400">
                      {savings.length}
                    </div>
                    <p className="text-xs text-muted-foreground">Active Pots</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {savings.slice(0, 3).map((pot) => (
                    <div key={pot.id} className="flex items-center justify-between p-2 rounded-lg bg-zinc-800/50">
                      <span className="text-sm font-medium">{pot.name}</span>
                      <span className="text-sm text-teal-400">
                        {formatCurrency(parseFloat(pot.allocated || "0"))}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Spending Trends Mini Chart */}
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-blue-600 text-white transition-colors duration-200">
                <BarChart3 className="h-4 w-4" />
              </div>
              Spending Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold text-emerald-400">+12%</div>
                  <p className="text-xs text-muted-foreground">vs Last Month</p>
                </div>
                <div>
                  <div className="text-lg font-bold text-red-400">-8%</div>
                  <p className="text-xs text-muted-foreground">vs Budget</p>
                </div>
                <div>
                  <div className="text-lg font-bold text-blue-400">R2,450</div>
                  <p className="text-xs text-muted-foreground">Avg Daily</p>
                </div>
              </div>
              <div className="h-20 flex items-end justify-between gap-1">
                {[65, 80, 45, 90, 70, 85, 60, 75, 55, 88, 72, 68].map((height, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t transition-all duration-300 hover:from-blue-500 hover:to-blue-300"
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Last 12 days spending pattern
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Health Score */}
      <Card className="card-hover">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-green-600 text-white transition-colors duration-200">
              <Activity className="h-4 w-4" />
            </div>
            Financial Health Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-400">78</div>
                  <p className="text-sm text-muted-foreground">Good Health</p>
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Savings Rate</span>
                    <span className="text-emerald-400">+15%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Budget Adherence</span>
                    <span className="text-blue-400">92%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Income Stability</span>
                    <span className="text-purple-400">Stable</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="ml-8">
              <div className="w-20 h-20 rounded-full border-4 border-zinc-600 relative">
                <div className="absolute inset-0 rounded-full border-4 border-green-500 border-t-transparent border-r-transparent transform rotate-45"></div>
                <div className="absolute inset-2 flex items-center justify-center">
                  <span className="text-lg font-bold text-green-400">78%</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
