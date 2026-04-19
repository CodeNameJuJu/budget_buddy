import { useEffect, useState } from "react"
import { PiggyBank, TrendingDown, ChevronDown, ChevronUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { dashboardApi } from "@/lib/api"
import { formatCurrency, formatDate } from "@/lib/utils"

interface SavingsWithdrawalsWidgetProps {
  accountId: number
  size?: string
}

interface SavingsWithdrawal {
  id: number
  description?: string
  category?: { name: string }
  amount: string
  date: string
  notes?: string
}

interface SavingsWithdrawalsData {
  withdrawals: SavingsWithdrawal[]
  total_withdrawn: string
  count: number
  period: string
}

export default function SavingsWithdrawalsWidget({ accountId, size }: SavingsWithdrawalsWidgetProps) {
  const [data, setData] = useState<SavingsWithdrawalsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    loadData()
  }, [accountId])

  async function loadData() {
    try {
      const response = await dashboardApi.getWidgetData(accountId, "savings_withdrawals")
      setData(response.data)
    } catch (error) {
      console.error("Failed to load savings withdrawals widget data", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <PiggyBank className="h-4 w-4" />
            Savings Withdrawals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="animate-pulse bg-muted h-4 w-24 rounded"></div>
              <div className="animate-pulse bg-muted h-4 w-16 rounded"></div>
            </div>
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

  if (!data || data.withdrawals.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <PiggyBank className="h-4 w-4" />
            Savings Withdrawals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <PiggyBank className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm mb-2">No savings withdrawals yet</p>
            <p className="text-xs">Track when you spend from your savings account</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const defaultDisplayCount = size === "small" ? 2 : size === "large" ? 8 : 5
  const displayCount = isExpanded ? data.withdrawals.length : defaultDisplayCount
  const withdrawals = data.withdrawals.slice(0, displayCount)
  const hasMore = data.count > defaultDisplayCount

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PiggyBank className="h-4 w-4" />
            Savings Withdrawals
            <Badge variant="secondary" className="text-xs">
              {data.count}
            </Badge>
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
                  Show All ({data.count})
                </>
              )}
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden flex flex-col">
        <div className="space-y-4 flex-1 overflow-auto">
          {/* Summary Card */}
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium text-red-700 dark:text-red-300">
                  Total Withdrawn
                </span>
              </div>
              <div className="text-lg font-bold text-red-600 dark:text-red-400">
                {formatCurrency(data.total_withdrawn)}
              </div>
            </div>
            <div className="text-xs text-red-600 dark:text-red-400 mt-1">
              {data.period}
            </div>
          </div>

          {/* Withdrawals List */}
          <div className="space-y-3">
            {withdrawals.map((withdrawal) => (
              <div key={withdrawal.id} className="flex items-center justify-between py-3 border-b last:border-0">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium truncate">
                      {withdrawal.description || "Savings Withdrawal"}
                    </p>
                    {withdrawal.category && (
                      <Badge variant="outline" className="text-xs">
                        {withdrawal.category.name}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{formatDate(withdrawal.date)}</p>
                  {withdrawal.notes && (
                    <p className="text-xs text-muted-foreground mt-1 italic">
                      {withdrawal.notes}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Badge variant="destructive" className="text-xs">
                    Withdrawal
                  </Badge>
                  <span className="text-sm font-semibold text-red-500">
                    -{formatCurrency(withdrawal.amount)}
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          {!isExpanded && hasMore && (
            <div className="text-center pt-2">
              <p className="text-xs text-muted-foreground">
                {data.count - defaultDisplayCount} more withdrawals
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
