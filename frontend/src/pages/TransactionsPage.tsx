import { useEffect, useState } from "react"
import { Plus, Trash2, Tag as TagIcon, Settings } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import TagInput from "@/components/ui/tag-input"
import QuickAddTransaction from "@/components/QuickAddTransaction"
import {
  transactionsApi,
  categoriesApi,
  tagsApi,
  type Transaction,
  type Category,
  type PopularTag,
} from "@/lib/api"
import { formatCurrency, formatDate } from "@/lib/utils"

const ACCOUNT_ID = 1

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [popularTags, setPopularTags] = useState<PopularTag[]>([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showAdvancedForm, setShowAdvancedForm] = useState(false)
  const [filterType, setFilterType] = useState<string>("")

  const [form, setForm] = useState({
    amount: "",
    type: "expense" as "income" | "expense",
    description: "",
    date: new Date().toISOString().split("T")[0],
    category_id: "",
    notes: "",
    tags: [] as string[],
    account_type: "checking" as "checking" | "savings",
  })

  useEffect(() => {
    loadData()
  }, [filterType])

  async function loadData() {
    setLoading(true)
    try {
      const params: Record<string, string> = {}
      if (filterType) params.type = filterType

      const [txRes, catRes, tagsRes] = await Promise.all([
        transactionsApi.list(ACCOUNT_ID, params),
        categoriesApi.list(ACCOUNT_ID),
        tagsApi.popular(ACCOUNT_ID),
      ])
      setTransactions(txRes.data || [])
      setCount(txRes.count)
      setCategories(catRes.data || [])
      setPopularTags(tagsRes.data || [])
    } catch (error) {
      console.error("Failed to load data", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      await transactionsApi.create({
        account_id: ACCOUNT_ID,
        amount: form.amount,
        type: form.type,
        description: form.description || undefined,
        date: form.date,
        category_id: form.category_id ? Number(form.category_id) : undefined,
        notes: form.notes || undefined,
        tags: form.tags.length > 0 ? JSON.stringify(form.tags) : undefined,
        account_type: form.account_type,
      })
      setForm({
        amount: "",
        type: "expense",
        description: "",
        date: new Date().toISOString().split("T")[0],
        category_id: "",
        notes: "",
        tags: [],
        account_type: "checking",
      })
      setShowAdvancedForm(false)
      loadData()
    } catch {
      console.error("Failed to create transaction")
    }
  }

  function handleQuickAddTransaction(transaction: Transaction) {
    loadData()
  }

  async function handleDelete(id: number) {
    if (!confirm("Are you sure you want to delete this transaction?")) return
    try {
      await transactionsApi.delete(id)
      loadData()
    } catch {
      console.error("Failed to delete transaction")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground">{count} transaction{count !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowAdvancedForm(!showAdvancedForm)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Advanced
          </Button>
        </div>
      </div>

      {/* Quick Add Transaction - Always Visible */}
      <QuickAddTransaction onTransactionAdded={handleQuickAddTransaction} />

      {/* Filters */}
      <div className="flex gap-2">
        <Button
          variant={filterType === "" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterType("")}
        >
          All
        </Button>
        <Button
          variant={filterType === "income" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterType("income")}
        >
          Income
        </Button>
        <Button
          variant={filterType === "expense" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterType("expense")}
        >
          Expenses
        </Button>
      </div>

      {/* Advanced transaction form */}
      {showAdvancedForm && (
        <Card>
          <CardHeader>
            <CardTitle>Advanced Transaction Entry</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Amount</label>
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
                <label className="text-sm font-medium">Type</label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as "income" | "expense" })}
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Date</label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Account Type</label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  value={form.account_type}
                  onChange={(e) => setForm({ ...form, account_type: e.target.value as "checking" | "savings" })}
                >
                  <option value="checking">Checking Account</option>
                  <option value="savings">Savings Account</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Input
                  placeholder="e.g. Grocery shopping"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  value={form.category_id}
                  onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                >
                  <option value="">No category</option>
                  {categories
                    .filter((c) => c.type === form.type)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Notes</label>
                <Input
                  placeholder="Optional notes"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
              <div className="space-y-2 sm:col-span-2 lg:col-span-3">
                <label className="text-sm font-medium">Tags</label>
                <TagInput
                  value={form.tags}
                  onChange={(tags) => setForm({ ...form, tags })}
                  placeholder="Add tags (press Enter or comma to add)"
                  suggestions={popularTags.map(tag => tag.tag)}
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-3 flex gap-2">
                <Button type="submit">Save transaction</Button>
                <Button type="button" variant="outline" onClick={() => setShowAdvancedForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Transactions list */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <p className="text-muted-foreground text-center py-8">Loading...</p>
          ) : transactions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No transactions found</p>
          ) : (
            <div className="divide-y">
              {transactions.map((t) => (
                <div key={t.id} className="flex items-center justify-between px-6 py-4 hover:bg-accent/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">
                        {t.description || "Untitled transaction"}
                      </p>
                      <Badge variant={t.type === "income" ? "income" : "expense"}>
                        {t.type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-muted-foreground">{formatDate(t.date)}</p>
                      {t.category && (
                        <span className="text-xs text-muted-foreground">
                          · {t.category.name}
                        </span>
                      )}
                      {t.tags && (
                        <div className="flex items-center gap-1">
                          <TagIcon className="h-3 w-3 text-muted-foreground" />
                          <div className="flex gap-1">
                            {JSON.parse(t.tags).slice(0, 2).map((tag: string, index: number) => (
                              <Badge key={index} variant="outline" className="text-xs px-1 py-0">
                                {tag}
                              </Badge>
                            ))}
                            {JSON.parse(t.tags).length > 2 && (
                              <Badge variant="outline" className="text-xs px-1 py-0">
                                +{JSON.parse(t.tags).length - 2}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <span className={`text-sm font-semibold ${t.type === "income" ? "text-emerald-600" : "text-red-600"}`}>
                      {t.type === "income" ? "+" : "-"}{formatCurrency(t.amount)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(t.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
