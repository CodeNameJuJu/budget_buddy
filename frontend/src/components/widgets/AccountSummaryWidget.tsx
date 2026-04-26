import { useEffect, useState } from "react"
import { Wallet, TrendingUp, TrendingDown, ArrowRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { dashboardApi } from "@/lib/api"
import { formatCurrency } from "@/lib/utils"

interface AccountSummaryWidgetProps {
  accountId: number
  size?: string
}

interface AccountSummaryData {
  total_balance: string
  total_income: string
  total_expenses: string
  account_count: number
  period: string
}

export default function AccountSummaryWidget({ accountId, size }: AccountSummaryWidgetProps) {
  const [data, setData] = useState<AccountSummaryData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [accountId])

  async function loadData() {
    try {
      const response = await dashboardApi.getWidgetData(accountId, "account_summary")
      setData(response.data)
    } catch (error) {
      console.error("Failed to load account summary widget data", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Account Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="animate-pulse bg-muted h-8 w-32 rounded"></div>
            <div className="space-y-2">
              <div className="animate-pulse bg-muted h-4 w-20 rounded"></div>
              <div className="animate-pulse bg-muted h-4 w-20 rounded"></div>
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
            <Wallet className="h-4 w-4" />
            Account Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <Wallet className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm mb-2">Unable to load summary</p>
            <p className="text-xs">Please check your connection</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const balance = parseFloat(data.total_balance)
  const isPositive = balance >= 0

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Wallet className="h-4 w-4" />
          Account Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center py-2">
          <div className={`text-3xl font-bold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
            {formatCurrency(data.total_balance)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {data.account_count} account{data.account_count !== 1 ? 's' : ''}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex flex-col items-center gap-1 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <div className="flex items-center gap-1 text-emerald-400">
              <TrendingUp className="h-3 w-3" />
              <span className="text-xs">Income</span>
            </div>
            <span className="font-semibold text-emerald-400">{formatCurrency(data.total_income)}</span>
          </div>
          <div className="flex flex-col items-center gap-1 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <div className="flex items-center gap-1 text-red-400">
              <TrendingDown className="h-3 w-3" />
              <span className="text-xs">Expenses</span>
            </div>
            <span className="font-semibold text-red-400">{formatCurrency(data.total_expenses)}</span>
          </div>
        </div>

        <div className="text-center text-xs text-muted-foreground">
          {data.period}
        </div>

        <Button variant="outline" size="sm" className="w-full">
          View Details
          <ArrowRight className="h-3 w-3 ml-2" />
        </Button>
      </CardContent>
    </Card>
  )
}
