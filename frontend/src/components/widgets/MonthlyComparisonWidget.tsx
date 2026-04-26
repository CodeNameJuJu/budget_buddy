import { useEffect, useState } from "react"
import { BarChart2, TrendingUp, TrendingDown } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { dashboardApi } from "@/lib/api"
import { formatCurrency } from "@/lib/utils"

interface MonthlyComparisonWidgetProps {
  accountId: number
  size?: string
}

interface MonthData {
  month: string
  income: string
  expenses: string
  net: string
}

interface MonthlyComparisonData {
  months: MonthData[]
  period: string
}

export default function MonthlyComparisonWidget({ accountId, size }: MonthlyComparisonWidgetProps) {
  const [data, setData] = useState<MonthlyComparisonData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [accountId])

  async function loadData() {
    try {
      const response = await dashboardApi.getWidgetData(accountId, "monthly_comparison")
      setData(response.data)
    } catch (error) {
      console.error("Failed to load monthly comparison widget data", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <BarChart2 className="h-4 w-4" />
            Monthly Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="animate-pulse bg-muted h-40 w-full rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data || !data.months || data.months.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <BarChart2 className="h-4 w-4" />
            Monthly Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <BarChart2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm mb-2">No monthly data</p>
            <p className="text-xs">Add transactions to see monthly comparisons</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const chartData = data.months.map(m => ({
    name: m.month,
    income: parseFloat(m.income),
    expenses: parseFloat(m.expenses),
    net: parseFloat(m.net),
  }))

  const latestMonth = data.months[data.months.length - 1]
  const previousMonth = data.months[data.months.length - 2]
  const incomeChange = previousMonth
    ? ((parseFloat(latestMonth.income) - parseFloat(previousMonth.income)) / parseFloat(previousMonth.income)) * 100
    : 0
  const expenseChange = previousMonth
    ? ((parseFloat(latestMonth.expenses) - parseFloat(previousMonth.expenses)) / parseFloat(previousMonth.expenses)) * 100
    : 0

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <BarChart2 className="h-4 w-4" />
          Monthly Comparison
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden flex flex-col">
        <div className="space-y-4 flex-1 overflow-auto">
          {/* Summary Stats */}
          {previousMonth && (
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <div className="flex items-center gap-1 text-emerald-400 mb-1">
                  <TrendingUp className="h-3 w-3" />
                  <span className="text-xs">Income Change</span>
                </div>
                <div className={`text-sm font-semibold ${incomeChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {incomeChange >= 0 ? '+' : ''}{incomeChange.toFixed(1)}%
                </div>
              </div>
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <div className="flex items-center gap-1 text-red-400 mb-1">
                  <TrendingDown className="h-3 w-3" />
                  <span className="text-xs">Expense Change</span>
                </div>
                <div className={`text-sm font-semibold ${expenseChange <= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {expenseChange >= 0 ? '+' : ''}{expenseChange.toFixed(1)}%
                </div>
              </div>
            </div>
          )}

          {/* Simple CSS Bar Chart */}
          <div className="space-y-3">
            {data.months.map((trend, index) => {
              const income = parseFloat(trend.income) || 0
              const expenses = parseFloat(trend.expenses) || 0
              const net = parseFloat(trend.net) || (income - expenses)
              const maxValue = Math.max(...data.months.map(m => Math.max(parseFloat(m.income), parseFloat(m.expenses))))
              const incomeHeight = maxValue > 0 ? (income / maxValue) * 100 : 0
              const expenseHeight = maxValue > 0 ? (expenses / maxValue) * 100 : 0

              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{trend.month}</span>
                    <span className={`font-semibold ${net >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {formatCurrency(net.toString())}
                    </span>
                  </div>
                  <div className="flex gap-2 h-16 items-end">
                    <div className="flex-1 flex flex-col items-center">
                      <div
                        className="w-full bg-emerald-500 rounded-t"
                        style={{ height: `${Math.max(incomeHeight, 0)}%` }}
                        title={`Income: ${formatCurrency(trend.income)}`}
                      />
                      <span className="text-xs text-muted-foreground mt-1">{formatCurrency(trend.income)}</span>
                    </div>
                    <div className="flex-1 flex flex-col items-center">
                      <div
                        className="w-full bg-red-500 rounded-t"
                        style={{ height: `${Math.max(expenseHeight, 0)}%` }}
                        title={`Expenses: ${formatCurrency(trend.expenses)}`}
                      />
                      <span className="text-xs text-muted-foreground mt-1">{formatCurrency(trend.expenses)}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="text-xs text-muted-foreground text-center">
            {data.period}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
