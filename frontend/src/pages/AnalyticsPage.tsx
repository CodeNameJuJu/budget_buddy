import { useEffect, useState } from "react"
import { TrendingUp, TrendingDown, DollarSign, Target, AlertCircle, CheckCircle, BarChart3 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { analyticsApi, accountsApi, type SpendingTrend, type CategoryBreakdown, type FinancialHealth } from "@/lib/analytics"
import { accountsApi as mainAccountsApi, type Account } from "@/lib/api"
import { formatCurrency, formatPercentage } from "@/lib/utils"
import SpendingTrendsChart from "@/components/charts/SpendingTrendsChart"
import CategoryBreakdownChart from "@/components/charts/CategoryBreakdownChart"
import FinancialHealthGauge from "@/components/charts/FinancialHealthGauge"

export default function AnalyticsPage() {
  const [accountId, setAccountId] = useState<number | null>(null)
  const [trends, setTrends] = useState<SpendingTrend[]>([])
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBreakdown[]>([])
  const [financialHealth, setFinancialHealth] = useState<FinancialHealth | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState("current_month")

  useEffect(() => {
    loadUserAccount()
  }, [])

  useEffect(() => {
    if (accountId) {
      loadAnalytics()
    }
  }, [accountId, selectedPeriod])

  async function loadUserAccount() {
    try {
      const response = await mainAccountsApi.getMyAccount()
      if (response.data && response.data.length > 0) {
        setAccountId(response.data[0].id)
      }
    } catch (error) {
      console.error("Failed to load account", error)
    }
  }

  async function loadAnalytics() {
    if (!accountId) return
    
    setLoading(true)
    try {
      const [trendsRes, categoryRes, healthRes] = await Promise.all([
        analyticsApi.trends(accountId, 6),
        analyticsApi.categoryBreakdown(accountId, selectedPeriod),
        analyticsApi.financialHealth(accountId),
      ])
      
      setTrends(trendsRes.data || [])
      setCategoryBreakdown(categoryRes.data || [])
      setFinancialHealth(healthRes.data)
    } catch (error) {
      console.error("Failed to load analytics", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-400">Loading analytics...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-100">Analytics</h1>
        <p className="text-slate-400">Insights into your financial patterns</p>
      </div>

      {/* Financial Health Score */}
      {financialHealth && (
        <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-all duration-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className={`p-2 rounded-full bg-blue-600 text-white transition-colors duration-200`}>
                <Target className="h-4 w-4" />
              </div>
              Financial Health Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <FinancialHealthGauge score={financialHealth.score} />
              </div>
              <div className="ml-8 space-y-3">
                <div>
                  <p className="text-sm text-slate-400">Savings Rate</p>
                  <p className="text-lg font-semibold">{formatPercentage(financialHealth.savings_rate)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Budget Adherence</p>
                  <p className="text-lg font-semibold">{formatPercentage(financialHealth.budget_adherence)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Income Stability</p>
                  <p className="text-lg font-semibold">{formatPercentage(financialHealth.income_stability)}</p>
                </div>
              </div>
            </div>
            {financialHealth.recommendations.length > 0 && (
              <div className="mt-6">
                <p className="text-sm font-medium mb-2 text-slate-300">Recommendations:</p>
                <ul className="space-y-1">
                  {financialHealth.recommendations.map((rec, index) => (
                    <li key={index} className="text-sm text-slate-400 flex items-start gap-2">
                      <span className="text-blue-400">•</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Spending Trends */}
      <Card className="card-hover">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-primary text-white">
              <BarChart3 className="h-4 w-4" />
            </div>
            6-Month Spending Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SpendingTrendsChart data={trends} />
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <Card className="card-hover">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-emerald-600 text-white transition-colors duration-200">
                <DollarSign className="h-4 w-4" />
              </div>
              Category Breakdown
            </div>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-1 rounded-md bg-slate-700 border border-slate-600 text-sm text-slate-300"
            >
              <option value="current_month">Current Month</option>
              <option value="last_month">Last Month</option>
              <option value="current_year">Current Year</option>
            </select>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CategoryBreakdownChart data={categoryBreakdown} />
        </CardContent>
      </Card>
    </div>
  )
}
