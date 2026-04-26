import { useEffect, useState } from "react"
import { Calendar, AlertCircle, ChevronDown, ChevronUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { dashboardApi } from "@/lib/api"
import { formatCurrency, formatDate } from "@/lib/utils"

interface UpcomingBillsWidgetProps {
  accountId: number
  size?: string
}

interface Bill {
  id: number
  name: string
  amount: string
  due_date: string
  category?: string
  is_recurring: boolean
}

interface UpcomingBillsData {
  bills: Bill[]
  total_due: string
  count: number
}

export default function UpcomingBillsWidget({ accountId, size }: UpcomingBillsWidgetProps) {
  const [data, setData] = useState<UpcomingBillsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    loadData()
  }, [accountId])

  async function loadData() {
    try {
      const response = await dashboardApi.getWidgetData(accountId, "upcoming_bills")
      setData(response.data)
    } catch (error) {
      console.error("Failed to load upcoming bills widget data", error)
    } finally {
      setLoading(false)
    }
  }

  function getDaysUntilDue(dueDate: string): number {
    const due = new Date(dueDate)
    const today = new Date()
    const diffTime = due.getTime() - today.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  function getUrgencyLevel(days: number): { color: string; label: string } {
    if (days <= 0) return { color: 'red', label: 'Overdue' }
    if (days <= 3) return { color: 'red', label: 'Due Soon' }
    if (days <= 7) return { color: 'yellow', label: 'This Week' }
    return { color: 'green', label: 'Upcoming' }
  }

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Upcoming Bills
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="animate-pulse bg-muted h-4 w-24 rounded"></div>
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

  if (!data || data.bills.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Upcoming Bills
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm mb-2">No upcoming bills</p>
            <p className="text-xs">Add recurring expenses to track them here</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const defaultDisplayCount = size === "small" ? 2 : size === "large" ? 8 : 5
  const displayCount = isExpanded ? data.bills.length : defaultDisplayCount
  const bills = data.bills.slice(0, displayCount)
  const hasMore = data.count > defaultDisplayCount

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Upcoming Bills
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
          {/* Total Due */}
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  Total Due
                </span>
              </div>
              <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {formatCurrency(data.total_due)}
              </div>
            </div>
          </div>

          {/* Bills List */}
          <div className="space-y-3">
            {bills.map((bill) => {
              const daysUntil = getDaysUntilDue(bill.due_date)
              const urgency = getUrgencyLevel(daysUntil)

              return (
                <div key={bill.id} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium truncate">
                        {bill.name}
                      </p>
                      {bill.is_recurring && (
                        <Badge variant="outline" className="text-xs">
                          Recurring
                        </Badge>
                      )}
                      {daysUntil <= 3 && (
                        <AlertCircle className="h-3 w-3 text-red-400" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatDate(bill.due_date)}</span>
                      {bill.category && (
                        <>
                          <span>·</span>
                          <span>{bill.category}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Badge 
                      variant={urgency.color === 'red' ? 'destructive' : urgency.color === 'yellow' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {urgency.label}
                    </Badge>
                    <span className="text-sm font-semibold">
                      {formatCurrency(bill.amount)}
                    </span>
                  </div>
                </div>
              )
            })}
            
            {!isExpanded && hasMore && (
              <div className="text-center pt-2">
                <p className="text-xs text-muted-foreground">
                  {data.count - defaultDisplayCount} more bills
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
