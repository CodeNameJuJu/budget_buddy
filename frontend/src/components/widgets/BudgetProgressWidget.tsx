import { useEffect, useState } from "react"
import { PiggyBank, AlertTriangle, ChevronDown, ChevronUp, X, ArrowLeft } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { dashboardApi, transactionsApi, type Transaction } from "@/lib/api"
import { formatCurrency, formatDate } from "@/lib/utils"
import { useTheme } from "@/contexts/ThemeContext"
import { cn } from "@/lib/utils"

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
  category_id?: number
}

interface BudgetProgressData {
  budgets: Budget[]
  count: number
}

export default function BudgetProgressWidget({ accountId, size }: BudgetProgressWidgetProps) {
  const [data, setData] = useState<BudgetProgressData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isExpanded, setIsExpanded] = useState(false)
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [showTransactionsModal, setShowTransactionsModal] = useState(false)
  const [transactionsLoading, setTransactionsLoading] = useState(false)
  const { theme } = useTheme()

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

  async function loadBudgetTransactions(budgetId: number) {
    setTransactionsLoading(true)
    try {
      const budget = selectedBudget
      if (!budget) return

      // Filter by category name since that's what we have in the data
      const response = await transactionsApi.list(accountId)
      const filtered = response.data?.filter(t => t.category?.name === budget.category) || []
      setTransactions(filtered)
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
      <Card className={cn(
        "h-full border",
        theme === "light" ? "bg-[#E8DCC5]/50 border-[#E6E0D6]" : "bg-[#18231D]/50 border-[#2E3B35]"
      )}>
        <CardHeader className="pb-2">
          <CardTitle className={cn("text-sm font-medium flex items-center gap-2", theme === "light" ? "text-[#1F2A24]" : "text-[#E7EFEA]")}>
            <PiggyBank className="h-4 w-4" />
            Budget Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className={cn("animate-pulse h-4 w-20 rounded", theme === "light" ? "bg-[#E6E0D6]" : "bg-[#2E3B35]")}></div>
                  <div className={cn("animate-pulse h-4 w-12 rounded", theme === "light" ? "bg-[#E6E0D6]" : "bg-[#2E3B35]")}></div>
                </div>
                <div className={cn("animate-pulse h-2 w-full rounded", theme === "light" ? "bg-[#E6E0D6]" : "bg-[#2E3B35]")}></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data || !data.budgets || data.budgets.length === 0) {
    return (
      <Card className={cn(
        "h-full border",
        theme === "light" ? "bg-[#E8DCC5]/50 border-[#E6E0D6]" : "bg-[#18231D]/50 border-[#2E3B35]"
      )}>
        <CardHeader className="pb-2">
          <CardTitle className={cn("text-sm font-medium flex items-center gap-2", theme === "light" ? "text-[#1F2A24]" : "text-[#E7EFEA]")}>
            <PiggyBank className="h-4 w-4" />
            Budget Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={cn("text-center py-8", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>
            <PiggyBank className={cn("h-8 w-8 mx-auto mb-2 opacity-50", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")} />
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
          <CardTitle className={cn("text-sm font-medium flex items-center justify-between", theme === "light" ? "text-[#1F2A24]" : "text-[#E7EFEA]")}>
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
                <div key={budget.id} className={cn("space-y-2 cursor-pointer p-2 rounded-md transition-colors", theme === "light" ? "hover:bg-[#E6E0D6]/30" : "hover:bg-[#2E3B35]/30")} onClick={() => handleBudgetClick(budget)}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="text-sm font-medium truncate">
                        {budget.name}
                      </span>
                      {isOverBudget && (
                        <AlertTriangle className="h-3 w-3 text-red-400 flex-shrink-0" />
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {formatCurrency(budget.spent)}
                      </div>
                      <div className={cn("text-xs", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>
                        of {formatCurrency(budget.amount)}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Progress
                      value={displayProgress}
                      className="h-2"
                    />
                    <div className={cn("flex items-center justify-between text-xs", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>
                      <span>{budget.category}</span>
                      <span className={cn(
                        isOverBudget ? "text-red-400 font-medium" :
                          isNearLimit ? (theme === "light" ? "text-[#D9B44A]" : "text-[#C9A24A]") :
                          (theme === "light" ? "text-[#6BAF92]" : "text-[#A8D5BA]")
                      )}>
                        {budget.progress.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}

            {!isExpanded && hasMore && (
              <div className="text-center pt-2">
                <p className={cn("text-xs", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>
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
          <Card className={cn(
            "w-full max-w-2xl max-h-[80vh] border",
            theme === "light" ? "bg-[#E8DCC5] border-[#E6E0D6]" : "bg-[#18231D] border-[#2E3B35]"
          )}>
            <CardHeader className={cn("border-b", theme === "light" ? "border-[#E6E0D6]" : "border-[#2E3B35]")}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="icon" onClick={closeModal} className={cn(theme === "light" ? "text-[#6C7A73] hover:text-[#1F2A24]" : "text-[#A7B3AD] hover:text-[#E7EFEA]")}>
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div>
                    <CardTitle className={theme === "light" ? "text-[#1F2A24]" : "text-[#E7EFEA]"}>{selectedBudget.name} Transactions</CardTitle>
                    <p className={cn("text-sm", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>
                      {formatCurrency(selectedBudget.spent)} of {formatCurrency(selectedBudget.amount)} spent
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={closeModal} className={cn(theme === "light" ? "text-[#6C7A73] hover:text-[#1F2A24]" : "text-[#A7B3AD] hover:text-[#E7EFEA]")}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-auto">
              {transactionsLoading ? (
                <div className={cn("p-6 text-center", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>
                  Loading transactions...
                </div>
              ) : transactions.length === 0 ? (
                <div className={cn("p-6 text-center", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>
                  No transactions found for this budget
                </div>
              ) : (
                <div className={cn("divide-y", theme === "light" ? "divide-[#E6E0D6]" : "divide-[#2E3B35]")}>
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className={cn("p-4 transition-colors", theme === "light" ? "hover:bg-[#E6E0D6]/30" : "hover:bg-[#2E3B35]/30")}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className={cn("font-medium truncate", theme === "light" ? "text-[#1F2A24]" : "text-[#E7EFEA]")}>
                            {transaction.description || "Untitled transaction"}
                          </p>
                          <div className={cn("flex items-center gap-2 mt-1 text-xs", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>
                            <span>{formatDate(transaction.date)}</span>
                            {transaction.category && (
                              <>
                                <span>·</span>
                                <span>{transaction.category.name}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className={cn(
                          "font-semibold",
                          transaction.type === "income"
                            ? (theme === "light" ? "text-[#6BAF92]" : "text-[#A8D5BA]")
                            : "text-red-400"
                        )}>
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
