import { useEffect, useState } from "react"
import { ArrowLeftRight, Calendar, Tag, ChevronDown, ChevronUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { dashboardApi } from "@/lib/api"
import { formatCurrency, formatDate } from "@/lib/utils"

interface RecentTransactionsWidgetProps {
  accountId: number
  size?: string
}

interface Transaction {
  id: number
  description?: string
  category?: { name: string }
  amount: string
  type: "income" | "expense"
  date: string
  tags?: string[]
  account_type?: "checking" | "savings"
}

interface RecentTransactionsData {
  transactions: Transaction[]
  count: number
}

export default function RecentTransactionsWidget({ accountId, size }: RecentTransactionsWidgetProps) {
  const [data, setData] = useState<RecentTransactionsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    loadData()
  }, [accountId])

  async function loadData() {
    try {
      const response = await dashboardApi.getWidgetData(accountId, "recent_transactions")
      setData(response.data)
    } catch (error) {
      console.error("Failed to load recent transactions widget data", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <ArrowLeftRight className="h-4 w-4" />
            Recent Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    )
  }

  if (!data || data.transactions.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <ArrowLeftRight className="h-4 w-4" />
            Recent Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <ArrowLeftRight className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm mb-2">No transactions yet</p>
            <p className="text-xs">Start tracking your expenses to see them here</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const defaultDisplayCount = size === "small" ? 2 : size === "large" ? 6 : 4
  const displayCount = isExpanded ? data.transactions.length : defaultDisplayCount
  const transactions = data.transactions.slice(0, displayCount)
  const hasMore = data.count > defaultDisplayCount

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="h-4 w-4" />
            Recent Transactions
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
        <div className="space-y-2 flex-1 overflow-auto">
          {transactions.map((t) => (
            <div key={t.id} className="flex items-center justify-between py-2 border-b last:border-0">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium truncate">
                    {t.description || t.category?.name || "Transaction"}
                  </p>
                  {t.account_type === "savings" && (
                    <Badge variant="outline" className="text-xs text-blue-600 border-blue-200">
                      Savings
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{formatDate(t.date)}</p>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <Badge variant={t.type === "income" ? "default" : "destructive"} className="text-xs">
                  {t.type}
                </Badge>
                <span className={`text-sm font-semibold ${t.type === "income" ? "text-green-500" : "text-red-500"}`}>
                  {t.type === "income" ? "+" : "-"}{formatCurrency(t.amount)}
                </span>
              </div>
            </div>
          ))}
          
          {!isExpanded && hasMore && (
            <div className="text-center pt-2">
              <p className="text-xs text-muted-foreground">
                {data.count - defaultDisplayCount} more transactions
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
