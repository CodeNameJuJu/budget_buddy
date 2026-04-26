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
  accountsApi,
  type Transaction,
  type Category,
  type PopularTag,
} from "@/lib/api"
import { formatCurrency, formatDate } from "@/lib/utils"

export default function TransactionsPage() {
  const [accountId, setAccountId] = useState<number | null>(null)
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
    loadUserAccount()
  }, [])

  useEffect(() => {
    if (accountId) {
      loadData()
    }
  }, [accountId, filterType])

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
      const params: Record<string, string> = {}
      if (filterType) params.type = filterType

      const [txRes, catRes, tagsRes] = await Promise.all([
        transactionsApi.list(accountId, params),
        categoriesApi.list(accountId),
        tagsApi.popular(accountId),
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
    if (!accountId) return
    
    try {
      await transactionsApi.create({
        account_id: accountId,
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
    <div className="space-y-3 xs:space-y-4 lg:space-y-6">
      <div className="responsive-flex responsive-margin">
        <div>
          <h1 className="mobile-title tracking-tight text-slate-100">Transactions</h1>
          <p className="mobile-text text-slate-400">{count} transaction{count !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex gap-2 ml-auto">
          <Button 
            variant="outline" 
            onClick={() => setShowAdvancedForm(!showAdvancedForm)}
            className="mobile-button"
          >
            <Settings className="h-4 w-4 xs:h-4.5 xs:w-4.5" />
            <span className="hidden sm:inline ml-2">Advanced</span>
          </Button>
        </div>
      </div>

      {/* Quick Add Transaction - Always Visible */}
      <div className="responsive-margin flex justify-end" data-tutorial="quick-add-button">
        <QuickAddTransaction onTransactionAdded={handleQuickAddTransaction} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 responsive-margin">
        <Button
          variant={filterType === "" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterType("")}
          className="mobile-button"
        >
          All
        </Button>
        <Button
          variant={filterType === "income" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterType("income")}
          className="mobile-button"
        >
          Income
        </Button>
        <Button
          variant={filterType === "expense" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterType("expense")}
          className="mobile-button"
        >
          Expenses
        </Button>
      </div>

      {/* Advanced transaction form */}
      {showAdvancedForm && (
        <Card className="mobile-card">
          <CardHeader className="responsive-padding">
            <CardTitle className="mobile-title">Advanced Transaction Entry</CardTitle>
          </CardHeader>
          <CardContent className="responsive-padding">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="mobile-text font-medium text-slate-300">Amount</label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="responsive-input"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="mobile-text font-medium text-slate-300">Type</label>
                  <select
                    className="flex responsive-input rounded-md border border-slate-600 bg-slate-700 px-3 py-1 mobile-text text-slate-300 shadow-sm"
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as "income" | "expense" })}
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="mobile-text font-medium text-slate-300">Date</label>
                  <Input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="responsive-input"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="mobile-text font-medium text-slate-300">Account Type</label>
                  <select
                    className="flex responsive-input rounded-md border border-slate-600 bg-slate-700 px-3 py-1 mobile-text text-slate-300 shadow-sm"
                    value={form.account_type}
                    onChange={(e) => setForm({ ...form, account_type: e.target.value as "checking" | "savings" })}
                  >
                    <option value="checking">Checking Account</option>
                    <option value="savings">Savings Account</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="mobile-text font-medium text-slate-300">Description</label>
                  <Input
                    placeholder="e.g. Grocery shopping"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="responsive-input"
                  />
                </div>
                <div className="space-y-2">
                  <label className="mobile-text font-medium text-slate-300">Category</label>
                  <select
                    className="flex responsive-input rounded-md border border-slate-600 bg-slate-700 px-3 py-1 mobile-text text-slate-300 shadow-sm"
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
                  <label className="mobile-text font-medium text-slate-300">Notes</label>
                  <Input
                    placeholder="Optional notes"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="responsive-input"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="mobile-text font-medium text-slate-300">Tags</label>
                <TagInput
                  value={form.tags}
                  onChange={(tags) => setForm({ ...form, tags })}
                  placeholder="Add tags (press Enter or comma to add)"
                  suggestions={popularTags.map(tag => tag.tag)}
                />
              </div>
              <div className="flex flex-col xs:flex-row gap-2 justify-end">
                <Button type="submit" className="mobile-button">Save transaction</Button>
                <Button type="button" variant="outline" onClick={() => setShowAdvancedForm(false)} className="mobile-button">
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Transactions list */}
      <Card className="mobile-card">
        <CardContent className="p-0">
          {loading ? (
            <p className="mobile-text text-slate-400 text-center py-6 xs:py-8">Loading...</p>
          ) : transactions.length === 0 ? (
            <p className="mobile-text text-slate-400 text-center py-6 xs:py-8">No transactions found</p>
          ) : (
            <div className="divide-y">
              {transactions.map((t) => (
                <div key={t.id} className="px-3 xs:px-4 lg:px-6 py-3 xs:py-4 hover:bg-blue-900/20 transition-colors">
                  <div className="flex flex-col gap-2 xs:gap-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col xs:flex-row xs:items-center gap-2 mb-1">
                          <p className="mobile-text font-medium truncate">
                            {t.description || "Untitled transaction"}
                          </p>
                          <Badge variant={t.type === "income" ? "secondary" : "destructive"} className={t.type === "income" ? "bg-emerald-800/30 text-emerald-300 border border-emerald-700/50 text-xs" : "bg-red-800/30 text-red-300 border border-red-700/50 text-xs"}>
                            {t.type}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
                          <span>{formatDate(t.date)}</span>
                          {t.category && (
                            <>
                              <span>·</span>
                              <span>{t.category.name}</span>
                            </>
                          )}
                          {t.tags && (
                            <>
                              <span>·</span>
                              <div className="flex items-center gap-1">
                                <TagIcon className="h-3 w-3" />
                                <div className="flex gap-1 flex-wrap">
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
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`mobile-text font-semibold ${t.type === "income" ? "text-emerald-400" : "text-red-400"}`}>
                          {t.type === "income" ? "+" : "-"}{formatCurrency(t.amount)}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-slate-400 hover:text-red-400 mobile-button-sm"
                          onClick={() => handleDelete(t.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5 xs:h-4 xs:w-4" />
                        </Button>
                      </div>
                    </div>
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
