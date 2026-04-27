import { useState, useEffect } from "react"
import { Plus, Trash2, Tags } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { categoriesApi, accountsApi, type Category, type Account } from "@/lib/api"
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

export default function CategoriesPage() {
  const { theme } = useTheme()
  const [accountId, setAccountId] = useState<number | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filterType, setFilterType] = useState<string>("")

  const [form, setForm] = useState({
    name: "",
    type: "expense" as "income" | "expense",
    colour: "#6BAF92",
    icon: "",
  })

  useEffect(() => {
    loadUserAccount()
  }, [])

  useEffect(() => {
    if (accountId) {
      loadCategories()
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

  async function loadCategories() {
    if (!accountId) return
    
    setLoading(true)
    try {
      const res = await categoriesApi.list(accountId, filterType || undefined)
      setCategories(res.data || [])
    } catch {
      console.error("Failed to load categories")
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!accountId) return
    
    try {
      await categoriesApi.create({
        account_id: accountId,
        name: form.name,
        type: form.type,
        colour: form.colour || undefined,
        icon: form.icon || undefined,
      })
      setForm({ name: "", type: "expense", colour: "#6BAF92", icon: "" })
      setShowForm(false)
      loadCategories()
    } catch {
      console.error("Failed to create category")
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Are you sure you want to delete this category?")) return
    try {
      await categoriesApi.delete(id)
      loadCategories()
    } catch {
      console.error("Failed to delete category")
    }
  }

  const incomeCategories = categories.filter((c) => c.type === "income")
  const expenseCategories = categories.filter((c) => c.type === "expense")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between" data-tutorial="categories-page">
        <div>
          <h1 className={cn(
            "text-2xl font-bold tracking-tight",
            theme === "light" ? "text-[#1F2A24]" : "text-[#E7EFEA]"
          )}>Categories</h1>
          <p className={theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]"}>Organise your transactions</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Add category
        </Button>
      </div>

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
          Expense
        </Button>
      </div>

      {/* Add category form */}
      {showForm && (
        <Card className={cn(
          "border",
          theme === "light" ? "bg-[#E8DCC5]/50 border-[#E6E0D6]" : "bg-[#18231D]/50 border-[#2E3B35]"
        )}>
          <CardHeader>
            <CardTitle className={theme === "light" ? "text-[#1F2A24]" : "text-[#E7EFEA]"}>New category</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <label className={cn("text-sm font-medium", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>Name</label>
                <Input
                  placeholder="e.g. Groceries"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className={cn("text-sm font-medium", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>Type</label>
                <select
                  className={cn(
                    "flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm",
                    theme === "light"
                      ? "border-[#E6E0D6] bg-white text-[#1F2A24]"
                      : "border-[#2E3B35] bg-[#18231D] text-[#E7EFEA]"
                  )}
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as "income" | "expense" })}
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className={cn("text-sm font-medium", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>Colour</label>
                <div className="flex gap-1.5 flex-wrap">
                  {COLOUR_OPTIONS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      className={`h-7 w-7 rounded-full border-2 transition-all ${
                        form.colour === c.value ? "border-foreground scale-110" : "border-transparent"
                      }`}
                      style={{ backgroundColor: c.value }}
                      onClick={() => setForm({ ...form, colour: c.value })}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className={cn("text-sm font-medium", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>Icon (emoji)</label>
                <Input
                  placeholder="e.g. 🛒"
                  value={form.icon}
                  onChange={(e) => setForm({ ...form, icon: e.target.value })}
                  maxLength={4}
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-4 flex gap-2">
                <Button type="submit">Save category</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Categories */}
      {loading ? (
        <p className={cn("text-center py-8", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>Loading...</p>
      ) : categories.length === 0 ? (
        <div className="text-center py-16">
          <Tags className={cn(
            "h-12 w-12 mx-auto mb-4",
            theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]"
          )} />
          <h2 className={cn(
            "text-lg font-semibold mb-1",
            theme === "light" ? "text-[#1F2A24]" : "text-[#E7EFEA]"
          )}>No categories yet</h2>
          <p className={cn("text-sm", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>Create categories to organise your transactions.</p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Income categories */}
          {(filterType === "" || filterType === "income") && incomeCategories.length > 0 && (
            <Card className={cn(
              "border",
              theme === "light" ? "bg-[#E8DCC5]/50 border-[#E6E0D6]" : "bg-[#18231D]/50 border-[#2E3B35]"
            )}>
              <CardHeader>
                <CardTitle className={cn(
                  "text-base flex items-center gap-2",
                  theme === "light" ? "text-[#1F2A24]" : "text-[#E7EFEA]"
                )}>
                  <Badge variant="income">Income</Badge>
                  <span>{incomeCategories.length} categories</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {incomeCategories.map((cat) => (
                    <div
                      key={cat.id}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-md border transition-colors",
                        theme === "light"
                          ? "border-[#E6E0D6] hover:bg-[#6BAF92]/20"
                          : "border-[#2E3B35] hover:bg-[#6BAF92]/20"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="h-8 w-8 rounded-full flex items-center justify-center text-sm"
                          style={{ backgroundColor: cat.colour || "#6BAF92" }}
                        >
                          {cat.icon || cat.name[0]}
                        </div>
                        <span className={cn("text-sm font-medium", theme === "light" ? "text-[#1F2A24]" : "text-[#E7EFEA]")}>{cat.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          theme === "light" ? "text-[#6C7A73] hover:text-red-400" : "text-[#A7B3AD] hover:text-red-400"
                        )}
                        onClick={() => handleDelete(cat.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Expense categories */}
          {(filterType === "" || filterType === "expense") && expenseCategories.length > 0 && (
            <Card className={cn(
              "border",
              theme === "light" ? "bg-[#E8DCC5]/50 border-[#E6E0D6]" : "bg-[#18231D]/50 border-[#2E3B35]"
            )}>
              <CardHeader>
                <CardTitle className={cn(
                  "text-base flex items-center gap-2",
                  theme === "light" ? "text-[#1F2A24]" : "text-[#E7EFEA]"
                )}>
                  <Badge variant="expense">Expense</Badge>
                  <span>{expenseCategories.length} categories</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {expenseCategories.map((cat) => (
                    <div
                      key={cat.id}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-md border transition-colors",
                        theme === "light"
                          ? "border-[#E6E0D6] hover:bg-[#6BAF92]/20"
                          : "border-[#2E3B35] hover:bg-[#6BAF92]/20"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="h-8 w-8 rounded-full flex items-center justify-center text-sm text-white"
                          style={{ backgroundColor: cat.colour || "#C97C5D" }}
                        >
                          {cat.icon || cat.name[0]}
                        </div>
                        <span className={cn("text-sm font-medium", theme === "light" ? "text-[#1F2A24]" : "text-[#E7EFEA]")}>{cat.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          theme === "light" ? "text-[#6C7A73] hover:text-red-400" : "text-[#A7B3AD] hover:text-red-400"
                        )}
                        onClick={() => handleDelete(cat.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
