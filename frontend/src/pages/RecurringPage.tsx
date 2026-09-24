import { useEffect, useState } from "react"
import { Repeat, Play, CheckCircle2, Pause, Trash2, PiggyBank } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import BudgetDetailModal from "@/components/budgets/BudgetDetailModal"
import { accountsApi, budgetsApi, recurringApi, type Budget, type RecurringTransaction } from "@/lib/api"
import { formatCurrency, formatDate, cn } from "@/lib/utils"
import { useTheme } from "@/contexts/ThemeContext"

export default function RecurringPage() {
  const { theme } = useTheme()
  const [accountId, setAccountId] = useState<number | null>(null)
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [recurring, setRecurring] = useState<RecurringTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [triggeringId, setTriggeringId] = useState<number | "all" | null>(null)
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null)
  const [recurringToDelete, setRecurringToDelete] = useState<number | null>(null)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const isLight = theme === "light"
  const mutedText = isLight ? "text-[#6C7A73]" : "text-[#ABA9A2]"
  const strongText = isLight ? "text-[#1F2A24]" : "text-[#EDEBE6]"
  const border = isLight ? "border-[#E6E0D6]" : "border-[#38352F]"

  const dueItems = recurring.filter((r) => r.is_active && !r.triggered_this_period)
  const dueTotal = dueItems.reduce((sum, r) => sum + parseFloat(r.amount), 0)
  const activeTotal = recurring.filter((r) => r.is_active).reduce((sum, r) => sum + parseFloat(r.amount), 0)

  useEffect(() => {
    loadUserAccount()
  }, [])

  useEffect(() => {
    if (accountId) loadData()
  }, [accountId])

  async function loadUserAccount() {
    try {
      const response = await accountsApi.getMyAccount()
      if (response.data && response.data.length > 0) {
        setAccountId(response.data[0].id)
      }
    } catch (error) {
      console.error("Failed to load user account", error)
    }
  }

  async function loadData() {
    if (!accountId) return
    setLoading(true)
    try {
      const [budRes, recRes] = await Promise.all([budgetsApi.list(accountId), recurringApi.list()])
      setBudgets(budRes.data || [])
      setRecurring(recRes.data || [])
    } catch {
      console.error("Failed to load recurring transactions")
    } finally {
      setLoading(false)
    }
  }

  function showMessage(type: "success" | "error", text: string) {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3000)
  }

  async function handleTrigger(item: RecurringTransaction) {
    setTriggeringId(item.id)
    try {
      await recurringApi.trigger(item.id, { force: item.triggered_this_period })
      showMessage("success", `Captured ${item.description} for this period`)
      loadData()
    } catch (error) {
      showMessage("error", error instanceof Error ? error.message : "Failed to trigger transaction")
    } finally {
      setTriggeringId(null)
    }
  }

  async function handleTriggerAllDue() {
    setTriggeringId("all")
    try {
      const budgetIds = Array.from(new Set(dueItems.map((r) => r.budget_id)))
      const results = await Promise.all(budgetIds.map((id) => budgetsApi.triggerRecurring(id)))
      const created = results.reduce((sum, r) => sum + (r.data?.created?.length || 0), 0)
      showMessage("success", `Captured ${created} transaction${created === 1 ? "" : "s"}`)
      loadData()
    } catch (error) {
      showMessage("error", error instanceof Error ? error.message : "Failed to trigger transactions")
    } finally {
      setTriggeringId(null)
    }
  }

  async function handleToggleActive(item: RecurringTransaction) {
    try {
      await recurringApi.update(item.id, { is_active: !item.is_active })
      loadData()
    } catch {
      showMessage("error", "Failed to update recurring transaction")
    }
  }

  async function handleDeleteRecurring() {
    if (!recurringToDelete) return
    try {
      await recurringApi.delete(recurringToDelete)
      loadData()
    } catch {
      showMessage("error", "Failed to delete recurring transaction")
    }
  }

  function renderSummaryCard(title: string, value: string, subtitle: string) {
    return (
      <Card className={cn("border", isLight ? "bg-[#E8DCC5]/50 border-[#E6E0D6]" : "bg-[#201E1B]/50 border-[#38352F]")}>
        <CardHeader className="pb-2">
          <CardTitle className={cn("text-sm font-medium", mutedText)}>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className={cn("text-2xl font-bold", strongText)}>{value}</p>
          <p className={cn("text-xs mt-1", mutedText)}>{subtitle}</p>
        </CardContent>
      </Card>
    )
  }

  function renderItem(item: RecurringTransaction) {
    const isDue = item.is_active && !item.triggered_this_period
    return (
      <div key={item.id} className={cn("flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 p-3 rounded-md border", border, !item.is_active && "opacity-60")}>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={cn("h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 text-white", item.triggered_this_period ? "bg-[#6BAF92]" : isDue ? (isLight ? "bg-[#D9B44A]" : "bg-[#C9A24A]") : "bg-[#6C7A73]")}>
            {item.triggered_this_period ? <CheckCircle2 className="h-4 w-4" /> : <Repeat className="h-4 w-4" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className={cn("text-sm font-medium truncate", strongText)}>{item.description}</p>
            <p className={cn("text-xs", mutedText)}>
              {formatCurrency(item.amount)}
              {item.due_day && ` · due on day ${item.due_day}`}
              {!item.is_active && " · paused"}
              {item.triggered_this_period && item.triggered_transaction && ` · captured ${formatDate(item.triggered_transaction.date)}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {isDue && <Badge className={cn("text-xs", isLight ? "bg-[#D9B44A] text-[#1F2A24]" : "bg-[#C9A24A] text-[#1F2A24]")}>Due</Badge>}
          {item.is_active && (
            <Button size="sm" variant={item.triggered_this_period ? "outline" : "default"} disabled={triggeringId !== null} onClick={() => handleTrigger(item)}>
              <Play className="h-3.5 w-3.5 mr-1" />
              {item.triggered_this_period ? "Again" : "Trigger"}
            </Button>
          )}
          <Button variant="ghost" size="icon" className={mutedText} onClick={() => handleToggleActive(item)} title={item.is_active ? "Pause" : "Resume"}>
            {item.is_active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" className={cn(mutedText, "hover:text-red-400")} onClick={() => setRecurringToDelete(item.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  function renderBudgetGroup(budget: Budget) {
    const items = recurring.filter((r) => r.budget_id === budget.id)
    if (items.length === 0) return null
    const due = items.filter((r) => r.is_active && !r.triggered_this_period).length
    return (
      <Card key={budget.id} className={cn("border", isLight ? "bg-[#E8DCC5]/50 border-[#E6E0D6]" : "bg-[#201E1B]/50 border-[#38352F]")}>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className={cn("text-base", strongText)}>{budget.name}</CardTitle>
            <p className={cn("text-xs mt-1", mutedText)}>
              {budget.category?.name} · {budget.period} · {due === 0 ? "all captured" : `${due} due`}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setSelectedBudget(budget)}>
            <PiggyBank className="h-3.5 w-3.5 mr-1" />
            Manage
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">{items.map(renderItem)}</CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className={cn("text-2xl font-bold tracking-tight", strongText)}>Recurring</h1>
            <p className={mutedText}>Bills and subscriptions you capture once per budget period</p>
          </div>
          {dueItems.length > 0 && (
            <Button disabled={triggeringId !== null} onClick={handleTriggerAllDue} className="hover:shadow-lg transition-all duration-300">
              <Play className="h-4 w-4 mr-2" />
              Trigger all due ({dueItems.length})
            </Button>
          )}
        </div>

        {message && (
          <div className={cn("p-3 rounded-lg text-sm", message.type === "success" ? "bg-[#6BAF92]/20 text-[#6BAF92]" : "bg-red-500/20 text-red-400")}>
            {message.text}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          {renderSummaryCard("Still due", formatCurrency(dueTotal), `${dueItems.length} item${dueItems.length === 1 ? "" : "s"} not yet captured this period`)}
          {renderSummaryCard("Per period", formatCurrency(activeTotal), `${recurring.filter((r) => r.is_active).length} active recurring item${recurring.filter((r) => r.is_active).length === 1 ? "" : "s"}`)}
          {renderSummaryCard("Budgets", String(budgets.filter((b) => b.recurring_count > 0).length), "budgets with recurring items")}
        </div>

        {loading ? (
          <p className={cn("text-center py-8", mutedText)}>Loading...</p>
        ) : recurring.length === 0 ? (
          <div className="text-center py-16">
            <Repeat className={cn("h-12 w-12 mx-auto mb-4", mutedText)} />
            <h2 className={cn("text-lg font-semibold mb-1", strongText)}>No recurring transactions yet</h2>
            <p className={cn("text-sm", mutedText)}>Open a budget and add the bills you pay every period to capture them with one click.</p>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">{budgets.map(renderBudgetGroup)}</div>
        )}
      </div>

      {selectedBudget && (
        <BudgetDetailModal
          budget={budgets.find((b) => b.id === selectedBudget.id) || selectedBudget}
          onClose={() => setSelectedBudget(null)}
          onChanged={loadData}
        />
      )}

      <ConfirmDialog
        open={recurringToDelete !== null}
        onOpenChange={(open) => !open && setRecurringToDelete(null)}
        title="Delete recurring transaction"
        description="This removes the recurring template. Transactions already captured are kept."
        onConfirm={handleDeleteRecurring}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </>
  )
}
