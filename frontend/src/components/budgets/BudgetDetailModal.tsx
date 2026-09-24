import { useEffect, useState } from "react"
import { X, Plus, Repeat, Trash2, Play, CheckCircle2, Pause } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import {
  budgetsApi,
  recurringApi,
  type Budget,
  type Transaction,
  type RecurringTransaction,
} from "@/lib/api"
import { formatCurrency, formatDate, cn } from "@/lib/utils"
import { useTheme } from "@/contexts/ThemeContext"

interface BudgetDetailModalProps {
  budget: Budget
  onClose: () => void
  // Called whenever transactions or recurring items change so the parent can
  // refresh the budget cards
  onChanged: () => void
}

const emptyRecurringForm = {
  description: "",
  amount: "",
  due_day: "",
  notes: "",
}

export default function BudgetDetailModal({ budget, onClose, onChanged }: BudgetDetailModalProps) {
  const { theme } = useTheme()
  const [activeTab, setActiveTab] = useState<"transactions" | "recurring">("transactions")
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [recurring, setRecurring] = useState<RecurringTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [showRecurringForm, setShowRecurringForm] = useState(false)
  const [recurringForm, setRecurringForm] = useState(emptyRecurringForm)
  const [triggeringId, setTriggeringId] = useState<number | "all" | null>(null)
  const [recurringToDelete, setRecurringToDelete] = useState<number | null>(null)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const isLight = theme === "light"
  const mutedText = isLight ? "text-[#6C7A73]" : "text-[#ABA9A2]"
  const strongText = isLight ? "text-[#1F2A24]" : "text-[#EDEBE6]"
  const border = isLight ? "border-[#E6E0D6]" : "border-[#38352F]"
  const dueCount = recurring.filter((r) => r.is_active && !r.triggered_this_period).length

  useEffect(() => {
    loadAll()
  }, [budget.id])

  async function loadAll() {
    setLoading(true)
    try {
      const [txRes, recRes] = await Promise.all([
        budgetsApi.transactions(budget.id),
        recurringApi.list({ budget_id: budget.id }),
      ])
      setTransactions(txRes.data || [])
      setRecurring(recRes.data || [])
    } catch {
      setTransactions([])
      setRecurring([])
    } finally {
      setLoading(false)
    }
  }

  function showMessage(type: "success" | "error", text: string) {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3000)
  }

  async function handleAddRecurring(e: React.FormEvent) {
    e.preventDefault()
    try {
      await recurringApi.create({
        budget_id: budget.id,
        amount: recurringForm.amount,
        type: "expense",
        description: recurringForm.description,
        notes: recurringForm.notes || undefined,
        due_day: recurringForm.due_day ? Number(recurringForm.due_day) : undefined,
      })
      setRecurringForm(emptyRecurringForm)
      setShowRecurringForm(false)
      await loadAll()
      onChanged()
    } catch (error) {
      showMessage("error", error instanceof Error ? error.message : "Failed to add recurring transaction")
    }
  }

  async function handleTrigger(item: RecurringTransaction) {
    setTriggeringId(item.id)
    try {
      await recurringApi.trigger(item.id, { force: item.triggered_this_period })
      showMessage("success", `Captured ${item.description} for this period`)
      await loadAll()
      onChanged()
    } catch (error) {
      showMessage("error", error instanceof Error ? error.message : "Failed to trigger transaction")
    } finally {
      setTriggeringId(null)
    }
  }

  async function handleTriggerAll() {
    setTriggeringId("all")
    try {
      const response = await budgetsApi.triggerRecurring(budget.id)
      const created = response.data?.created?.length || 0
      showMessage("success", created === 0 ? "Everything is already captured for this period" : `Captured ${created} transaction${created === 1 ? "" : "s"}`)
      await loadAll()
      onChanged()
    } catch (error) {
      showMessage("error", error instanceof Error ? error.message : "Failed to trigger transactions")
    } finally {
      setTriggeringId(null)
    }
  }

  async function handleToggleActive(item: RecurringTransaction) {
    try {
      await recurringApi.update(item.id, { is_active: !item.is_active })
      await loadAll()
      onChanged()
    } catch {
      showMessage("error", "Failed to update recurring transaction")
    }
  }

  async function handleDeleteRecurring() {
    if (!recurringToDelete) return
    try {
      await recurringApi.delete(recurringToDelete)
      await loadAll()
      onChanged()
    } catch {
      showMessage("error", "Failed to delete recurring transaction")
    }
  }

  function formatPeriod(): string {
    if (!budget.period_start) return budget.period
    const start = formatDate(budget.period_start)
    if (!budget.period_end) return `from ${start}`
    // period_end is exclusive, so show the day before
    const end = new Date(budget.period_end)
    end.setDate(end.getDate() - 1)
    return `${start} - ${formatDate(end)}`
  }

  function renderTabButton(tab: "transactions" | "recurring", label: string, count: number) {
    return (
      <button
        type="button"
        onClick={() => setActiveTab(tab)}
        className={cn(
          "px-3 py-1.5 text-sm rounded-md border transition-colors flex items-center gap-1.5",
          activeTab === tab
            ? isLight ? "bg-[#6BAF92] text-white border-[#6BAF92]" : "bg-[#6BAF92] text-white border-[#6BAF92]"
            : cn(border, mutedText, isLight ? "hover:bg-[#E6E0D6]/50" : "hover:bg-[#38352F]/50")
        )}
      >
        {label}
        <span className={cn("text-xs", activeTab === tab ? "text-white/80" : mutedText)}>({count})</span>
      </button>
    )
  }

  function renderTransactions() {
    if (transactions.length === 0) {
      return <p className={cn("text-center py-8", mutedText)}>No transactions found for this budget period.</p>
    }
    return (
      <div className="space-y-2">
        {transactions.map((t) => (
          <div key={t.id} className={cn("flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 p-3 rounded-md border", border)}>
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div
                className="h-8 w-8 rounded-full flex items-center justify-center text-xs sm:text-sm text-white flex-shrink-0"
                style={{ backgroundColor: t.category?.colour || "#6BAF92" }}
              >
                {t.category?.icon || t.category?.name?.[0] || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-medium truncate flex items-center gap-1.5", strongText)}>
                  {t.description || t.category?.name}
                  {t.recurring_transaction_id && <Repeat className={cn("h-3 w-3 flex-shrink-0", mutedText)} />}
                </p>
                <p className={cn("text-xs", mutedText)}>
                  {formatDate(t.date)}
                  {t.budget_id ? " · linked to budget" : " · via category"}
                </p>
              </div>
            </div>
            <span className={cn("text-sm font-semibold", t.type === "income" ? (isLight ? "text-[#6BAF92]" : "text-[#A8D5BA]") : "text-red-400")}>
              {t.type === "income" ? "+" : "-"}{formatCurrency(t.amount)}
            </span>
          </div>
        ))}
      </div>
    )
  }

  function renderRecurringForm() {
    return (
      <form onSubmit={handleAddRecurring} className={cn("grid gap-3 sm:grid-cols-2 p-3 rounded-md border", border)}>
        <div className="space-y-1">
          <label className={cn("text-xs font-medium", mutedText)}>Description</label>
          <Input placeholder="e.g. Netflix" value={recurringForm.description} onChange={(e) => setRecurringForm({ ...recurringForm, description: e.target.value })} required />
        </div>
        <div className="space-y-1">
          <label className={cn("text-xs font-medium", mutedText)}>Amount</label>
          <Input type="number" step="0.01" min="0.01" placeholder="0.00" value={recurringForm.amount} onChange={(e) => setRecurringForm({ ...recurringForm, amount: e.target.value })} required />
        </div>
        <div className="space-y-1">
          <label className={cn("text-xs font-medium", mutedText)}>Due day (optional)</label>
          <Input type="number" min="1" max="31" placeholder="e.g. 1" value={recurringForm.due_day} onChange={(e) => setRecurringForm({ ...recurringForm, due_day: e.target.value })} />
        </div>
        <div className="space-y-1">
          <label className={cn("text-xs font-medium", mutedText)}>Notes (optional)</label>
          <Input placeholder="Optional notes" value={recurringForm.notes} onChange={(e) => setRecurringForm({ ...recurringForm, notes: e.target.value })} />
        </div>
        <div className="sm:col-span-2 flex gap-2 justify-end">
          <Button type="button" variant="outline" size="sm" onClick={() => setShowRecurringForm(false)}>Cancel</Button>
          <Button type="submit" size="sm">Save recurring</Button>
        </div>
      </form>
    )
  }

  function renderRecurringItem(item: RecurringTransaction) {
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
              {item.due_day && ` · due on the ${item.due_day}${ordinal(item.due_day)}`}
              {!item.is_active && " · paused"}
              {item.triggered_this_period && item.triggered_transaction && ` · captured ${formatDate(item.triggered_transaction.date)}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {isDue && <Badge className={cn("text-xs", isLight ? "bg-[#D9B44A] text-[#1F2A24]" : "bg-[#C9A24A] text-[#1F2A24]")}>Due</Badge>}
          {item.is_active && (
            <Button
              size="sm"
              variant={item.triggered_this_period ? "outline" : "default"}
              disabled={triggeringId !== null}
              onClick={() => handleTrigger(item)}
              title={item.triggered_this_period ? "Capture again for this period" : "Capture this period's transaction"}
            >
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

  function renderRecurring() {
    return (
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className={cn("text-xs", mutedText)}>
            Recurring items are captured once per {budget.period.replace("ly", "")} when you trigger them.
          </p>
          <div className="flex gap-2">
            {dueCount > 0 && (
              <Button size="sm" disabled={triggeringId !== null} onClick={handleTriggerAll}>
                <Play className="h-3.5 w-3.5 mr-1" />
                Trigger all due ({dueCount})
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => setShowRecurringForm(!showRecurringForm)}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add recurring
            </Button>
          </div>
        </div>
        {showRecurringForm && renderRecurringForm()}
        {recurring.length === 0 && !showRecurringForm ? (
          <p className={cn("text-center py-8", mutedText)}>No recurring transactions yet. Add the bills you pay every period so you can capture them with one click.</p>
        ) : (
          <div className="space-y-2">{recurring.map(renderRecurringItem)}</div>
        )}
      </div>
    )
  }

  return (
    <>
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4" onClick={onClose}>
      <div
        className={cn("w-full max-w-2xl max-h-[85vh] sm:max-h-[80vh] overflow-auto rounded-lg p-4 sm:p-6", isLight ? "bg-[#E8DCC5]" : "bg-[#201E1B]")}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h2 className={cn("text-lg sm:text-xl font-bold truncate", strongText)}>{budget.name}</h2>
            <p className={cn("text-xs sm:text-sm truncate", mutedText)}>
              {budget.category?.name} · {budget.period} · {formatPeriod()}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="ml-2 flex-shrink-0">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex gap-2 mb-4">
          {renderTabButton("transactions", "Transactions", transactions.length)}
          {renderTabButton("recurring", "Recurring", recurring.length)}
        </div>

        {message && (
          <div className={cn("p-3 mb-3 rounded-lg text-sm", message.type === "success" ? "bg-[#6BAF92]/20 text-[#6BAF92]" : "bg-red-500/20 text-red-400")}>
            {message.text}
          </div>
        )}

        {loading ? (
          <p className={cn("text-center py-8", mutedText)}>Loading...</p>
        ) : activeTab === "transactions" ? renderTransactions() : renderRecurring()}
      </div>
    </div>

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

function ordinal(day: number): string {
  if (day >= 11 && day <= 13) return "th"
  switch (day % 10) {
    case 1: return "st"
    case 2: return "nd"
    case 3: return "rd"
    default: return "th"
  }
}
