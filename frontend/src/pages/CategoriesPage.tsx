import { useEffect, useState } from "react"
import { Plus, Trash2, Tags } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { categoriesApi, type Category } from "@/lib/api"

const ACCOUNT_ID = 1

const COLOUR_OPTIONS = [
  { label: "Blue", value: "#3b82f6" },
  { label: "Emerald", value: "#10b981" },
  { label: "Amber", value: "#f59e0b" },
  { label: "Red", value: "#ef4444" },
  { label: "Purple", value: "#8b5cf6" },
  { label: "Pink", value: "#ec4899" },
  { label: "Slate", value: "#64748b" },
  { label: "Orange", value: "#f97316" },
]

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filterType, setFilterType] = useState<string>("")

  const [form, setForm] = useState({
    name: "",
    type: "expense" as "income" | "expense",
    colour: "#3b82f6",
    icon: "",
  })

  useEffect(() => {
    loadCategories()
  }, [filterType])

  async function loadCategories() {
    setLoading(true)
    try {
      const res = await categoriesApi.list(ACCOUNT_ID, filterType || undefined)
      setCategories(res.data || [])
    } catch {
      console.error("Failed to load categories")
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      await categoriesApi.create({
        account_id: ACCOUNT_ID,
        name: form.name,
        type: form.type,
        colour: form.colour || undefined,
        icon: form.icon || undefined,
      })
      setForm({ name: "", type: "expense", colour: "#3b82f6", icon: "" })
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Categories</h1>
          <p className="text-slate-400">Organise your transactions</p>
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
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle>New category</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Name</label>
                <Input
                  placeholder="e.g. Groceries"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Type</label>
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
                <label className="text-sm font-medium text-slate-300">Colour</label>
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
                <label className="text-sm font-medium text-slate-300">Icon (emoji)</label>
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
        <p className="text-slate-400 text-center py-8">Loading...</p>
      ) : categories.length === 0 ? (
        <div className="text-center py-16">
          <Tags className="h-12 w-12 mx-auto text-slate-500 mb-4" />
          <h2 className="text-lg font-semibold mb-1 text-slate-100">No categories yet</h2>
          <p className="text-slate-400 text-sm">Create categories to organise your transactions.</p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Income categories */}
          {(filterType === "" || filterType === "income") && incomeCategories.length > 0 && (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Badge variant="income">Income</Badge>
                  <span>{incomeCategories.length} categories</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {incomeCategories.map((cat) => (
                    <div
                      key={cat.id}
                      className="flex items-center justify-between p-3 rounded-md border border-slate-700 hover:bg-blue-900/20 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="h-8 w-8 rounded-full flex items-center justify-center text-sm"
                          style={{ backgroundColor: cat.colour || "#10b981" }}
                        >
                          {cat.icon || cat.name[0]}
                        </div>
                        <span className="text-sm font-medium">{cat.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-slate-400 hover:text-red-400"
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
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Badge variant="expense">Expense</Badge>
                  <span>{expenseCategories.length} categories</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {expenseCategories.map((cat) => (
                    <div
                      key={cat.id}
                      className="flex items-center justify-between p-3 rounded-md border border-slate-700 hover:bg-blue-900/20 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="h-8 w-8 rounded-full flex items-center justify-center text-sm text-white"
                          style={{ backgroundColor: cat.colour || "#ef4444" }}
                        >
                          {cat.icon || cat.name[0]}
                        </div>
                        <span className="text-sm font-medium">{cat.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-slate-400 hover:text-red-400"
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
