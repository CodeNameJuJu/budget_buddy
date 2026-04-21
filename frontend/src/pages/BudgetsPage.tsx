import { useEffect, useState } from "react"
import { Plus, Trash2, PiggyBank, Target, Sparkles } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { budgetsApi, categoriesApi, accountsApi, type Budget, type Category, type Account } from "@/lib/api"
import { formatCurrency } from "@/lib/utils"

export default function BudgetsPage() {
  const [accountId, setAccountId] = useState<number | null>(null)
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const [form, setForm] = useState({
    name: "",
    amount: "",
    category_id: "",
    period: "monthly",
    start_date: new Date().toISOString().split("T")[0],
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

  async function handleDelete(id: number) {
    if (!confirm("Are you sure you want to delete this budget?")) return
    try {
      await budgetsApi.delete(id)
      loadData()
    } catch {
      console.error("Failed to delete budget")
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Budgets</h1>
          <p className="text-slate-400">Track your spending limits</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="hover:shadow-lg transition-all duration-300">
          <Plus className="h-4 w-4 mr-2" />
          Add budget
        </Button>
      </div>

      {/* Add budget form */}
      {showForm && (
        <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-all duration-200">
          <CardHeader>
            <CardTitle>New budget</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Name</label>
                <Input
                  placeholder="e.g. Monthly groceries"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Amount</label>
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
                <label className="text-sm font-medium text-slate-300">Category</label>
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
                <label className="text-sm font-medium text-slate-300">Period</label>
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
                <label className="text-sm font-medium text-slate-300">Start date</label>
                <Input
                  type="date"
                  value={form.start_date}
                  onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">End date (optional)</label>
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
        <p className="text-slate-400 text-center py-8">Loading...</p>
      ) : budgets.length === 0 ? (
        <div className="text-center py-16">
          <PiggyBank className="h-12 w-12 mx-auto text-slate-500 mb-4" />
          <h2 className="text-lg font-semibold mb-1 text-slate-100">No budgets yet</h2>
          <p className="text-slate-400 text-sm">Create a budget to start tracking your spending.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {budgets.map((budget) => {
            const percentage = getProgressPercentage(budget)
            const spent = budget.spent ? parseFloat(budget.spent) : 0
            const remaining = budget.remaining ? parseFloat(budget.remaining) : parseFloat(budget.amount)

            return (
              <Card key={budget.id} className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-all duration-200 group">
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${remaining >= 0 ? "bg-teal-500" : percentage >= 90 ? "bg-red-500" : "bg-blue-600"} text-white transition-colors duration-200`}>
                      {getProgressIcon(percentage)}
                    </div>
                    <div>
                      <CardTitle className="text-base group-hover:text-blue-400 transition-colors">{budget.name}</CardTitle>
                      <p className="text-xs text-slate-400 mt-1">
                        {budget.category?.name} · {budget.period}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-slate-400 hover:text-red-400 -mt-1"
                    onClick={() => handleDelete(budget.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">
                      {formatCurrency(spent)} spent
                    </span>
                    <span className="font-medium">
                      {formatCurrency(budget.amount)}
                    </span>
                  </div>
                  <div className="h-4 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ease-out ${getProgressColour(percentage)} progress-bar-fill`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <p className={`text-sm font-medium ${remaining >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {remaining >= 0
                        ? `${formatCurrency(remaining)} remaining`
                        : `${formatCurrency(Math.abs(remaining))} over budget`}
                    </p>
                    <div className="text-xs text-slate-400">
                      {percentage.toFixed(1)}% used
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
