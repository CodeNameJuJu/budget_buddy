import { useEffect, useState } from "react"
import { Plus, Trash2, PiggyBank, Target, Sparkles, Edit2, Repeat } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { budgetsApi, categoriesApi, accountsApi, type Budget, type Category } from "@/lib/api"
import BudgetDetailModal from "@/components/budgets/BudgetDetailModal"
import { formatCurrency } from "@/lib/utils"
import { useTheme } from "@/contexts/ThemeContext"
import { cn } from "@/lib/utils"

export default function BudgetsPage() {
  const [accountId, setAccountId] = useState<number | null>(null)
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null)
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null)
  const [triggeringBudgetId, setTriggeringBudgetId] = useState<number | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [budgetToDelete, setBudgetToDelete] = useState<number | null>(null)
  const { theme } = useTheme()

  const [form, setForm] = useState({
    name: "",
    amount: "",
    category_id: "",
    period: "monthly",
    start_date: new Date().toISOString().split("T")[0],
    end_date: "",
  })

  const [editForm, setEditForm] = useState({
    name: "",
    amount: "",
    category_id: "",
    period: "monthly",
    start_date: "",
    end_date: "",
  })

  useEffect(() => {
    loadUserAccount()
  }, [])

  useEffect(() => {
    if (accountId) {
      loadData()
    }
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
      const [budRes, catRes] = await Promise.all([
        budgetsApi.list(accountId),
        categoriesApi.list(accountId, "expense"),
      ])
      setBudgets(budRes.data || [])
      setCategories(catRes.data || [])
    } catch {
      console.error("Failed to load budgets")
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!accountId) return
    
    try {
      await budgetsApi.create({
        account_id: accountId,
        category_id: Number(form.category_id),
        name: form.name,
        amount: form.amount,
        period: form.period,
        start_date: form.start_date,
        end_date: form.end_date || undefined,
      })
      setForm({
        name: "",
        amount: "",
        category_id: "",
        period: "monthly",
        start_date: new Date().toISOString().split("T")[0],
        end_date: "",
      })
      setShowForm(false)
      loadData()
    } catch {
      console.error("Failed to create budget")
    }
  }

  function handleDeleteClick(id: number) {
    setBudgetToDelete(id)
    setDeleteDialogOpen(true)
  }

  async function handleDeleteConfirm() {
    if (!budgetToDelete) return
    try {
      await budgetsApi.delete(budgetToDelete)
      loadData()
    } catch {
      console.error("Failed to delete budget")
    }
  }

  function handleBudgetClick(budget: Budget) {
    setSelectedBudget(budget)
  }

  async function handleTriggerBudgetRecurring(budget: Budget) {
    setTriggeringBudgetId(budget.id)
    try {
      await budgetsApi.triggerRecurring(budget.id)
      loadData()
    } catch {
      console.error("Failed to trigger recurring transactions")
    } finally {
      setTriggeringBudgetId(null)
    }
  }

  function handleEdit(budget: Budget) {
    setEditingBudget(budget)
    setEditForm({
      name: budget.name,
      amount: budget.amount,
      category_id: String(budget.category_id),
      period: budget.period,
      start_date: budget.start_date.split("T")[0],
      end_date: budget.end_date ? budget.end_date.split("T")[0] : "",
    })
    setShowEditForm(true)
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!editingBudget || !accountId) return
    
    try {
      await budgetsApi.update(editingBudget.id, {
        name: editForm.name,
        amount: editForm.amount,
        category_id: Number(editForm.category_id),
        period: editForm.period as "monthly" | "weekly" | "yearly",
        start_date: editForm.start_date,
        end_date: editForm.end_date || undefined,
      })
      setShowEditForm(false)
      setEditingBudget(null)
      loadData()
    } catch {
      console.error("Failed to update budget")
    }
  }

  function getProgressPercentage(budget: Budget): number {
    if (!budget.spent) return 0
    const spent = parseFloat(budget.spent)
    const amount = parseFloat(budget.amount)
    return amount > 0 ? Math.min((spent / amount) * 100, 100) : 0
  }

  function getProgressIcon(percentage: number) {
    if (percentage >= 90) return <Sparkles className="h-4 w-4" />
    return <Target className="h-4 w-4" />
  }

  function getProgressColour(percentage: number): string {
    if (percentage >= 90) return "gradient-danger"
    if (percentage >= 70) return "gradient-warning"
    return "gradient-success"
  }

  return (
    <>
    <div className="space-y-6">
      <div className="flex items-center justify-between" data-tutorial="budgets-page">
        <div>
          <h1 className={cn(
            "text-2xl font-bold tracking-tight",
            theme === "light" ? "text-[#1F2A24]" : "text-[#EDEBE6]"
          )}>Budgets</h1>
          <p className={theme === "light" ? "text-[#6C7A73]" : "text-[#ABA9A2]"}>Track your spending limits</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="hover:shadow-lg transition-all duration-300">
          <Plus className="h-4 w-4 mr-2" />
          Add budget
        </Button>
      </div>

      {/* Edit budget form */}
      {showEditForm && editingBudget && (
        <Card className={cn(
          "border hover:transition-all duration-200",
          theme === "light"
            ? "bg-[#E8DCC5]/50 border-[#E6E0D6] hover:bg-[#E8DCC5]/70"
            : "bg-[#201E1B]/50 border-[#38352F] hover:bg-[#201E1B]/70"
        )}>
          <CardHeader>
            <CardTitle className={theme === "light" ? "text-[#1F2A24]" : "text-[#EDEBE6]"}>Edit budget</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleEditSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <label className={cn("text-sm font-medium", theme === "light" ? "text-[#6C7A73]" : "text-[#ABA9A2]")}>Name</label>
                <Input
                  placeholder="e.g. Monthly groceries"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className={cn("text-sm font-medium", theme === "light" ? "text-[#6C7A73]" : "text-[#ABA9A2]")}>Amount</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={editForm.amount}
                  onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className={cn("text-sm font-medium", theme === "light" ? "text-[#6C7A73]" : "text-[#ABA9A2]")}>Category</label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  value={editForm.category_id}
                  onChange={(e) => setEditForm({ ...editForm, category_id: e.target.value })}
                  required
                >
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className={cn("text-sm font-medium", theme === "light" ? "text-[#6C7A73]" : "text-[#ABA9A2]")}>Period</label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  value={editForm.period}
                  onChange={(e) => setEditForm({ ...editForm, period: e.target.value })}
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className={cn("text-sm font-medium", theme === "light" ? "text-[#6C7A73]" : "text-[#ABA9A2]")}>Start date</label>
                <Input
                  type="date"
                  value={editForm.start_date}
                  onChange={(e) => setEditForm({ ...editForm, start_date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className={cn("text-sm font-medium", theme === "light" ? "text-[#6C7A73]" : "text-[#ABA9A2]")}>End date (optional)</label>
                <Input
                  type="date"
                  value={editForm.end_date}
                  onChange={(e) => setEditForm({ ...editForm, end_date: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-3 flex gap-2">
                <Button type="submit">Update budget</Button>
                <Button type="button" variant="outline" onClick={() => {
                  setShowEditForm(false)
                  setEditingBudget(null)
                }}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Add budget form */}
      {showForm && (
        <Card className={cn(
          "border hover:transition-all duration-200",
          theme === "light"
            ? "bg-[#E8DCC5]/50 border-[#E6E0D6] hover:bg-[#E8DCC5]/70"
            : "bg-[#201E1B]/50 border-[#38352F] hover:bg-[#201E1B]/70"
        )}>
          <CardHeader>
            <CardTitle className={theme === "light" ? "text-[#1F2A24]" : "text-[#EDEBE6]"}>New budget</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <label className={cn("text-sm font-medium", theme === "light" ? "text-[#6C7A73]" : "text-[#ABA9A2]")}>Name</label>
                <Input
                  placeholder="e.g. Monthly groceries"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className={cn("text-sm font-medium", theme === "light" ? "text-[#6C7A73]" : "text-[#ABA9A2]")}>Amount</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className={cn("text-sm font-medium", theme === "light" ? "text-[#6C7A73]" : "text-[#ABA9A2]")}>Category</label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  value={form.category_id}
                  onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                  required
                >
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className={cn("text-sm font-medium", theme === "light" ? "text-[#6C7A73]" : "text-[#ABA9A2]")}>Period</label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  value={form.period}
                  onChange={(e) => setForm({ ...form, period: e.target.value })}
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className={cn("text-sm font-medium", theme === "light" ? "text-[#6C7A73]" : "text-[#ABA9A2]")}>Start date</label>
                <Input
                  type="date"
                  value={form.start_date}
                  onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className={cn("text-sm font-medium", theme === "light" ? "text-[#6C7A73]" : "text-[#ABA9A2]")}>End date (optional)</label>
                <Input
                  type="date"
                  value={form.end_date}
                  onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-3 flex gap-2">
                <Button type="submit">Save budget</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Budgets grid */}
      {loading ? (
        <p className={cn("text-center py-8", theme === "light" ? "text-[#6C7A73]" : "text-[#ABA9A2]")}>Loading...</p>
      ) : budgets.length === 0 ? (
        <div className="text-center py-16">
          <PiggyBank className={cn(
            "h-12 w-12 mx-auto mb-4",
            theme === "light" ? "text-[#6C7A73]" : "text-[#ABA9A2]"
          )} />
          <h2 className={cn(
            "text-lg font-semibold mb-1",
            theme === "light" ? "text-[#1F2A24]" : "text-[#EDEBE6]"
          )}>No budgets yet</h2>
          <p className={cn("text-sm", theme === "light" ? "text-[#6C7A73]" : "text-[#ABA9A2]")}>Create a budget to start tracking your spending.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {budgets.map((budget) => {
            const percentage = getProgressPercentage(budget)
            const spent = budget.spent ? parseFloat(budget.spent) : 0
            const remaining = budget.remaining ? parseFloat(budget.remaining) : parseFloat(budget.amount)

            return (
              <Card 
                key={budget.id} 
                className={cn(
                  "border hover:transition-all duration-200 group cursor-pointer",
                  theme === "light"
                    ? "bg-[#E8DCC5]/50 border-[#E6E0D6] hover:bg-[#E8DCC5]/70"
                    : "bg-[#201E1B]/50 border-[#38352F] hover:bg-[#201E1B]/70"
                )}
              >
                <CardHeader 
                  className="flex flex-row items-start justify-between pb-2 cursor-pointer"
                  onClick={() => handleBudgetClick(budget)}
                >
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "p-2 rounded-lg text-white transition-colors duration-200",
                      remaining >= 0
                        ? (theme === "light" ? "bg-[#6BAF92]" : "bg-[#6BAF92]")
                        : percentage >= 90 ? "bg-red-500" : theme === "light" ? "bg-[#C97C5D]" : "bg-[#B46B52]"
                    )}>
                      {getProgressIcon(percentage)}
                    </div>
                    <div>
                      <CardTitle className={cn("text-base transition-colors", theme === "light" ? "group-hover:text-[#6BAF92]" : "group-hover:text-[#88B39B]")}>{budget.name}</CardTitle>
                      <p className={cn("text-xs mt-1", theme === "light" ? "text-[#6C7A73]" : "text-[#ABA9A2]")}>
                        {budget.category?.name} · {budget.period}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1 items-center" onClick={(e) => e.stopPropagation()}>
                    {budget.recurring_due > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn("h-7 px-2 text-xs -mt-1", theme === "light" ? "border-[#D9B44A] text-[#8A6D1F] hover:bg-[#D9B44A]/20" : "border-[#C9A24A] text-[#C9A24A] hover:bg-[#C9A24A]/20")}
                        disabled={triggeringBudgetId !== null}
                        onClick={() => handleTriggerBudgetRecurring(budget)}
                        title="Capture all recurring transactions that are still due this period"
                      >
                        <Repeat className="h-3 w-3 mr-1" />
                        {budget.recurring_due} due
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(theme === "light" ? "text-[#6C7A73] hover:text-[#6BAF92]" : "text-[#ABA9A2] hover:text-[#88B39B]", "-mt-1")}
                      onClick={() => handleEdit(budget)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(theme === "light" ? "text-[#6C7A73] hover:text-red-400" : "text-[#ABA9A2] hover:text-red-400", "-mt-1")}
                      onClick={() => handleDeleteClick(budget.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 cursor-pointer" onClick={() => handleBudgetClick(budget)}>
                  <div className="flex justify-between text-sm">
                    <span className={cn(theme === "light" ? "text-[#6C7A73]" : "text-[#ABA9A2]")}>
                      {formatCurrency(spent)} spent
                    </span>
                    <span className="font-medium">
                      {formatCurrency(budget.amount)}
                    </span>
                  </div>
                  <div className={cn("h-4 rounded-full overflow-hidden", theme === "light" ? "bg-[#E6E0D6]" : "bg-[#38352F]")}>
                    <div
                      className={`h-full rounded-full transition-all duration-700 ease-out ${getProgressColour(percentage)} progress-bar-fill`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <p className={cn(
                      "text-sm font-medium",
                      remaining >= 0
                        ? (theme === "light" ? "text-[#6BAF92]" : "text-[#A8D5BA]")
                        : "text-red-400"
                    )}>
                      {remaining >= 0
                        ? `${formatCurrency(remaining)} remaining`
                        : `${formatCurrency(Math.abs(remaining))} over budget`}
                    </p>
                    <div className={cn("text-xs", theme === "light" ? "text-[#6C7A73]" : "text-[#ABA9A2]")}>
                      {percentage.toFixed(1)}% used
                    </div>
                  </div>
                  {budget.recurring_count > 0 && (
                    <p className={cn("text-xs flex items-center gap-1", theme === "light" ? "text-[#6C7A73]" : "text-[#ABA9A2]")}>
                      <Repeat className="h-3 w-3" />
                      {budget.recurring_due === 0
                        ? `All ${budget.recurring_count} recurring captured`
                        : `${budget.recurring_count - budget.recurring_due} of ${budget.recurring_count} recurring captured`}
                    </p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Budget detail modal (transactions and recurring items) */}
      {selectedBudget && (
        <BudgetDetailModal
          budget={budgets.find((b) => b.id === selectedBudget.id) || selectedBudget}
          onClose={() => setSelectedBudget(null)}
          onChanged={loadData}
        />
      )}

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete budget"
        description="Are you sure you want to delete this budget? This action cannot be undone."
        onConfirm={handleDeleteConfirm}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
    </>
  )
}
