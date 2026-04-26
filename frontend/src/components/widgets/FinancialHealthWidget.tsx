import { useEffect, useState } from "react"
import { Heart, TrendingUp, TrendingDown, DollarSign, PiggyBank, Target, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { analyticsApi, type FinancialHealth } from "@/lib/analytics"
import { formatPercentage } from "@/lib/utils"

interface FinancialHealthWidgetProps {
  accountId: number
  size?: string
}

export default function FinancialHealthWidget({ accountId, size }: FinancialHealthWidgetProps) {
  const [data, setData] = useState<FinancialHealth | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [accountId])

  async function loadData() {
    try {
      const response = await analyticsApi.financialHealth(accountId)
      setData(response.data)
    } catch (error) {
      console.error("Failed to load financial health widget data", error)
    } finally {
      setLoading(false)
    }
  }

  function getStatusColor(score: number): string {
    if (score >= 80) return "text-emerald-400"
    if (score >= 60) return "text-yellow-400"
    if (score >= 40) return "text-orange-400"
    return "text-red-400"
  }

  function getStatusBgColor(score: number): string {
    if (score >= 80) return "bg-emerald-500/20 border-emerald-500/50"
    if (score >= 60) return "bg-yellow-500/20 border-yellow-500/50"
    if (score >= 40) return "bg-orange-500/20 border-orange-500/50"
    return "bg-red-500/20 border-red-500/50"
  }

  function getStatusLabel(score: number): string {
    if (score >= 80) return "Excellent"
    if (score >= 60) return "Good"
    if (score >= 40) return "Fair"
    return "Poor"
  }

  function getMetricColor(value: string): string {
    const numValue = parseFloat(value)
    if (numValue >= 80) return "text-emerald-400"
    if (numValue >= 60) return "text-yellow-400"
    if (numValue >= 40) return "text-orange-400"
    return "text-red-400"
  }

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Heart className="h-4 w-4" />
            Financial Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="animate-pulse bg-muted h-16 w-full rounded"></div>
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="animate-pulse bg-muted h-4 w-20 rounded"></div>
                    <div className="animate-pulse bg-muted h-4 w-12 rounded"></div>
                  </div>
                  <div className="animate-pulse bg-muted h-2 w-full rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Heart className="h-4 w-4" />
            Financial Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <Heart className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm mb-2">Unable to load health data</p>
            <p className="text-xs">Please check your connection</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Heart className="h-4 w-4" />
          Financial Health
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden flex flex-col">
        <div className="space-y-4 flex-1 overflow-auto">
          {/* Overall Score */}
          <div className={`p-4 rounded-lg border ${getStatusBgColor(data.score)}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                <span className="text-sm font-medium">Overall Score</span>
              </div>
              <div className={`text-2xl font-bold ${getStatusColor(data.score)}`}>
                {data.score}/100
              </div>
            </div>
            <div className="text-xs text-muted-foreground capitalize">
              {getStatusLabel(data.score)} financial health
            </div>
            <Progress value={data.score} className="h-2 mt-2" />
          </div>

          {/* Metrics */}
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Savings Rate</span>
                <span className={`text-sm font-semibold ${getMetricColor(data.savings_rate)}`}>
                  {formatPercentage(data.savings_rate)}
                </span>
              </div>
              <Progress value={parseFloat(data.savings_rate)} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Budget Adherence</span>
                <span className={`text-sm font-semibold ${getMetricColor(data.budget_adherence)}`}>
                  {formatPercentage(data.budget_adherence)}
                </span>
              </div>
              <Progress value={parseFloat(data.budget_adherence)} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Income Stability</span>
                <span className={`text-sm font-semibold ${getMetricColor(data.income_stability)}`}>
                  {formatPercentage(data.income_stability)}
                </span>
              </div>
              <Progress value={parseFloat(data.income_stability)} className="h-2" />
            </div>
          </div>

          {/* Recommendations */}
          {data.recommendations && data.recommendations.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-300">Recommendations:</p>
              <ul className="space-y-1">
                {data.recommendations.map((rec, index) => (
                  <li key={index} className="text-xs text-slate-400 flex items-start gap-2">
                    <span className="text-blue-400 mt-1">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
