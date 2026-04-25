import { useEffect, useState } from "react"
import { PiggyBank, AlertTriangle, ChevronDown, ChevronUp, X, ArrowLeft } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { dashboardApi, transactionsApi, type Transaction } from "@/lib/api"
import { formatCurrency, formatDate } from "@/lib/utils"

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
  const [showTransactionsModal, setShowTransactionsModal] = useState(false)
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [transactionsLoading, setTransactionsLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [accountId])

  async function loadData() {
    try {
      const response = await dashboardApi.getWidgetData(accountId, "budget_progress")
      console.log("Budget widget data:", response.data)
      setData(response.data)
    } catch (error) {
      console.error("Failed to load budget progress widget data", error)
    } finally {
      setLoading(false)
    }
  }

  async function loadBudgetTransactions(budgetId: number) {
    setTransactionsLoading(true)
    try {
      const response = await transactionsApi.list(accountId, { budget_id: String(budgetId) })
      setTransactions(response.data || [])
    } catch (error) {
      console.error("Failed to load budget transactions", error)
      setTransactions([])
    } finally {
      setTransactionsLoading(false)
    }
  }

  function handleBudgetClick(budget: Budget) {
    setSelectedBudget(budget)
    setShowTransactionsModal(true)
    loadBudgetTransactions(budget.id)
  }

  function closeModal() {
    setShowTransactionsModal(false)
    setSelectedBudget(null)
    setTransactions([])
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
    <>
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
                <div key={budget.id} className="space-y-2 cursor-pointer hover:bg-slate-700/30 p-2 rounded-md transition-colors" onClick={() => handleBudgetClick(budget)}>
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

      {/* Transactions Modal */}
      {showTransactionsModal && selectedBudget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] bg-slate-800 border-slate-700">
            <CardHeader className="border-b border-slate-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="icon" onClick={closeModal} className="text-slate-400 hover:text-slate-200">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div>
                    <CardTitle className="text-slate-100">{selectedBudget.name} Transactions</CardTitle>
                    <p className="text-sm text-slate-400">
                      {formatCurrency(selectedBudget.spent)} of {formatCurrency(selectedBudget.amount)} spent
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={closeModal} className="text-slate-400 hover:text-slate-200">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-auto">
              {transactionsLoading ? (
                <div className="p-6 text-center text-slate-400">
                  Loading transactions...
                </div>
              ) : transactions.length === 0 ? (
                <div className="p-6 text-center text-slate-400">
                  No transactions found for this budget
                </div>
              ) : (
                <div className="divide-y divide-slate-700">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="p-4 hover:bg-slate-700/30 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-100 truncate">
                            {transaction.description || "Untitled transaction"}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                            <span>{formatDate(transaction.date)}</span>
                            {transaction.category && (
                              <>
                                <span>·</span>
                                <span>{transaction.category.name}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className={`font-semibold ${
                          transaction.type === "income" ? "text-teal-400" : "text-red-400"
                        }`}>
                          {transaction.type === "income" ? "+" : "-"}{formatCurrency(transaction.amount)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
