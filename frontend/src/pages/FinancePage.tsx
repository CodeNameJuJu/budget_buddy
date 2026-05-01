import { useState, useEffect } from "react"
import { Plus, Trash2, Tags, Edit2, PiggyBank, Target, Sparkles, Download, Tag as TagIcon, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import TagInput from "@/components/ui/tag-input"
import {
  transactionsApi,
  categoriesApi,
  budgetsApi,
  tagsApi,
  accountsApi,
  type Transaction,
  type Category,
  type Budget,
  type PopularTag,
  type Account,
} from "@/lib/api"
import { formatCurrency, formatDate } from "@/lib/utils"
import { useTheme } from "@/contexts/ThemeContext"
import { cn } from "@/lib/utils"

const COLOUR_OPTIONS = [
  { label: "Primary Green", value: "#6BAF92" },
  { label: "Light Green", value: "#88B39B" },
  { label: "Accent Gold", value: "#D9B44A" },
  { label: "Warning", value: "#C97C5D" },
  { label: "Muted", value: "#6C7A73" },
  { label: "Dark Muted", value: "#A7B3AD" },
  { label: "Border", value: "#E6E0D6" },
  { label: "Dark Border", value: "#2E3B35" },
]

const TABS = [
  { id: "categories", label: "Categories", icon: Tags },
  { id: "budgets", label: "Budgets", icon: PiggyBank },
  { id: "transactions", label: "Transactions", icon: Target },
]

export default function FinancePage() {
  const { theme } = useTheme()
  const [activeTab, setActiveTab] = useState<"categories" | "budgets" | "transactions">("categories")
  const [accountId, setAccountId] = useState<number | null>(null)
  
  // Categories state
  const [categories, setCategories] = useState<Category[]>([])
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [filterType, setFilterType] = useState<string>("")
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    type: "expense" as "income" | "expense",
    colour: "#6BAF92",
    icon: "",
  })
  
  // Budgets state
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [showBudgetForm, setShowBudgetForm] = useState(false)
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null)
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null)
  const [budgetTransactions, setBudgetTransactions] = useState<Transaction[]>([])
  const [loadingBudgetTransactions, setLoadingBudgetTransactions] = useState(false)
  const [budgetForm, setBudgetForm] = useState({
    name: "",
    amount: "",
    category_id: "",
    period: "monthly",
    start_date: new Date().toISOString().split("T")[0],
    end_date: "",
  })
  
  // Transactions state
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [popularTags, setPopularTags] = useState<PopularTag[]>([])
  const [count, setCount] = useState(0)
  const [showTransactionForm, setShowTransactionForm] = useState(false)
  const [filterTransactionType, setFilterTransactionType] = useState<string>("")
  const [filterTransactionCategory, setFilterTransactionCategory] = useState<string>("")
  const [exporting, setExporting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [transactionForm, setTransactionForm] = useState({
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
      loadCategories()
      loadBudgets()
      loadTransactions()
      loadPopularTags()
    }
  }, [accountId])

  useEffect(() => {
    if (accountId) {
      loadTransactions()
    }
  }, [filterTransactionType, filterTransactionCategory])

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

  async function loadCategories() {
    if (!accountId) return
    try {
      const response = await categoriesApi.list(accountId, filterType)
      setCategories(response.data || [])
    } catch (error) {
      console.error("Failed to load categories")
    }
  }

  async function loadBudgets() {
    if (!accountId) return
    try {
      const response = await budgetsApi.list(accountId)
      setBudgets(response.data || [])
    } catch (error) {
      console.error("Failed to load budgets")
    }
  }

  async function loadTransactions() {
    if (!accountId) return
    try {
      const params: Record<string, string> = {}
      if (filterTransactionType) params.type = filterTransactionType
      if (filterTransactionCategory) params.category_id = filterTransactionCategory
      const response = await transactionsApi.list(accountId, params)
      setTransactions(response.data || [])
      setCount(response.count)
    } catch (error) {
      console.error("Failed to load data", error)
    }
  }

  async function loadPopularTags() {
    if (!accountId) return
    try {
      const response = await tagsApi.popular(accountId)
      setPopularTags(response.data || [])
    } catch (error) {
      console.error("Failed to load popular tags")
    }
  }

  // Category functions
  async function handleCategorySubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!accountId) return

    if (editingCategory) {
      await categoriesApi.update(editingCategory.id, {
        name: categoryForm.name,
        type: categoryForm.type,
        colour: categoryForm.colour || undefined,
        icon: categoryForm.icon || undefined,
      })
      setEditingCategory(null)
    } else {
      await categoriesApi.create({
        account_id: accountId,
        name: categoryForm.name,
        type: categoryForm.type,
        colour: categoryForm.colour,
        icon: categoryForm.icon,
      })
    }

    setCategoryForm({ name: "", type: "expense", colour: "#6BAF92", icon: "" })
    setShowCategoryForm(false)
    loadCategories()
  }

  async function handleDeleteCategory(id: number) {
    if (!accountId) return
    await categoriesApi.delete(id)
    loadCategories()
  }

  function handleEditCategory(category: Category) {
    setEditingCategory(category)
    setCategoryForm({
      name: category.name,
      type: category.type,
      colour: category.colour || "#6BAF92",
      icon: category.icon || "",
    })
    setShowCategoryForm(true)
  }

  // Budget functions
  async function handleBudgetSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!accountId) return

    if (editingBudget) {
      await budgetsApi.update(editingBudget.id, {
        name: budgetForm.name,
        amount: budgetForm.amount,
        category_id: parseInt(budgetForm.category_id),
        period: budgetForm.period,
        start_date: budgetForm.start_date,
        end_date: budgetForm.end_date || undefined,
      })
      setEditingBudget(null)
    } else {
      await budgetsApi.create({
        account_id: accountId,
        category_id: parseInt(budgetForm.category_id),
        name: budgetForm.name,
        amount: budgetForm.amount,
        period: budgetForm.period,
        start_date: budgetForm.start_date,
        end_date: budgetForm.end_date || undefined,
      })
    }

    setBudgetForm({
      name: "",
      amount: "",
      category_id: "",
      period: "monthly",
      start_date: new Date().toISOString().split("T")[0],
      end_date: "",
    })
    setShowBudgetForm(false)
    loadBudgets()
  }

  async function handleDeleteBudget(id: number) {
    if (!accountId) return
    await budgetsApi.delete(id)
    loadBudgets()
  }

  function handleEditBudget(budget: Budget) {
    setEditingBudget(budget)
    setBudgetForm({
      name: budget.name,
      amount: budget.amount,
      category_id: String(budget.category_id),
      period: budget.period,
      start_date: budget.start_date,
      end_date: budget.end_date || "",
    })
    setShowBudgetForm(true)
  }

  async function handleEditBudgetSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!editingBudget || !accountId) return
    
    try {
      await budgetsApi.update(editingBudget.id, {
        name: budgetForm.name,
        amount: budgetForm.amount,
        category_id: Number(budgetForm.category_id),
        period: budgetForm.period,
        start_date: budgetForm.start_date,
        end_date: budgetForm.end_date || undefined,
      })
      setShowBudgetForm(false)
      setEditingBudget(null)
      loadBudgets()
    } catch {
      console.error("Failed to update budget")
    }
  }

  async function handleBudgetClick(budget: Budget) {
    setSelectedBudget(budget)
    setLoadingBudgetTransactions(true)
    try {
      const response = await transactionsApi.list(accountId!, {
        category_id: String(budget.category_id),
        from: budget.start_date,
        to: budget.end_date || new Date().toISOString().split("T")[0],
      })
      setBudgetTransactions(response.data || [])
    } catch {
      console.error("Failed to load budget transactions")
      setBudgetTransactions([])
    } finally {
      setLoadingBudgetTransactions(false)
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

  // Transaction functions
  async function handleTransactionSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!accountId) return

    await transactionsApi.create({
      account_id: accountId,
      category_id: transactionForm.category_id ? parseInt(transactionForm.category_id) : undefined,
      amount: transactionForm.amount,
      type: transactionForm.type,
      description: transactionForm.description,
      date: transactionForm.date,
      notes: transactionForm.notes,
      tags: JSON.stringify(transactionForm.tags),
      account_type: transactionForm.account_type,
    })

    setTransactionForm({
      amount: "",
      type: "expense",
      description: "",
      date: new Date().toISOString().split("T")[0],
      category_id: "",
      notes: "",
      tags: [],
      account_type: "checking",
    })
    setShowTransactionForm(false)
    loadTransactions()
  }

  async function handleDeleteTransaction(id: number) {
    if (!accountId) return
    await transactionsApi.delete(id)
    loadTransactions()
  }

  async function handleExportData() {
    if (!accountId) return
    setExporting(true)
    try {
      const response = await transactionsApi.list(accountId, {
        type: filterTransactionType,
        category_id: filterTransactionCategory,
      })
      const transactions = response.data || []
      
      const headers = ["Date", "Description", "Category", "Amount", "Type", "Tags", "Notes"]
      const rows = transactions.map(t => [
        t.date,
        t.description || "",
        t.category?.name || "",
        t.amount,
        t.type,
        t.tags ? JSON.parse(t.tags).join(", ") : "",
        t.notes || "",
      ])
      
      const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n")
      const blob = new Blob([csvContent], { type: "text/csv" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `transactions_${new Date().toISOString().split("T")[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
      setMessage({ type: "success", text: "Transactions exported successfully" })
    } catch (error) {
      console.error("Failed to export data", error)
      setMessage({ type: "error", text: "Failed to export transactions" })
    } finally {
      setExporting(false)
    }
  }

  const incomeCategories = categories.filter((c) => c.type === "income")
  const expenseCategories = categories.filter((c) => c.type === "expense")

  return (
    <div className="space-y-6 px-2 sm:px-4">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Finance Management</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Manage your categories, budgets, and transactions in one place</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "default" : "outline"}
            onClick={() => setActiveTab(tab.id as any)}
            className="flex items-center gap-2 text-xs sm:text-sm"
            size="sm"
          >
            <tab.icon className="h-4 w-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </Button>
        ))}
      </div>

      {/* Categories Section */}
      {activeTab === "categories" && (
        <div className="space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className={cn("text-lg sm:text-xl font-semibold", theme === "light" ? "text-[#1F2A24]" : "text-[#E7EFEA]")}>Categories</h2>
              <p className={cn("text-xs sm:text-sm", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>Organise your transactions</p>
            </div>
            <Button onClick={() => setShowCategoryForm(!showCategoryForm)} size="sm" className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add category
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <Button variant={filterType === "" ? "default" : "outline"} size="sm" onClick={() => setFilterType("")}>All</Button>
            <Button variant={filterType === "income" ? "default" : "outline"} size="sm" onClick={() => setFilterType("income")}>Income</Button>
            <Button variant={filterType === "expense" ? "default" : "outline"} size="sm" onClick={() => setFilterType("expense")}>Expense</Button>
          </div>

          {/* Add/Edit category form */}
          {showCategoryForm && (
            <Card className={cn("border", theme === "light" ? "bg-[#E8DCC5]/50 border-[#E6E0D6]" : "bg-[#18231D]/50 border-[#2E3B35]")}>
              <CardHeader>
                <CardTitle className={cn("text-base sm:text-lg", theme === "light" ? "text-[#1F2A24]" : "text-[#E7EFEA]")}>
                  {editingCategory ? "Edit category" : "New category"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCategorySubmit} className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-2">
                    <label className={cn("text-sm font-medium", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>Name</label>
                    <Input placeholder="e.g. Groceries" value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <label className={cn("text-sm font-medium", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>Type</label>
                    <select className={cn("flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm", theme === "light" ? "border-[#E6E0D6] bg-white text-[#1F2A24]" : "border-[#2E3B35] bg-[#18231D] text-[#E7EFEA]")} value={categoryForm.type} onChange={(e) => setCategoryForm({ ...categoryForm, type: e.target.value as "income" | "expense" })}>
                      <option value="expense">Expense</option>
                      <option value="income">Income</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className={cn("text-sm font-medium", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>Colour</label>
                    <div className="flex gap-1.5 flex-wrap items-center">
                      {COLOUR_OPTIONS.map((c) => (
                        <button key={c.value} type="button" className={`h-7 w-7 rounded-full border-2 transition-all ${categoryForm.colour === c.value ? "border-foreground scale-110" : "border-transparent"}`} style={{ backgroundColor: c.value }} onClick={() => setCategoryForm({ ...categoryForm, colour: c.value })} title={c.label} />
                      ))}
                      <input type="color" value={categoryForm.colour} onChange={(e) => setCategoryForm({ ...categoryForm, colour: e.target.value })} className="h-7 w-7 rounded-full border-2 cursor-pointer overflow-hidden" title="Custom color" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className={cn("text-sm font-medium", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>Icon (emoji)</label>
                    <Input placeholder="e.g. 🛒" value={categoryForm.icon} onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })} maxLength={4} />
                  </div>
                  <div className="sm:col-span-2 lg:col-span-4 flex gap-2">
                    <Button type="submit">{editingCategory ? "Update category" : "Save category"}</Button>
                    <Button type="button" variant="outline" onClick={() => { setShowCategoryForm(false); setEditingCategory(null); setCategoryForm({ name: "", type: "expense", colour: "#6BAF92", icon: "" }) }}>Cancel</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Categories */}
          {categories.length === 0 ? (
            <div className="text-center py-16">
              <Tags className={cn("h-12 w-12 mx-auto mb-4", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")} />
              <h2 className={cn("text-lg font-semibold mb-1", theme === "light" ? "text-[#1F2A24]" : "text-[#E7EFEA]")}>No categories yet</h2>
              <p className={cn("text-sm", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>Create categories to organise your transactions.</p>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Income categories */}
              {(filterType === "" || filterType === "income") && incomeCategories.length > 0 && (
                <Card className={cn("border", theme === "light" ? "bg-[#E8DCC5]/50 border-[#E6E0D6]" : "bg-[#18231D]/50 border-[#2E3B35]")}>
                  <CardHeader>
                    <CardTitle className={cn("text-base flex items-center gap-2", theme === "light" ? "text-[#1F2A24]" : "text-[#E7EFEA]")}>
                      <Badge variant="income">Income</Badge>
                      <span>{incomeCategories.length} categories</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {incomeCategories.map((cat) => (
                        <div key={cat.id} className={cn("flex items-center justify-between p-3 rounded-md border transition-colors", theme === "light" ? "border-[#E6E0D6] hover:bg-[#6BAF92]/20" : "border-[#2E3B35] hover:bg-[#6BAF92]/20")}>
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full flex items-center justify-center text-sm" style={{ backgroundColor: cat.colour || "#6BAF92" }}>{cat.icon || cat.name[0]}</div>
                            <span className={cn("text-sm font-medium", theme === "light" ? "text-[#1F2A24]" : "text-[#E7EFEA]")}>{cat.name}</span>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className={cn(theme === "light" ? "text-[#6C7A73] hover:text-[#1F2A24]" : "text-[#A7B3AD] hover:text-[#E7EFEA]")} onClick={() => handleEditCategory(cat)}><Edit2 className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className={cn(theme === "light" ? "text-[#6C7A73] hover:text-red-400" : "text-[#A7B3AD] hover:text-red-400")} onClick={() => handleDeleteCategory(cat.id)}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Expense categories */}
              {(filterType === "" || filterType === "expense") && expenseCategories.length > 0 && (
                <Card className={cn("border", theme === "light" ? "bg-[#E8DCC5]/50 border-[#E6E0D6]" : "bg-[#18231D]/50 border-[#2E3B35]")}>
                  <CardHeader>
                    <CardTitle className={cn("text-base flex items-center gap-2", theme === "light" ? "text-[#1F2A24]" : "text-[#E7EFEA]")}>
                      <Badge variant="expense">Expense</Badge>
                      <span>{expenseCategories.length} categories</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {expenseCategories.map((cat) => (
                        <div key={cat.id} className={cn("flex items-center justify-between p-3 rounded-md border transition-colors", theme === "light" ? "border-[#E6E0D6] hover:bg-[#6BAF92]/20" : "border-[#2E3B35] hover:bg-[#6BAF92]/20")}>
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full flex items-center justify-center text-sm text-white" style={{ backgroundColor: cat.colour || "#C97C5D" }}>{cat.icon || cat.name[0]}</div>
                            <span className={cn("text-sm font-medium", theme === "light" ? "text-[#1F2A24]" : "text-[#E7EFEA]")}>{cat.name}</span>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className={cn(theme === "light" ? "text-[#6C7A73] hover:text-[#1F2A24]" : "text-[#A7B3AD] hover:text-[#E7EFEA]")} onClick={() => handleEditCategory(cat)}><Edit2 className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className={cn(theme === "light" ? "text-[#6C7A73] hover:text-red-400" : "text-[#A7B3AD] hover:text-red-400")} onClick={() => handleDeleteCategory(cat.id)}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      )}

      {/* Budgets Section */}
      {activeTab === "budgets" && (
        <div className="space-y-4 sm:space-y-6">
          {/* Add budget form */}
          {showBudgetForm && (
            <Card className={cn("border hover:transition-all duration-200", theme === "light" ? "bg-[#E8DCC5]/50 border-[#E6E0D6] hover:bg-[#E8DCC5]/70" : "bg-[#18231D]/50 border-[#2E3B35] hover:bg-[#18231D]/70")}>
              <CardHeader>
                <CardTitle className={theme === "light" ? "text-[#1F2A24]" : "text-[#E7EFEA]"}>New budget</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleBudgetSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-2">
                    <label className={cn("text-sm font-medium", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>Name</label>
                    <Input placeholder="e.g. Monthly groceries" value={budgetForm.name} onChange={(e) => setBudgetForm({ ...budgetForm, name: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <label className={cn("text-sm font-medium", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>Amount</label>
                    <Input type="number" step="0.01" placeholder="0.00" value={budgetForm.amount} onChange={(e) => setBudgetForm({ ...budgetForm, amount: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <label className={cn("text-sm font-medium", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>Category</label>
                    <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" value={budgetForm.category_id} onChange={(e) => setBudgetForm({ ...budgetForm, category_id: e.target.value })} required>
                      <option value="">Select category</option>
                      {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className={cn("text-sm font-medium", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>Period</label>
                    <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" value={budgetForm.period} onChange={(e) => setBudgetForm({ ...budgetForm, period: e.target.value })}>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className={cn("text-sm font-medium", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>Start date</label>
                    <Input type="date" value={budgetForm.start_date} onChange={(e) => setBudgetForm({ ...budgetForm, start_date: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <label className={cn("text-sm font-medium", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>End date (optional)</label>
                    <Input type="date" value={budgetForm.end_date} onChange={(e) => setBudgetForm({ ...budgetForm, end_date: e.target.value })} />
                  </div>
                  <div className="sm:col-span-2 lg:col-span-3 flex gap-2">
                    <Button type="submit">Save budget</Button>
                    <Button type="button" variant="outline" onClick={() => setShowBudgetForm(false)}>Cancel</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Budgets grid */}
          {budgets.length === 0 ? (
            <div className="text-center py-16">
              <PiggyBank className={cn("h-12 w-12 mx-auto mb-4", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")} />
              <h2 className={cn("text-lg font-semibold mb-1", theme === "light" ? "text-[#1F2A24]" : "text-[#E7EFEA]")}>No budgets yet</h2>
              <p className={cn("text-sm", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>Create a budget to start tracking your spending.</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {budgets.map((budget) => {
                const percentage = getProgressPercentage(budget)
                const spent = budget.spent ? parseFloat(budget.spent) : 0
                const remaining = budget.remaining ? parseFloat(budget.remaining) : parseFloat(budget.amount)

                return (
                  <Card key={budget.id} className={cn("border hover:transition-all duration-200 group cursor-pointer", theme === "light" ? "bg-[#E8DCC5]/50 border-[#E6E0D6] hover:bg-[#E8DCC5]/70" : "bg-[#18231D]/50 border-[#2E3B35] hover:bg-[#18231D]/70")}>
                    <CardHeader className="flex flex-row items-start justify-between pb-2 cursor-pointer" onClick={() => handleBudgetClick(budget)}>
                      <div className="flex items-center gap-2">
                        <div className={cn("p-2 rounded-lg text-white transition-colors duration-200", remaining >= 0 ? (theme === "light" ? "bg-[#6BAF92]" : "bg-[#6BAF92]") : percentage >= 90 ? "bg-red-500" : theme === "light" ? "bg-[#C97C5D]" : "bg-[#B46B52]")}>
                          {getProgressIcon(percentage)}
                        </div>
                        <div>
                          <CardTitle className={cn("text-base transition-colors", theme === "light" ? "group-hover:text-[#6BAF92]" : "group-hover:text-[#88B39B]")}>{budget.name}</CardTitle>
                          <p className={cn("text-xs mt-1", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>{budget.category?.name} · {budget.period}</p>
                        </div>
                      </div>
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className={cn(theme === "light" ? "text-[#6C7A73] hover:text-[#6BAF92]" : "text-[#A7B3AD] hover:text-[#88B39B]", "-mt-1")} onClick={() => handleEditBudget(budget)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className={cn(theme === "light" ? "text-[#6C7A73] hover:text-red-400" : "text-[#A7B3AD] hover:text-red-400", "-mt-1")} onClick={() => handleDeleteBudget(budget.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 cursor-pointer" onClick={() => handleBudgetClick(budget)}>
                      <div className="flex justify-between text-sm">
                        <span className={cn(theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>{formatCurrency(spent)} spent</span>
                        <span className="font-medium">{formatCurrency(budget.amount)}</span>
                      </div>
                      <div className={cn("h-4 rounded-full overflow-hidden", theme === "light" ? "bg-[#E6E0D6]" : "bg-[#2E3B35]")}>
                        <div className={`h-full rounded-full transition-all duration-700 ease-out ${getProgressColour(percentage)} progress-bar-fill`} style={{ width: `${percentage}%` }} />
                      </div>
                      <div className="flex items-center justify-between">
                        <p className={cn("text-sm font-medium", remaining >= 0 ? (theme === "light" ? "text-[#6BAF92]" : "text-[#A8D5BA]") : "text-red-400")}>
                          {remaining >= 0 ? `${formatCurrency(remaining)} remaining` : `${formatCurrency(Math.abs(remaining))} over budget`}
                        </p>
                        <div className={cn("text-xs", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>{percentage.toFixed(1)}% used</div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Transactions Section */}
      {activeTab === "transactions" && (
        <div className="space-y-3 xs:space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className={cn("text-lg sm:text-xl font-semibold tracking-tight", theme === "light" ? "text-[#1F2A24]" : "text-[#E7EFEA]")}>Transactions</h2>
              <p className={cn("text-xs sm:text-sm", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>{count} transaction{count !== 1 ? "s" : ""}</p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button onClick={() => setShowTransactionForm(!showTransactionForm)} className="hover:shadow-lg transition-all duration-300 w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Add transaction
              </Button>
            </div>
          </div>

          {/* Export button and message */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
            <div className="w-full sm:w-auto">
              {message && (
                <div className={cn("p-3 rounded-lg text-sm", message.type === 'success' ? theme === "light" ? "bg-[#6BAF92]/20 text-[#6BAF92]" : "bg-[#6BAF92]/20 text-[#88B39B]" : "bg-red-500/20 text-red-400")}>
                  {message.text}
                </div>
              )}
            </div>
            <Button onClick={handleExportData} disabled={exporting} variant="outline" className="w-full sm:w-auto">
              <Download className="h-4 w-4" />
              <span className="ml-2">{exporting ? "Exporting..." : "Export"}</span>
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <Button variant={filterTransactionType === "" ? "default" : "outline"} size="sm" onClick={() => setFilterTransactionType("")}>All</Button>
            <Button variant={filterTransactionType === "income" ? "default" : "outline"} size="sm" onClick={() => setFilterTransactionType("income")}>Income</Button>
            <Button variant={filterTransactionType === "expense" ? "default" : "outline"} size="sm" onClick={() => setFilterTransactionType("expense")}>Expenses</Button>
            <select className={cn("flex rounded-md border px-3 py-1 text-sm shadow-sm flex-1 sm:flex-none", theme === "light" ? "border-[#E6E0D6] bg-white text-[#1F2A24]" : "border-[#2E3B35] bg-[#18231D] text-[#E7EFEA]")} value={filterTransactionCategory} onChange={(e) => setFilterTransactionCategory(e.target.value)}>
              <option value="">All Categories</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Advanced transaction form */}
          {showTransactionForm && (
            <Card>
              <CardHeader className="px-4 py-3 sm:px-6 sm:py-4">
                <CardTitle className="text-base sm:text-lg">Advanced Transaction Entry</CardTitle>
              </CardHeader>
              <CardContent className="px-4 py-3 sm:px-6 sm:py-4">
                <form onSubmit={handleTransactionSubmit} className="space-y-4">
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="space-y-2">
                      <label className={cn("text-xs sm:text-sm font-medium", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>Amount</label>
                      <Input type="number" step="0.01" placeholder="0.00" value={transactionForm.amount} onChange={(e) => setTransactionForm({ ...transactionForm, amount: e.target.value })} required />
                    </div>
                    <div className="space-y-2">
                      <label className={cn("text-xs sm:text-sm font-medium", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>Type</label>
                      <select className={cn("flex rounded-md border px-3 py-1 text-sm shadow-sm w-full", theme === "light" ? "border-[#E6E0D6] bg-white text-[#1F2A24]" : "border-[#2E3B35] bg-[#18231D] text-[#E7EFEA]")} value={transactionForm.type} onChange={(e) => setTransactionForm({ ...transactionForm, type: e.target.value as "income" | "expense" })}>
                        <option value="expense">Expense</option>
                        <option value="income">Income</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className={cn("text-xs sm:text-sm font-medium", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>Date</label>
                      <Input type="date" value={transactionForm.date} onChange={(e) => setTransactionForm({ ...transactionForm, date: e.target.value })} required />
                    </div>
                    <div className="space-y-2 sm:col-span-2 lg:col-span-3 responsive-input">
                      <label className={cn("text-xs sm:text-sm font-medium", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>Category</label>
                      <select className={cn("flex rounded-md border px-3 py-1 text-sm shadow-sm w-full", theme === "light" ? "border-[#E6E0D6] bg-white text-[#1F2A24]" : "border-[#2E3B35] bg-[#18231D] text-[#E7EFEA]")} value={transactionForm.category_id} onChange={(e) => setTransactionForm({ ...transactionForm, category_id: e.target.value })}>
                        <option value="">Select category</option>
                        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2 sm:col-span-2 lg:col-span-3 responsive-input">
                      <label className={cn("text-xs sm:text-sm font-medium", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>Tags</label>
                      <TagInput value={transactionForm.tags} onChange={(tags) => setTransactionForm({ ...transactionForm, tags })} placeholder="Add tags (press Enter or comma to add)" suggestions={popularTags.map(tag => tag.tag)} />
                    </div>
                    <div className="space-y-2 sm:col-span-2 lg:col-span-3 responsive-input">
                      <label className={cn("text-xs sm:text-sm font-medium", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>Notes</label>
                      <textarea className={cn("flex w-full rounded-md border px-3 py-2 text-sm shadow-sm min-h-[80px]", theme === "light" ? "border-[#E6E0D6] bg-white text-[#1F2A24]" : "border-[#2E3B35] bg-[#18231D] text-[#E7EFEA]")} placeholder="Optional notes..." value={transactionForm.notes} onChange={(e) => setTransactionForm({ ...transactionForm, notes: e.target.value })} />
                    </div>
                    <div className="space-y-2 responsive-input">
                      <label className={cn("mobile-text font-medium", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>Notes</label>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className={cn("mobile-text font-medium", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>Tags</label>
                    <TagInput value={transactionForm.tags} onChange={(tags) => setTransactionForm({ ...transactionForm, tags })} placeholder="Add tags (press Enter or comma to add)" suggestions={popularTags.map(tag => tag.tag)} />
                  </div>
                  <div className="flex flex-col xs:flex-row gap-2 justify-end">
                    <Button type="submit" className="mobile-button">Save transaction</Button>
                    <Button type="button" variant="outline" onClick={() => setShowTransactionForm(false)} className="mobile-button">Cancel</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Transactions list */}
          <Card className="mobile-card">
            <CardContent className="p-0">
              {transactions.length === 0 ? (
                <p className={cn("mobile-text text-center py-6 xs:py-8", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>No transactions found</p>
              ) : (
                <div className="divide-y">
                  {transactions.map((t) => (
                    <div key={t.id} className={cn("px-3 xs:px-4 lg:px-6 py-3 xs:py-4 transition-colors", theme === "light" ? "hover:bg-[#E6E0D6]/20" : "hover:bg-[#2E3B35]/20")}>
                      <div className="flex flex-col gap-2 xs:gap-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col xs:flex-row xs:items-center gap-2 mb-1">
                              <p className="mobile-text font-medium truncate">{t.description || "Untitled transaction"}</p>
                              <Badge variant={t.type === "income" ? "secondary" : "destructive"} className={cn("text-xs", t.type === "income" ? (theme === "light" ? "bg-[#6BAF92]/20 text-[#4A7A60] border-[#6BAF92]/50" : "bg-[#88B39B]/20 text-[#88B39B] border-[#88B39B]/50") : "bg-[#DC2626]/30 text-[#DC2626] border-[#DC2626]/50")}>
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
                                        <Badge key={index} variant="outline" className="text-xs px-1 py-0">{tag}</Badge>
                                      ))}
                                      {JSON.parse(t.tags).length > 2 && (
                                        <Badge variant="outline" className="text-xs px-1 py-0">+{JSON.parse(t.tags).length - 2}</Badge>
                                      )}
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={cn("mobile-text font-semibold", t.type === "income" ? (theme === "light" ? "text-[#D9B44A]" : "text-[#C9A24A]") : "text-red-400")}>
                              {t.type === "income" ? "+" : "-"}{formatCurrency(t.amount)}
                            </span>
                            <Button variant="ghost" size="icon" className={cn("mobile-button-sm", theme === "light" ? "text-[#6C7A73] hover:text-red-400" : "text-[#A7B3AD] hover:text-red-400")} onClick={() => handleDeleteTransaction(t.id)}>
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
      )}

      {/* Budget transactions modal */}
      {selectedBudget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className={cn(
            "w-full max-w-2xl max-h-[85vh] sm:max-h-[80vh] overflow-auto rounded-lg p-4 sm:p-6",
            theme === "light" ? "bg-[#E8DCC5]" : "bg-[#18231D]"
          )}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1 min-w-0">
                <h2 className={cn("text-lg sm:text-xl font-bold truncate", theme === "light" ? "text-[#1F2A24]" : "text-[#E7EFEA]")}>
                  {selectedBudget.name} Transactions
                </h2>
                <p className={cn("text-xs sm:text-sm truncate", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>
                  {selectedBudget.category?.name} · {selectedBudget.period}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelectedBudget(null)} className="ml-2 flex-shrink-0">
                <X className="h-5 w-5" />
              </Button>
            </div>

            {loadingBudgetTransactions ? (
              <p className={cn("text-center py-8", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>Loading transactions...</p>
            ) : budgetTransactions.length === 0 ? (
              <p className={cn("text-center py-8", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>No transactions found for this budget period.</p>
            ) : (
              <div className="space-y-2">
                {budgetTransactions.map((t) => (
                  <div
                    key={t.id}
                    className={cn(
                      "flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 p-3 rounded-md border",
                      theme === "light" ? "border-[#E6E0D6]" : "border-[#2E3B35]"
                    )}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div
                        className="h-8 w-8 rounded-full flex items-center justify-center text-xs sm:text-sm text-white flex-shrink-0"
                        style={{ backgroundColor: t.category?.colour || "#6BAF92" }}
                      >
                        {t.category?.icon || t.category?.name[0] || "??"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-sm font-medium truncate", theme === "light" ? "text-[#1F2A24]" : "text-[#E7EFEA]")}>
                          {t.description || t.category?.name}
                        </p>
                        <p className={cn("text-xs", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>
                          {formatDate(t.date)}
                        </p>
                      </div>
                    </div>
                    <span className={cn("text-sm font-semibold", t.type === "income" ? (theme === "light" ? "text-[#D9B44A]" : "text-[#C9A24A]") : "text-red-400")}>
                      {t.type === "income" ? "+" : "-"}{formatCurrency(t.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
