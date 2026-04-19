import { useEffect, useState } from "react"
import { TrendingUp, TrendingDown, ChevronDown, ChevronUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { dashboardApi } from "@/lib/api"
import { formatCurrency } from "@/lib/utils"

interface SpendingTrendsWidgetProps {
  accountId: number
  size?: string
}

interface TrendData {
  month: string
  income: string
  expenses: string
  net: string
}

interface SpendingTrendsData {
  trends: TrendData[]
  period: string
}

export default function SpendingTrendsWidget({ accountId, size }: SpendingTrendsWidgetProps) {
  const [data, setData] = useState<SpendingTrendsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    loadData()
  }, [accountId])

  async function loadData() {
    try {
      const response = await dashboardApi.getWidgetData(accountId, "spending_trends")
      setData(response.data)
    } catch (error) {
      console.error("Failed to load spending trends data", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Spending Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse bg-muted h-8 w-full rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data || !data.trends || data.trends.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Spending Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm mb-2">No spending data available</p>
            <p className="text-xs">Add transactions to see your spending patterns</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const defaultDisplayCount = size === "small" ? 3 : size === "large" ? 8 : 6
  const displayCount = isExpanded ? data.trends.length : defaultDisplayCount
  const trends = data.trends.slice(0, displayCount)
  const hasMore = data.trends.length > defaultDisplayCount

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Spending Trends
          </div>
          {hasMore && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-6 px-2 text-xs"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-3 w-3 mr-1" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3 mr-1" />
                  Show All ({data.trends.length})
                </>
              )}
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden flex flex-col">
        <div className="space-y-3 flex-1 overflow-auto">
          <div className="text-xs text-muted-foreground text-center">
            {data.period}
          </div>
          <div className="space-y-2">
            {trends.map((trend, index) => {
              const income = parseFloat(trend.income) || 0
              const expenses = parseFloat(trend.expenses) || 0
              const net = parseFloat(trend.net) || (income - expenses)
              const isPositive = !isNaN(net) && net >= 0
              const hasData = income > 0 || expenses > 0

              return (
                <div key={index} className="flex items-center justify-between text-sm py-2 border-b last:border-0">
                  <div className="font-medium">{trend.month}</div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-green-500">
                      <TrendingUp className="h-3 w-3" />
                      <span>{formatCurrency(income.toString())}</span>
                    </div>
                    <div className="flex items-center gap-1 text-red-500">
                      <TrendingDown className="h-3 w-3" />
                      <span>{formatCurrency(expenses.toString())}</span>
                    </div>
                    {hasData ? (
                      <div className={`font-semibold min-w-[80px] text-right ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                        {isPositive ? '+' : ''}{formatCurrency(net.toString())}
                      </div>
                    ) : (
                      <div className="text-muted-foreground min-w-[80px] text-right">-</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          
          {!isExpanded && hasMore && (
            <div className="text-center pt-2">
              <p className="text-xs text-muted-foreground">
                {data.trends.length - defaultDisplayCount} more months
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
