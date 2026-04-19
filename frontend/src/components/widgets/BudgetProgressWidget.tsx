import { useEffect, useState } from "react"
import { PiggyBank, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { dashboardApi } from "@/lib/api"
import { formatCurrency } from "@/lib/utils"

interface BudgetProgressWidgetProps {
  accountId: number
  size?: string
}

interface Budget {
  id: number
  name: string
  spent: string
  amount: string
  progress: number
  category: string
}

interface BudgetProgressData {
  budgets: Budget[]
  count: number
}

export default function BudgetProgressWidget({ accountId, size }: BudgetProgressWidgetProps) {
  const [data, setData] = useState<BudgetProgressData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    loadData()
  }, [accountId])

  async function loadData() {
    try {
      const response = await dashboardApi.getWidgetData(accountId, "budget_progress")
      setData(response.data)
    } catch (error) {
      console.error("Failed to load budget progress widget data", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className="h-full bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <PiggyBank className="h-4 w-4" />
            Budget Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="animate-pulse bg-slate-700 h-4 w-20 rounded"></div>
                  <div className="animate-pulse bg-slate-700 h-4 w-12 rounded"></div>
                </div>
                <div className="animate-pulse bg-slate-700 h-2 w-full rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data || data.budgets.length === 0) {
    return (
      <Card className="h-full bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <PiggyBank className="h-4 w-4" />
            Budget Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-slate-400 py-8">
            <PiggyBank className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm mb-2">No budgets set</p>
            <p className="text-xs">Create budgets to track your spending goals</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const defaultDisplayCount = size === "small" ? 2 : size === "large" ? 6 : 4
  const displayCount = isExpanded ? data.budgets.length : defaultDisplayCount
  const budgets = data.budgets.slice(0, displayCount)
  const hasMore = data.count > defaultDisplayCount

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PiggyBank className="h-4 w-4" />
            Budget Progress
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
        <div className="space-y-3 flex-1 overflow-auto">
          {budgets.map((budget) => {
            const isOverBudget = budget.progress > 100
            const isNearLimit = budget.progress >= 80 && budget.progress <= 100
            const displayProgress = isOverBudget ? 100 : budget.progress
            
            return (
              <div key={budget.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate max-w-[120px]">
                      {budget.name}
                    </span>
                    {isOverBudget && (
                      <AlertTriangle className="h-3 w-3 text-red-400" />
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {formatCurrency(budget.spent)}
                    </div>
                    <div className="text-xs text-slate-400">
                      of {formatCurrency(budget.amount)}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <Progress 
                    value={displayProgress} 
                    className="h-2"
                  />
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>{budget.category}</span>
                    <span className={`
                      ${isOverBudget ? "text-red-400 font-medium" : 
                        isNearLimit ? "text-yellow-400" : 
                        "text-teal-400"}
                    `}>
                      {budget.progress.toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
          
          {!isExpanded && hasMore && (
            <div className="text-center pt-2">
              <p className="text-xs text-slate-400">
                {data.count - defaultDisplayCount} more budgets
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
