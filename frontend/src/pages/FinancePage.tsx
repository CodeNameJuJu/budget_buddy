import { useState, useEffect } from "react"
import { Plus, Trash2, Tags, Edit2, PiggyBank, Target, Sparkles, Download, Tag as TagIcon } from "lucide-react"
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

const STEPS = [
  { id: "categories", label: "1. Categories", icon: Tags, description: "Create categories for your transactions" },
  { id: "budgets", label: "2. Budgets", icon: PiggyBank, description: "Set budgets to track your spending" },
  { id: "transactions", label: "3. Transactions", icon: Target, description: "Add and manage your transactions" },
]

export default function FinancePage() {
  const { theme } = useTheme()
  const [activeStep, setActiveStep] = useState<"categories" | "budgets" | "transactions">("categories")
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Finance Management</h1>
        <p className="text-muted-foreground">Manage your categories, budgets, and transactions in one place</p>
      </div>

      {/* Step indicator */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {STEPS.map((step) => (
          <button
            key={step.id}
            onClick={() => setActiveStep(step.id as any)}
            className={cn(
              "p-4 rounded-lg border-2 text-left transition-all",
              activeStep === step.id
                ? theme === "light"
                  ? "border-[#6BAF92] bg-[#E8DCC5]"
                  : "border-[#88B39B] bg-[#18231D]"
                : theme === "light"
                  ? "border-[#E6E0D6] bg-white hover:border-[#6BAF92]"
                  : "border-[#2E3B35] bg-[#0F1512] hover:border-[#88B39B]"
            )}
          >
            <div className="flex items-center gap-3 mb-2">
              <step.icon className={cn("h-5 w-5", activeStep === step.id ? "text-[#6BAF92]" : "text-muted-foreground")} />
              <span className={cn("font-semibold", activeStep === step.id ? "text-[#1F2A24]" : "text-muted-foreground")}>{step.label}</span>
            </div>
            <p className="text-sm text-muted-foreground">{step.description}</p>
          </button>
        ))}
      </div>

      {/* Categories Section */}
      {activeStep === "categories" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Categories</h2>
            <Button onClick={() => { setShowCategoryForm(true); setEditingCategory(null); setCategoryForm({ name: "", type: "expense", colour: "#6BAF92", icon: "" }) }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </div>

          {showCategoryForm && (
            <Card className={cn(theme === "light" ? "bg-[#E8DCC5]" : "bg-[#18231D]")}>
              <CardHeader>
                <CardTitle>{editingCategory ? "Edit category" : "New category"}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCategorySubmit} className="space-y-4">
                  <div>
                    <label className={cn("text-sm font-medium", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>Name</label>
                    <Input
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                      placeholder="Category name"
                      required
                    />
                  </div>
                  <div>
                    <label className={cn("text-sm font-medium", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>Type</label>
                    <select
                      value={categoryForm.type}
                      onChange={(e) => setCategoryForm({ ...categoryForm, type: e.target.value as any })}
                      className={cn("w-full mt-1 p-2 rounded border", theme === "light" ? "border-[#E6E0D6]" : "border-[#2E3B35] bg-[#0F1512]")}
                    >
                      <option value="expense">Expense</option>
                      <option value="income">Income</option>
                    </select>
                  </div>
                  <div>
                    <label className={cn("text-sm font-medium", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>Colour</label>
                    <div className="flex gap-1.5 flex-wrap items-center mt-2">
                      {COLOUR_OPTIONS.map((c) => (
                        <button
                          key={c.value}
                          type="button"
                          className={`h-7 w-7 rounded-full border-2 transition-all ${
                            categoryForm.colour === c.value ? "border-foreground scale-110" : "border-transparent"
                          }`}
                          style={{ backgroundColor: c.value }}
                          onClick={() => setCategoryForm({ ...categoryForm, colour: c.value })}
                          title={c.label}
                        />
                      ))}
                      <input
                        type="color"
                        value={categoryForm.colour}
                        onChange={(e) => setCategoryForm({ ...categoryForm, colour: e.target.value })}
                        className="h-7 w-7 rounded-full border-2 cursor-pointer overflow-hidden"
                        title="Custom color"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit">{editingCategory ? "Update" : "Create"}</Button>
                    <Button type="button" variant="outline" onClick={() => { setShowCategoryForm(false); setEditingCategory(null); setCategoryForm({ name: "", type: "expense", colour: "#6BAF92", icon: "" }) }}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="space-y-6">
            <div>
              <h3 className={cn("text-lg font-medium mb-4", theme === "light" ? "text-[#1F2A24]" : "text-[#E7EFEA]")}>Income Categories</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {incomeCategories.map((cat) => (
                  <Card key={cat.id} className={cn(theme === "light" ? "bg-[#E8DCC5]" : "bg-[#18231D]")}>
                    <CardHeader className="flex flex-row items-start justify-between pb-2">
                      <CardTitle className="text-sm font-medium">{cat.name}</CardTitle>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEditCategory(cat)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteCategory(cat.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Badge className={cn("text-xs", cat.type === "income" ? "bg-green-500" : "bg-red-500")}>{cat.type}</Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div>
              <h3 className={cn("text-lg font-medium mb-4", theme === "light" ? "text-[#1F2A24]" : "text-[#E7EFEA]")}>Expense Categories</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {expenseCategories.map((cat) => (
                  <Card key={cat.id} className={cn(theme === "light" ? "bg-[#E8DCC5]" : "bg-[#18231D]")}>
                    <CardHeader className="flex flex-row items-start justify-between pb-2">
                      <CardTitle className="text-sm font-medium">{cat.name}</CardTitle>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEditCategory(cat)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteCategory(cat.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Badge className={cn("text-xs", cat.type === "income" ? "bg-green-500" : "bg-red-500")}>{cat.type}</Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Budgets Section */}
      {activeStep === "budgets" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Budgets</h2>
            <Button onClick={() => { setShowBudgetForm(true); setEditingBudget(null); setBudgetForm({ name: "", amount: "", category_id: "", period: "monthly", start_date: new Date().toISOString().split("T")[0], end_date: "" }) }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Budget
            </Button>
          </div>

          {showBudgetForm && (
            <Card className={cn(theme === "light" ? "bg-[#E8DCC5]" : "bg-[#18231D]")}>
              <CardHeader>
                <CardTitle>{editingBudget ? "Edit budget" : "New budget"}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleBudgetSubmit} className="space-y-4">
                  <div>
                    <label className={cn("text-sm font-medium", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>Name</label>
                    <Input
                      value={budgetForm.name}
                      onChange={(e) => setBudgetForm({ ...budgetForm, name: e.target.value })}
                      placeholder="Budget name"
                      required
                    />
                  </div>
                  <div>
                    <label className={cn("text-sm font-medium", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>Amount</label>
                    <Input
                      type="number"
                      value={budgetForm.amount}
                      onChange={(e) => setBudgetForm({ ...budgetForm, amount: e.target.value })}
                      placeholder="Budget amount"
                      required
                    />
                  </div>
                  <div>
                    <label className={cn("text-sm font-medium", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>Category</label>
                    <select
                      value={budgetForm.category_id}
                      onChange={(e) => setBudgetForm({ ...budgetForm, category_id: e.target.value })}
                      className={cn("w-full mt-1 p-2 rounded border", theme === "light" ? "border-[#E6E0D6]" : "border-[#2E3B35] bg-[#0F1512]")}
                      required
                    >
                      <option value="">Select category</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={cn("text-sm font-medium", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>Period</label>
                    <select
                      value={budgetForm.period}
                      onChange={(e) => setBudgetForm({ ...budgetForm, period: e.target.value })}
                      className={cn("w-full mt-1 p-2 rounded border", theme === "light" ? "border-[#E6E0D6]" : "border-[#2E3B35] bg-[#0F1512]")}
                    >
                      <option value="monthly">Monthly</option>
                      <option value="weekly">Weekly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                  <div>
                    <label className={cn("text-sm font-medium", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>Start Date</label>
                    <Input
                      type="date"
                      value={budgetForm.start_date}
                      onChange={(e) => setBudgetForm({ ...budgetForm, start_date: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className={cn("text-sm font-medium", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>End Date (optional)</label>
                    <Input
                      type="date"
                      value={budgetForm.end_date}
                      onChange={(e) => setBudgetForm({ ...budgetForm, end_date: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit">{editingBudget ? "Update" : "Create"}</Button>
                    <Button type="button" variant="outline" onClick={() => { setShowBudgetForm(false); setEditingBudget(null); setBudgetForm({ name: "", amount: "", category_id: "", period: "monthly", start_date: new Date().toISOString().split("T")[0], end_date: "" }) }}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {budgets.map((budget) => (
              <Card key={budget.id} className={cn(theme === "light" ? "bg-[#E8DCC5]" : "bg-[#18231D]")}>
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <CardTitle className="text-sm font-medium">{budget.name}</CardTitle>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEditBudget(budget)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteBudget(budget.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Amount</span>
                      <span className="font-semibold">{formatCurrency(budget.amount)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Category</span>
                      <span>{budget.category?.name || "N/A"}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Period</span>
                      <span>{budget.period}</span>
                    </div>
                    <Badge className="text-xs">{budget.spent ? `${((parseFloat(budget.spent) / parseFloat(budget.amount)) * 100).toFixed(0)}% spent` : "0% spent"}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Transactions Section */}
      {activeStep === "transactions" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Transactions</h2>
            <div className="flex gap-2">
              <Button onClick={handleExportData} disabled={exporting}>
                <Download className="h-4 w-4 mr-2" />
                {exporting ? "Exporting..." : "Export"}
              </Button>
              <Button onClick={() => { setShowTransactionForm(true); setTransactionForm({ amount: "", type: "expense", description: "", date: new Date().toISOString().split("T")[0], category_id: "", notes: "", tags: [], account_type: "checking" }) }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Transaction
              </Button>
            </div>
          </div>

          {message && (
            <div className={cn("p-3 rounded-lg text-sm", message.type === "success" ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500")}>
              {message.text}
            </div>
          )}

          <div className="flex gap-2">
            <select
              value={filterTransactionType}
              onChange={(e) => setFilterTransactionType(e.target.value)}
              className={cn("p-2 rounded border", theme === "light" ? "border-[#E6E0D6]" : "border-[#2E3B35] bg-[#0F1512]")}
            >
              <option value="">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
            <select
              value={filterTransactionCategory}
              onChange={(e) => setFilterTransactionCategory(e.target.value)}
              className={cn("p-2 rounded border", theme === "light" ? "border-[#E6E0D6]" : "border-[#2E3B35] bg-[#0F1512]")}
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {showTransactionForm && (
            <Card className={cn(theme === "light" ? "bg-[#E8DCC5]" : "bg-[#18231D]")}>
              <CardHeader>
                <CardTitle>New Transaction</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleTransactionSubmit} className="space-y-4">
                  <div>
                    <label className={cn("text-sm font-medium", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>Amount</label>
                    <Input
                      type="number"
                      value={transactionForm.amount}
                      onChange={(e) => setTransactionForm({ ...transactionForm, amount: e.target.value })}
                      placeholder="Amount"
                      required
                    />
                  </div>
                  <div>
                    <label className={cn("text-sm font-medium", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>Type</label>
                    <select
                      value={transactionForm.type}
                      onChange={(e) => setTransactionForm({ ...transactionForm, type: e.target.value as any })}
                      className={cn("w-full mt-1 p-2 rounded border", theme === "light" ? "border-[#E6E0D6]" : "border-[#2E3B35] bg-[#0F1512]")}
                    >
                      <option value="expense">Expense</option>
                      <option value="income">Income</option>
                    </select>
                  </div>
                  <div>
                    <label className={cn("text-sm font-medium", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>Description</label>
                    <Input
                      value={transactionForm.description}
                      onChange={(e) => setTransactionForm({ ...transactionForm, description: e.target.value })}
                      placeholder="Description"
                      required
                    />
                  </div>
                  <div>
                    <label className={cn("text-sm font-medium", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>Category</label>
                    <select
                      value={transactionForm.category_id}
                      onChange={(e) => setTransactionForm({ ...transactionForm, category_id: e.target.value })}
                      className={cn("w-full mt-1 p-2 rounded border", theme === "light" ? "border-[#E6E0D6]" : "border-[#2E3B35] bg-[#0F1512]")}
                    >
                      <option value="">Select category</option>
                      {categories
                        .filter((c) => c.type === transactionForm.type)
                        .map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className={cn("text-sm font-medium", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>Date</label>
                    <Input
                      type="date"
                      value={transactionForm.date}
                      onChange={(e) => setTransactionForm({ ...transactionForm, date: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className={cn("text-sm font-medium", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>Tags</label>
                    <TagInput
                      value={transactionForm.tags}
                      onChange={(tags) => setTransactionForm({ ...transactionForm, tags })}
                      suggestions={popularTags.map(tag => tag.tag)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit">Create</Button>
                    <Button type="button" variant="outline" onClick={() => { setShowTransactionForm(false); setTransactionForm({ amount: "", type: "expense", description: "", date: new Date().toISOString().split("T")[0], category_id: "", notes: "", tags: [], account_type: "checking" }) }}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="space-y-2">
            {transactions.map((t) => (
              <Card key={t.id} className={cn(theme === "light" ? "bg-[#E8DCC5]" : "bg-[#18231D]")}>
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{t.description || "Transaction"}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(t.date)}</p>
                    {t.category && <Badge className="text-xs mt-1">{t.category.name}</Badge>}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Badge variant={t.type === "income" ? "income" : "expense"}>{t.type}</Badge>
                    <span className={cn("text-sm font-semibold", t.type === "income" ? "text-green-500" : "text-red-500")}>
                      {t.type === "income" ? "+" : "-"}{formatCurrency(t.amount)}
                    </span>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteTransaction(t.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
