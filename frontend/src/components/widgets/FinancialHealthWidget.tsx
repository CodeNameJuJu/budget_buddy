import { useEffect, useState } from "react"
import { Heart, TrendingUp, TrendingDown, DollarSign, PiggyBank, Target, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { dashboardApi } from "@/lib/api"
import { formatCurrency } from "@/lib/utils"

interface FinancialHealthWidgetProps {
  accountId: number
  size?: string
}

interface Metric {
  name: string
  value: string
  target: string
  percentage: number
  status: "good" | "warning" | "poor"
}

interface FinancialHealthData {
  overall_score: number
  overall_status: "excellent" | "good" | "fair" | "poor"
  metrics: Metric[]
  period: string
}

export default function FinancialHealthWidget({ accountId, size }: FinancialHealthWidgetProps) {
  const [data, setData] = useState<FinancialHealthData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [accountId])

  async function loadData() {
    try {
      const response = await dashboardApi.getWidgetData(accountId, "financial_health")
      setData(response.data)
    } catch (error) {
      console.error("Failed to load financial health widget data", error)
    } finally {
      setLoading(false)
    }
  }

  function getStatusColor(status: string): string {
    switch (status) {
      case "excellent":
      case "good":
        return "text-emerald-400"
      case "fair":
        return "text-yellow-400"
      case "poor":
        return "text-red-400"
      default:
        return "text-slate-400"
    }
  }

  function getStatusBgColor(status: string): string {
    switch (status) {
      case "excellent":
      case "good":
        return "bg-emerald-500/20 border-emerald-500/50"
      case "fair":
        return "bg-yellow-500/20 border-yellow-500/50"
      case "poor":
        return "bg-red-500/20 border-red-500/50"
      default:
        return "bg-slate-500/20 border-slate-500/50"
    }
  }

  function getMetricStatusColor(status: string): string {
    switch (status) {
      case "good":
        return "bg-emerald-500"
      case "warning":
        return "bg-yellow-500"
      case "poor":
        return "bg-red-500"
      default:
        return "bg-slate-500"
    }
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

  const displayMetrics = data.metrics ? (size === "small" ? data.metrics.slice(0, 3) : data.metrics) : []

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
          <div className={`p-4 rounded-lg border ${getStatusBgColor(data.overall_status)}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                <span className="text-sm font-medium">Overall Score</span>
              </div>
              <div className={`text-2xl font-bold ${getStatusColor(data.overall_status)}`}>
                {data.overall_score}/100
              </div>
            </div>
            <div className="text-xs text-muted-foreground capitalize">
              {data.overall_status} financial health
            </div>
            <Progress value={data.overall_score} className="h-2 mt-2" />
          </div>

          {/* Metrics */}
          <div className="space-y-3">
            {displayMetrics.map((metric, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${getMetricStatusColor(metric.status)}`}
                    />
                    <span className="text-sm">{metric.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{formatCurrency(metric.value)}</div>
                    <div className="text-xs text-muted-foreground">
                      Target: {formatCurrency(metric.target)}
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <Progress
                    value={metric.percentage}
                    className="h-2"
                  />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className={metric.status === "poor" ? "text-red-400" : metric.status === "warning" ? "text-yellow-400" : "text-emerald-400"}>
                      {metric.percentage.toFixed(0)}% of target
                    </span>
                    {metric.status === "poor" && (
                      <div className="flex items-center gap-1 text-red-400">
                        <AlertTriangle className="h-3 w-3" />
                        <span>Needs attention</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-xs text-muted-foreground text-center">
            {data.period}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
