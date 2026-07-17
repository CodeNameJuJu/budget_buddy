import { useEffect, useState } from "react"
import { TrendingUp, TrendingDown, DollarSign, Target, AlertCircle, CheckCircle, BarChart3 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { analyticsApi, type SpendingTrend, type CategoryBreakdown, type FinancialHealth } from "@/lib/analytics"
import { accountsApi as mainAccountsApi, type Account } from "@/lib/api"
import { formatCurrency, formatPercentage } from "@/lib/utils"
import SpendingTrendsChart from "@/components/charts/SpendingTrendsChart"
import CategoryBreakdownChart from "@/components/charts/CategoryBreakdownChart"
import FinancialHealthGauge from "@/components/charts/FinancialHealthGauge"
import { useTheme } from "@/contexts/ThemeContext"
import { cn } from "@/lib/utils"

export default function AnalyticsPage() {
  const [accountId, setAccountId] = useState<number | null>(null)
  const [trends, setTrends] = useState<SpendingTrend[]>([])
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBreakdown[]>([])
  const [financialHealth, setFinancialHealth] = useState<FinancialHealth | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState("current_cycle")
  const { theme } = useTheme()

  // Latest and previous billing cycles from the trends series, used for the
  // summary cards and cycle-over-cycle comparison
  const latestTrend = trends.length > 0 ? trends[trends.length - 1] : null
  const previousTrend = trends.length > 1 ? trends[trends.length - 2] : null

  function percentChange(current: string, previous: string | undefined): number | null {
    if (previous === undefined) return null
    const currentValue = parseFloat(current)
    const previousValue = parseFloat(previous)
    if (!isFinite(currentValue) || !isFinite(previousValue) || previousValue === 0) return null
    return ((currentValue - previousValue) / Math.abs(previousValue)) * 100
  }

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
        <p className={theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]"}>Loading analytics...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className={cn(
          "text-2xl font-bold tracking-tight",
          theme === "light" ? "text-[#1F2A24]" : "text-[#E7EFEA]"
        )}>Analytics</h1>
        <p className={theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]"}>Insights into your financial patterns</p>
      </div>

      {/* Cycle summary */}
      {latestTrend && (
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              label: "Income this cycle",
              value: latestTrend.income,
              change: percentChange(latestTrend.income, previousTrend?.income),
              higherIsBetter: true,
              icon: <TrendingUp className="h-4 w-4" />
            },
            {
              label: "Spent this cycle",
              value: latestTrend.expenses,
              change: percentChange(latestTrend.expenses, previousTrend?.expenses),
              higherIsBetter: false,
              icon: <TrendingDown className="h-4 w-4" />
            },
            {
              label: "Net savings this cycle",
              value: latestTrend.savings,
              change: percentChange(latestTrend.savings, previousTrend?.savings),
              higherIsBetter: true,
              icon: <DollarSign className="h-4 w-4" />
            }
          ].map(card => {
            const isPositiveChange = card.change !== null && (card.higherIsBetter ? card.change >= 0 : card.change <= 0)
            return (
              <Card key={card.label} className={cn(
                "border",
                theme === "light" ? "bg-[#E8DCC5]/50 border-[#E6E0D6]" : "bg-[#18231D]/50 border-[#2E3B35]"
              )}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <p className={cn("text-sm", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>{card.label}</p>
                    <div className="p-2 rounded-full bg-[#6BAF92] text-white">{card.icon}</div>
                  </div>
                  <p className={cn(
                    "text-2xl font-bold mt-2",
                    theme === "light" ? "text-[#1F2A24]" : "text-[#E7EFEA]"
                  )}>{formatCurrency(card.value)}</p>
                  {card.change !== null && (
                    <Badge className={cn(
                      "mt-2",
                      isPositiveChange ? "bg-[#6BAF92]/20 text-[#3E7A5E]" : "bg-[#EF4444]/20 text-[#B91C1C]"
                    )}>
                      {card.change >= 0 ? "+" : ""}{card.change.toFixed(1)}% vs previous cycle
                    </Badge>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Financial Health Score */}
      {financialHealth && (
        <Card className={cn(
          "border hover:transition-all duration-200",
          theme === "light"
            ? "bg-[#E8DCC5]/50 border-[#E6E0D6] hover:bg-[#E8DCC5]/70"
            : "bg-[#18231D]/50 border-[#2E3B35] hover:bg-[#18231D]/70"
        )}>
          <CardHeader>
            <CardTitle className={cn(
              "flex items-center gap-2",
              theme === "light" ? "text-[#1F2A24]" : "text-[#E7EFEA]"
            )}>
              <div className={cn(
                "p-2 rounded-full text-white transition-colors duration-200",
                theme === "light" ? "bg-[#6BAF92]" : "bg-[#6BAF92]"
              )}>
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
                  <p className={cn("text-sm", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>Savings Rate</p>
                  <p className={cn("text-lg font-semibold", theme === "light" ? "text-[#1F2A24]" : "text-[#E7EFEA]")}>{formatPercentage(financialHealth.savings_rate)}</p>
                </div>
                <div>
                  <p className={cn("text-sm", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>Budget Adherence</p>
                  <p className={cn("text-lg font-semibold", theme === "light" ? "text-[#1F2A24]" : "text-[#E7EFEA]")}>{formatPercentage(financialHealth.budget_adherence)}</p>
                </div>
                <div>
                  <p className={cn("text-sm", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>Income Stability</p>
                  <p className={cn("text-lg font-semibold", theme === "light" ? "text-[#1F2A24]" : "text-[#E7EFEA]")}>{formatPercentage(financialHealth.income_stability)}</p>
                </div>
              </div>
            </div>
            {financialHealth.recommendations.length > 0 && (
              <div className="mt-6">
                <p className={cn(
                  "text-sm font-medium mb-2",
                  theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]"
                )}>Recommendations:</p>
                <ul className="space-y-1">
                  {financialHealth.recommendations.map((rec, index) => (
                    <li key={index} className={cn(
                      "text-sm flex items-start gap-2",
                      theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]"
                    )}>
                      <span className={cn(
                        theme === "light" ? "text-[#6BAF92]" : "text-[#88B39B]"
                      )}>•</span>
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
            Spending trends (last 6 billing cycles)
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
              <div className={cn(
                "p-2 rounded-full text-white transition-colors duration-200",
                theme === "light" ? "bg-[#6BAF92]" : "bg-[#6BAF92]"
              )}>
                <DollarSign className="h-4 w-4" />
              </div>
              Category Breakdown
            </div>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className={cn(
                "px-3 py-1 rounded-md border text-sm",
                theme === "light"
                  ? "bg-white border-[#E6E0D6] text-[#1F2A24]"
                  : "bg-[#18231D] border-[#2E3B35] text-[#E7EFEA]"
              )}
            >
              <option value="current_cycle">Current cycle</option>
              <option value="last_cycle">Last cycle</option>
              <option value="current_month">Current month</option>
              <option value="last_month">Last month</option>
              <option value="current_year">Current year</option>
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
