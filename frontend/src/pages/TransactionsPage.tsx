import { useEffect, useState } from "react"
import { Plus, Trash2, Tag as TagIcon, Download } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import TagInput from "@/components/ui/tag-input"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
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
import { useTheme } from "@/contexts/ThemeContext"
import { cn } from "@/lib/utils"

export default function TransactionsPage() {
  const [accountId, setAccountId] = useState<number | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [popularTags, setPopularTags] = useState<PopularTag[]>([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showAdvancedForm, setShowAdvancedForm] = useState(false)
  const [filterType, setFilterType] = useState<string>("")
  const [filterCategory, setFilterCategory] = useState<string>("")
  const [exporting, setExporting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [transactionToDelete, setTransactionToDelete] = useState<number | null>(null)
  const { theme } = useTheme()

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
  }, [accountId, filterType, filterCategory])

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
      if (filterCategory) params.category_id = filterCategory

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

  function handleDeleteClick(id: number) {
    setTransactionToDelete(id)
    setDeleteDialogOpen(true)
  }

  async function handleDeleteConfirm() {
    if (!transactionToDelete) return
    try {
      await transactionsApi.delete(transactionToDelete)
      loadData()
    } catch {
      console.error("Failed to delete transaction")
    }
  }

  async function handleExportData() {
    if (!accountId) return
    setExporting(true)
    try {
      const response = await transactionsApi.list(accountId)
      const transactions = response.data || []
      
      // Convert to CSV
      const headers = ["Date", "Description", "Amount", "Type", "Category", "Notes"]
      const rows = transactions.map(t => [
        t.date,
        t.description || "",
        t.amount,
        t.type,
        t.category?.name || "",
        t.notes || "",
      ])
      
      const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n")
      const blob = new Blob([csvContent], { type: "text/csv" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `transactions_export_${new Date().toISOString().split("T")[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
      
      setMessage({ type: 'success', text: 'Data exported successfully' })
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      console.error("Failed to export data", error)
      setMessage({ type: 'error', text: 'Failed to export data' })
      setTimeout(() => setMessage(null), 3000)
    } finally {
      setExporting(false)
    }
  }

  return (
    <>
    <div className="space-y-3 xs:space-y-4 lg:space-y-6">
      <div className="responsive-flex responsive-margin">
        <div>
          <h1 className={cn("mobile-title tracking-tight", theme === "light" ? "text-[#1F2A24]" : "text-[#E7EFEA]")}>Transactions</h1>
          <p className={cn("mobile-text", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>{count} transaction{count !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex gap-2 ml-auto">
          <Button 
            onClick={() => setShowAdvancedForm(!showAdvancedForm)}
            className="hover:shadow-lg transition-all duration-300 mobile-button"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add transaction
          </Button>
        </div>
      </div>

      {/* Export button and message */}
      <div className="responsive-margin flex justify-between items-center gap-2">
        <Button 
          onClick={handleExportData}
          disabled={exporting}
          variant="outline"
          className="mobile-button ml-auto"
        >
          <Download className="h-4 w-4 xs:h-4.5 xs:w-4.5" />
          <span className="hidden sm:inline ml-2">{exporting ? "Exporting..." : "Export"}</span>
        </Button>
        {message && (
          <div className={cn(
            "p-3 rounded-lg text-sm flex-shrink-0",
            message.type === 'success'
              ? theme === "light" ? "bg-[#6BAF92]/20 text-[#6BAF92]" : "bg-[#6BAF92]/20 text-[#88B39B]"
              : "bg-red-500/20 text-red-400"
          )}>
            {message.text}
          </div>
        )}
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
        <select
          className={cn("flex mobile-button rounded-md border px-3 py-1 mobile-text shadow-sm", theme === "light" ? "border-[#E6E0D6] bg-white text-[#1F2A24]" : "border-[#2E3B35] bg-[#18231D] text-[#E7EFEA]")}
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
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
                  <label className={cn("mobile-text font-medium", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>Amount</label>
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
                  <label className={cn("mobile-text font-medium", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>Type</label>
                  <select
                    className={cn("flex responsive-input rounded-md border px-3 py-1 mobile-text shadow-sm", theme === "light" ? "border-[#E6E0D6] bg-white text-[#1F2A24]" : "border-[#2E3B35] bg-[#18231D] text-[#E7EFEA]")}
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as "income" | "expense" })}
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className={cn("mobile-text font-medium", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>Date</label>
                  <Input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="responsive-input"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className={cn("mobile-text font-medium", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>Account Type</label>
                  <select
                    className={cn("flex responsive-input rounded-md border px-3 py-1 mobile-text shadow-sm", theme === "light" ? "border-[#E6E0D6] bg-white text-[#1F2A24]" : "border-[#2E3B35] bg-[#18231D] text-[#E7EFEA]")}
                    value={form.account_type}
                    onChange={(e) => setForm({ ...form, account_type: e.target.value as "checking" | "savings" })}
                  >
                    <option value="checking">Checking Account</option>
                    <option value="savings">Savings Account</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className={cn("mobile-text font-medium", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>Description</label>
                  <Input
                    placeholder="e.g. Grocery shopping"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="responsive-input"
                  />
                </div>
                <div className="space-y-2">
                  <label className={cn("mobile-text font-medium", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>Category</label>
                  <select
                    className={cn("flex responsive-input rounded-md border px-3 py-1 mobile-text shadow-sm", theme === "light" ? "border-[#E6E0D6] bg-white text-[#1F2A24]" : "border-[#2E3B35] bg-[#18231D] text-[#E7EFEA]")}
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
                  <label className={cn("mobile-text font-medium", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>Notes</label>
                  <Input
                    placeholder="Optional notes"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="responsive-input"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className={cn("mobile-text font-medium", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>Tags</label>
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
            <p className={cn("mobile-text text-center py-6 xs:py-8", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>Loading...</p>
          ) : transactions.length === 0 ? (
            <p className={cn("mobile-text text-center py-6 xs:py-8", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>No transactions found</p>
          ) : (
            <div className="divide-y">
              {transactions.map((t) => (
                <div key={t.id} className={cn("px-3 xs:px-4 lg:px-6 py-3 xs:py-4 transition-colors", theme === "light" ? "hover:bg-[#E6E0D6]/20" : "hover:bg-[#2E3B35]/20")}>
                  <div className="flex flex-col gap-2 xs:gap-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col xs:flex-row xs:items-center gap-2 mb-1">
                          <p className="mobile-text font-medium truncate">
                            {t.description || "Untitled transaction"}
                          </p>
                          <Badge variant={t.type === "income" ? "default" : "destructive"} className="text-xs">
                            {t.type}
                          </Badge>
                        </div>
                        <div className={cn("flex flex-wrap items-center gap-1.5 text-xs", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>
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
                        <span className={cn("mobile-text font-semibold", t.type === "income" ? (theme === "light" ? "text-[#6BAF92]" : "text-[#A8D5BA]") : "text-red-400")}>
                          {t.type === "income" ? "+" : "-"}{formatCurrency(t.amount)}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn("mobile-button-sm", theme === "light" ? "text-[#6C7A73] hover:text-red-400" : "text-[#A7B3AD] hover:text-red-400")}
                          onClick={() => handleDeleteClick(t.id)}
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

    <ConfirmDialog
      open={deleteDialogOpen}
      onOpenChange={setDeleteDialogOpen}
      title="Delete transaction"
      description="Are you sure you want to delete this transaction? This action cannot be undone."
      onConfirm={handleDeleteConfirm}
      confirmText="Delete"
      cancelText="Cancel"
      variant="destructive"
    />
    </>
  )
}
