import { useState, useEffect } from "react"
import {
  Plus,
  Trash2,
  PiggyBank,
  Target,
  TrendingUp,
  Check,
  Landmark,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Pencil,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { savingsApi, accountsApi, type SavingsSummary, type SavingsPot, type SavingsAllocation, type Account, type ForecastResponse } from "@/lib/api"
import { formatCurrency } from "@/lib/utils"

const COLOUR_OPTIONS = [
  { label: "Blue", value: "#3b82f6" },
  { label: "Emerald", value: "#10b981" },
  { label: "Amber", value: "#f59e0b" },
  { label: "Purple", value: "#8b5cf6" },
  { label: "Pink", value: "#ec4899" },
  { label: "Slate", value: "#64748b" },
  { label: "Emerald", value: "#10b981" },
  { label: "Orange", value: "#f97316" },
]

export default function SavingsPage() {
  const [accountId, setAccountId] = useState<number | null>(null)
  const [summary, setSummary] = useState<SavingsSummary | null>(null)
  const [allocations, setAllocations] = useState<SavingsAllocation[]>([])
  const [forecast, setForecast] = useState<ForecastResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForecast, setShowForecast] = useState(false)

  // Balance editing
  const [editingBalance, setEditingBalance] = useState(false)
  const [balanceInput, setBalanceInput] = useState("")

  // New pot form
  const [showPotForm, setShowPotForm] = useState(false)
  const [potForm, setPotForm] = useState({
    name: "",
    icon: "",
    colour: "#3b82f6",
    target: "",
    contribution: "",
    contribution_period: "monthly",
  })

  // Allocation form — tracked per pot
  const [allocatingPotID, setAllocatingPotID] = useState<number | null>(null)
  const [allocForm, setAllocForm] = useState({
    amount: "",
    notes: "",
    isWithdrawal: false,
  })

  // Allocation history view
  const [viewingPotID, setViewingPotID] = useState<number | null>(null)

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
      const [summaryRes, allocRes, forecastRes] = await Promise.all([
        savingsApi.summary(accountId),
        savingsApi.listAllocations(accountId),
        savingsApi.forecast(accountId),
      ])
      setSummary(summaryRes.data)
      setAllocations(allocRes.data || [])
      setForecast(forecastRes.data)
      if (summaryRes.data.savings_balance) {
        setBalanceInput(summaryRes.data.savings_balance)
      }
    } catch {
      console.error("Failed to load savings data")
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveBalance() {
    if (!accountId) return
    
    try {
      await savingsApi.updateBalance(accountId, balanceInput)
      setEditingBalance(false)
      loadData()
    } catch {
      console.error("Failed to update balance")
    }
  }

  async function handleCreatePot(e: React.FormEvent) {
    e.preventDefault()
    if (!accountId) return
    
    try {
      await savingsApi.createPot({
        account_id: accountId,
        name: potForm.name,
        icon: potForm.icon || undefined,
        colour: potForm.colour || undefined,
        target: potForm.target || undefined,
        contribution: potForm.contribution || undefined,
        contribution_period: potForm.contribution ? potForm.contribution_period : undefined,
      })
      setPotForm({ name: "", icon: "", colour: "#3b82f6", target: "", contribution: "", contribution_period: "monthly" })
      setShowPotForm(false)
      loadData()
    } catch {
      console.error("Failed to create savings pot")
    }
  }

  async function handleDeletePot(id: number) {
    if (!confirm("Are you sure you want to delete this savings pot?")) return
    try {
      await savingsApi.deletePot(id)
      loadData()
    } catch {
      console.error("Failed to delete savings pot")
    }
  }

  async function handleCreateAllocation(e: React.FormEvent) {
    e.preventDefault()
    if (!allocatingPotID) return
    try {
      const amount = allocForm.isWithdrawal
        ? `-${allocForm.amount}`
        : allocForm.amount
      await savingsApi.createAllocation({
        account_id: accountId,
        savings_pot_id: allocatingPotID,
        amount,
        notes: allocForm.notes || undefined,
      })
      setAllocForm({ amount: "", notes: "", isWithdrawal: false })
      setAllocatingPotID(null)
      loadData()
    } catch {
      console.error("Failed to create allocation")
    }
  }

  async function handleDeleteAllocation(id: number) {
    try {
      await savingsApi.deleteAllocation(id)
      loadData()
    } catch {
      console.error("Failed to delete allocation")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-400">Loading savings...</p>
      </div>
    )
  }

  const savingsBalance = summary?.savings_balance
    ? parseFloat(summary.savings_balance)
    : 0
  const totalAllocated = summary ? parseFloat(summary.total_allocated) : 0
  const unallocated = summary ? parseFloat(summary.unallocated) : 0
  const pots = summary?.pots || []

  return (
    <div className="space-y-8" data-tutorial="savings-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Savings</h1>
          <p className="text-slate-400">
            Break your savings into pots and track allocations
          </p>
        </div>
        <Button onClick={() => setShowPotForm(!showPotForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Add pot
        </Button>
      </div>

      {/* Balance comparison panel */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Actual savings balance
            </CardTitle>
            <button
              onClick={() => setEditingBalance(!editingBalance)}
              className="text-slate-400 hover:text-slate-300"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          </CardHeader>
          <CardContent>
            {editingBalance ? (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  step="0.01"
                  value={balanceInput}
                  onChange={(e) => setBalanceInput(e.target.value)}
                  className="h-8 text-sm"
                  placeholder="0.00"
                />
                <Button size="sm" onClick={handleSaveBalance}>
                  <Check className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <div className="text-2xl font-bold">
                {summary?.savings_balance
                  ? formatCurrency(savingsBalance)
                  : "Not set"}
              </div>
            )}
            <p className="text-xs text-slate-400 mt-1">
              Enter your actual bank savings balance
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Total allocated
            </CardTitle>
            <Landmark className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">
              {formatCurrency(totalAllocated)}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Sum of all pot allocations
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Unallocated
            </CardTitle>
            {unallocated >= 0 ? (
              <ArrowUpRight className="h-4 w-4 text-emerald-400" />
            ) : (
              <ArrowDownRight className="h-4 w-4 text-red-400" />
            )}
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                unallocated >= 0 ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {formatCurrency(Math.abs(unallocated))}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {unallocated >= 0
                ? "Savings not yet assigned to a pot"
                : "You've allocated more than your balance"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Allocation bar — visual breakdown */}
      {pots.length > 0 && savingsBalance > 0 && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Allocation breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-6 bg-secondary rounded-full overflow-hidden flex">
              {pots.map((pot) => {
                const allocated = pot.allocated ? parseFloat(pot.allocated) : 0
                const pct = savingsBalance > 0 ? (allocated / savingsBalance) * 100 : 0
                if (pct <= 0) return null
                return (
                  <div
                    key={pot.id}
                    className="h-full transition-all relative group"
                    style={{
                      width: `${Math.min(pct, 100)}%`,
                      backgroundColor: pot.colour || "#3b82f6",
                    }}
                    title={`${pot.name}: ${formatCurrency(allocated)}`}
                  >
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[10px] font-bold text-white drop-shadow">
                        {pct.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                )
              })}
              {unallocated > 0 && (
                <div
                  className="h-full bg-gray-300"
                  style={{
                    width: `${(unallocated / savingsBalance) * 100}%`,
                  }}
                  title={`Unallocated: ${formatCurrency(unallocated)}`}
                />
              )}
            </div>
            <div className="flex flex-wrap gap-3 mt-3">
              {pots.map((pot) => {
                const allocated = pot.allocated ? parseFloat(pot.allocated) : 0
                if (allocated <= 0) return null
                return (
                  <div key={pot.id} className="flex items-center gap-1.5 text-xs">
                    <div
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: pot.colour || "#3b82f6" }}
                    />
                    <span className="text-muted-foreground">{pot.name}</span>
                  </div>
                )
              })}
              {unallocated > 0 && (
                <div className="flex items-center gap-1.5 text-xs">
                  <div className="h-2.5 w-2.5 rounded-full bg-gray-300" />
                  <span className="text-muted-foreground">Unallocated</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Forecast panel */}
      {forecast && parseFloat(forecast.total_monthly) > 0 && (
        <Card className="bg-slate-800/50 border-slate-700" data-tutorial="savings-forecast">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Savings forecast
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowForecast(!showForecast)}
            >
              {showForecast ? "Hide details" : "Show details"}
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="text-center p-3 rounded-lg bg-secondary/50">
                <p className="text-xs text-muted-foreground mb-1">Monthly contributions</p>
                <p className="text-lg font-bold text-primary">
                  {formatCurrency(forecast.total_monthly)}
                </p>
              </div>
              <div className="text-center p-3 rounded-lg bg-secondary/50">
                <p className="text-xs text-muted-foreground mb-1">Projected in 3 months</p>
                <p className="text-lg font-bold">
                  {formatCurrency(forecast.projected_total_3mo)}
                </p>
              </div>
              <div className="text-center p-3 rounded-lg bg-secondary/50">
                <p className="text-xs text-muted-foreground mb-1">Projected in 6 months</p>
                <p className="text-lg font-bold">
                  {formatCurrency(forecast.projected_total_6mo)}
                </p>
              </div>
              <div className="text-center p-3 rounded-lg bg-secondary/50">
                <p className="text-xs text-muted-foreground mb-1">Projected in 12 months</p>
                <p className="text-lg font-bold text-emerald-600">
                  {formatCurrency(forecast.projected_total_12mo)}
                </p>
              </div>
            </div>

            {showForecast && (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-secondary/30">
                      <th className="text-left p-3 font-medium">Pot</th>
                      <th className="text-right p-3 font-medium">Current</th>
                      <th className="text-right p-3 font-medium">Contribution</th>
                      <th className="text-right p-3 font-medium">3 months</th>
                      <th className="text-right p-3 font-medium">6 months</th>
                      <th className="text-right p-3 font-medium">12 months</th>
                      <th className="text-right p-3 font-medium">Target date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {forecast.pots.map((f) => (
                      <tr key={f.pot_id} className="border-b last:border-0">
                        <td className="p-3 font-medium">{f.pot_name}</td>
                        <td className="p-3 text-right">{formatCurrency(f.allocated)}</td>
                        <td className="p-3 text-right">
                          {f.contribution
                            ? `${formatCurrency(f.contribution)}/${f.contribution_period?.slice(0, 2) ?? "mo"}`
                            : "—"}
                        </td>
                        <td className="p-3 text-right">{formatCurrency(f.projections[0])}</td>
                        <td className="p-3 text-right">{formatCurrency(f.projections[1])}</td>
                        <td className="p-3 text-right font-medium text-emerald-600">
                          {formatCurrency(f.projections[2])}
                        </td>
                        <td className="p-3 text-right">
                          {f.target_date ? (
                            <span className="flex items-center justify-end gap-1 text-xs">
                              <Calendar className="h-3 w-3" />
                              {new Date(f.target_date).toLocaleDateString("en-ZA", {
                                year: "numeric",
                                month: "short",
                              })}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* New pot form */}
      {showPotForm && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle>New savings pot</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleCreatePot}
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
            >
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Name</label>
                <Input
                  placeholder="e.g. Emergency fund"
                  value={potForm.name}
                  onChange={(e) =>
                    setPotForm({ ...potForm, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">
                  Target amount (optional)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={potForm.target}
                  onChange={(e) =>
                    setPotForm({ ...potForm, target: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Colour</label>
                <div className="flex gap-1.5 flex-wrap">
                  {COLOUR_OPTIONS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      className={`h-7 w-7 rounded-full border-2 transition-all ${
                        potForm.colour === c.value
                          ? "border-foreground scale-110"
                          : "border-transparent"
                      }`}
                      style={{ backgroundColor: c.value }}
                      onClick={() =>
                        setPotForm({ ...potForm, colour: c.value })
                      }
                      title={c.label}
                    />
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">
                  Contribution (optional)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={potForm.contribution}
                  onChange={(e) =>
                    setPotForm({ ...potForm, contribution: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">
                  Contribution period
                </label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  value={potForm.contribution_period}
                  onChange={(e) =>
                    setPotForm({ ...potForm, contribution_period: e.target.value })
                  }
                >
                  <option value="weekly">Weekly</option>
                  <option value="fortnightly">Fortnightly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Icon (emoji)</label>
                <Input
                  placeholder="e.g. 🏦"
                  value={potForm.icon}
                  onChange={(e) =>
                    setPotForm({ ...potForm, icon: e.target.value })
                  }
                  maxLength={4}
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-4 flex gap-2">
                <Button type="submit">Save pot</Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPotForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Savings pots grid */}
      {pots.length === 0 ? (
        <div className="text-center py-16">
          <Landmark className="h-12 w-12 mx-auto text-slate-500 mb-4" />
          <h2 className="text-lg font-semibold mb-1 text-slate-100">No savings pots yet</h2>
          <p className="text-slate-400 text-sm">
            Create pots to break your savings into categories.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {pots.map((pot) => {
            const allocated = pot.allocated ? parseFloat(pot.allocated) : 0
            const target = pot.target ? parseFloat(pot.target) : null
            const progressPct =
              target && target > 0
                ? Math.min((allocated / target) * 100, 100)
                : null
            const potAllocations = allocations.filter(
              (a) => a.savings_pot_id === pot.id
            )
            const potForecast = forecast?.pots.find((f) => f.pot_id === pot.id)

            return (
              <Card key={pot.id} className="bg-slate-800/50 border-slate-700">
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-9 w-9 rounded-full flex items-center justify-center text-sm text-white font-bold"
                      style={{
                        backgroundColor: pot.colour || "#3b82f6",
                      }}
                    >
                      {pot.icon || pot.name[0]}
                    </div>
                    <div>
                      <CardTitle className="text-base">{pot.name}</CardTitle>
                      {target !== null && (
                        <p className="text-xs text-slate-400">
                          Target: {formatCurrency(target)}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-slate-400 hover:text-red-400 -mt-1"
                    onClick={() => handleDeletePot(pot.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-2xl font-bold">
                    {formatCurrency(allocated)}
                  </div>

                  {/* Progress to target */}
                  {progressPct !== null && (
                    <div className="space-y-1">
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${progressPct}%`,
                            backgroundColor: pot.colour || "#3b82f6",
                          }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {progressPct.toFixed(0)}% of target
                      </p>
                    </div>
                  )}

                  {/* Contribution & forecast info */}
                  {potForecast?.contribution && (
                    <div className="rounded-md bg-secondary/50 p-2.5 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Contribution</span>
                        <span className="font-medium">
                          {formatCurrency(potForecast.contribution)}/{potForecast.contribution_period?.slice(0, 2) ?? "mo"}
                        </span>
                      </div>
                      {potForecast.months_to_target != null && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Target reached in</span>
                          <span className="font-medium text-emerald-600 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {potForecast.months_to_target} month{potForecast.months_to_target !== 1 ? "s" : ""}
                          </span>
                        </div>
                      )}
                      {potForecast.target_date && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Estimated date</span>
                          <span className="font-medium">
                            {new Date(potForecast.target_date).toLocaleDateString("en-ZA", {
                              year: "numeric",
                              month: "short",
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Allocation actions */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setAllocatingPotID(
                          allocatingPotID === pot.id ? null : pot.id
                        )
                        setAllocForm({
                          amount: "",
                          notes: "",
                          isWithdrawal: false,
                        })
                      }}
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Allocate
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        setViewingPotID(
                          viewingPotID === pot.id ? null : pot.id
                        )
                      }
                    >
                      {viewingPotID === pot.id ? "Hide" : "History"}
                    </Button>
                  </div>

                  {/* Inline allocation form */}
                  {allocatingPotID === pot.id && (
                    <form
                      onSubmit={handleCreateAllocation}
                      className="space-y-2 pt-2 border-t"
                    >
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant={
                            !allocForm.isWithdrawal ? "default" : "outline"
                          }
                          onClick={() =>
                            setAllocForm({
                              ...allocForm,
                              isWithdrawal: false,
                            })
                          }
                        >
                          Deposit
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={
                            allocForm.isWithdrawal ? "default" : "outline"
                          }
                          onClick={() =>
                            setAllocForm({
                              ...allocForm,
                              isWithdrawal: true,
                            })
                          }
                        >
                          Withdraw
                        </Button>
                      </div>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Amount"
                        value={allocForm.amount}
                        onChange={(e) =>
                          setAllocForm({
                            ...allocForm,
                            amount: e.target.value,
                          })
                        }
                        required
                      />
                      <Input
                        placeholder="Notes (optional)"
                        value={allocForm.notes}
                        onChange={(e) =>
                          setAllocForm({
                            ...allocForm,
                            notes: e.target.value,
                          })
                        }
                      />
                      <div className="flex gap-2">
                        <Button type="submit" size="sm">
                          Save
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setAllocatingPotID(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  )}

                  {/* Allocation history */}
                  {viewingPotID === pot.id && (
                    <div className="pt-2 border-t space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">
                        Recent allocations
                      </p>
                      {potAllocations.length === 0 ? (
                        <p className="text-xs text-muted-foreground">
                          No allocations yet
                        </p>
                      ) : (
                        potAllocations.slice(0, 5).map((alloc) => {
                          const amt = parseFloat(alloc.amount)
                          const isDeposit = amt >= 0
                          return (
                            <div
                              key={alloc.id}
                              className="flex items-center justify-between text-sm"
                            >
                              <div className="flex items-center gap-1.5">
                                {isDeposit ? (
                                  <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                                ) : (
                                  <ArrowDownRight className="h-3 w-3 text-red-500" />
                                )}
                                <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                                  {alloc.notes || (isDeposit ? "Deposit" : "Withdrawal")}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span
                                  className={`text-xs font-medium ${
                                    isDeposit
                                      ? "text-emerald-600"
                                      : "text-red-600"
                                  }`}
                                >
                                  {isDeposit ? "+" : ""}
                                  {formatCurrency(amt)}
                                </span>
                                <button
                                  className="text-muted-foreground hover:text-destructive"
                                  onClick={() =>
                                    handleDeleteAllocation(alloc.id)
                                  }
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
