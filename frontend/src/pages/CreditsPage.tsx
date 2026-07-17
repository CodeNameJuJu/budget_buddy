import { useState, useEffect } from "react"
import {
  Plus,
  Trash2,
  CreditCard,
  TrendingDown,
  Check,
  ArrowDownRight,
  Calendar,
  Pencil,
  Edit2,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { creditsApi, accountsApi, transactionsApi, type CreditSummary, type CreditPot, type CreditPayment, type CreditForecastResponse, type Transaction } from "@/lib/api"
import { formatCurrency } from "@/lib/utils"
import { useTheme } from "@/contexts/ThemeContext"
import { cn } from "@/lib/utils"

const COLOUR_OPTIONS = [
  { label: "Primary Green", value: "#6BAF92" },
  { label: "Light Green", value: "#88B39B" },
  { label: "Accent Gold", value: "#D9B44A" },
  { label: "Warning", value: "#C97C5D" },
  { label: "Muted", value: "#6C7A73" },
  { label: "Dark Muted", value: "#ABA9A2" },
  { label: "Border", value: "#E6E0D6" },
  { label: "Dark Border", value: "#38352F" },
]

export default function CreditsPage() {
  const { theme } = useTheme()
  const [accountId, setAccountId] = useState<number | null>(null)
  const [summary, setSummary] = useState<CreditSummary | null>(null)
  const [payments, setPayments] = useState<CreditPayment[]>([])
  const [forecast, setForecast] = useState<CreditForecastResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForecast, setShowForecast] = useState(false)

  // New pot form
  const [showPotForm, setShowPotForm] = useState(false)
  const [editingPot, setEditingPot] = useState<CreditPot | null>(null)
  const [potForm, setPotForm] = useState({
    name: "",
    icon: "",
    colour: "#C97C5D",
    total_payable: "",
    monthly_payment: "",
    payment_period: "monthly",
    interest_rate: "",
    interest_period: "annually",
  })

  // Payment form — tracked per pot
  const [payingPotID, setPayingPotID] = useState<number | null>(null)
  const [payForm, setPayForm] = useState({
    amount: "",
    notes: "",
  })

  // Payment history view
  const [viewingPotID, setViewingPotID] = useState<number | null>(null)

  // Transactions view
  const [viewingTransactionsPotID, setViewingTransactionsPotID] = useState<number | null>(null)
  const [potTransactions, setPotTransactions] = useState<Transaction[]>([])
  const [loadingTransactions, setLoadingTransactions] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<{ type: 'pot' | 'payment', id: number } | null>(null)

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
      const [summaryRes, payRes, forecastRes] = await Promise.all([
        creditsApi.summary(accountId),
        creditsApi.listPayments(accountId),
        creditsApi.forecast(accountId),
      ])
      setSummary(summaryRes.data)
      setPayments(payRes.data || [])
      setForecast(forecastRes.data)
    } catch {
      console.error("Failed to load credits data")
    } finally {
      setLoading(false)
    }
  }

  async function handleCreatePot(e: React.FormEvent) {
    e.preventDefault()
    if (!accountId) return
    
    if (editingPot) {
      await handleEditPotSubmit(e)
      return
    }
    
    try {
      await creditsApi.createPot({
        account_id: accountId,
        name: potForm.name,
        icon: potForm.icon || undefined,
        colour: potForm.colour || undefined,
        total_payable: potForm.total_payable,
        monthly_payment: potForm.monthly_payment || undefined,
        payment_period: potForm.monthly_payment ? potForm.payment_period : undefined,
        interest_rate: potForm.interest_rate || undefined,
        interest_period: potForm.interest_rate ? potForm.interest_period : undefined,
      })
      setPotForm({ name: "", icon: "", colour: "#C97C5D", total_payable: "", monthly_payment: "", payment_period: "monthly", interest_rate: "", interest_period: "annually" })
      setShowPotForm(false)
      loadData()
    } catch {
      console.error("Failed to create credit pot")
    }
  }

  function handleDeletePotClick(id: number) {
    setItemToDelete({ type: 'pot', id })
    setDeleteDialogOpen(true)
  }

  async function handleDeletePotConfirm() {
    if (!itemToDelete || itemToDelete.type !== 'pot') return
    try {
      await creditsApi.deletePot(itemToDelete.id)
      loadData()
    } catch {
      console.error("Failed to delete credit pot")
    }
  }

  function handleEditPotClick(pot: CreditPot) {
    setEditingPot(pot)
    setPotForm({
      name: pot.name,
      icon: pot.icon || "",
      colour: pot.colour || "#C97C5D",
      total_payable: pot.total_payable,
      monthly_payment: pot.monthly_payment || "",
      payment_period: pot.payment_period || "monthly",
      interest_rate: pot.interest_rate || "",
      interest_period: pot.interest_period || "annually",
    })
    setShowPotForm(true)
  }

  async function handleEditPotSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!accountId || !editingPot) return
    
    try {
      await creditsApi.updatePot(editingPot.id, {
        name: potForm.name,
        icon: potForm.icon || undefined,
        colour: potForm.colour || undefined,
        total_payable: potForm.total_payable,
        monthly_payment: potForm.monthly_payment || undefined,
        payment_period: potForm.monthly_payment ? potForm.payment_period : undefined,
        interest_rate: potForm.interest_rate || undefined,
        interest_period: potForm.interest_rate ? potForm.interest_period : undefined,
      })
      setEditingPot(null)
      setPotForm({ name: "", icon: "", colour: "#C97C5D", total_payable: "", monthly_payment: "", payment_period: "monthly", interest_rate: "", interest_period: "annually" })
      setShowPotForm(false)
      loadData()
    } catch {
      console.error("Failed to update credit pot")
    }
  }

  async function handleCreatePayment(e: React.FormEvent) {
    e.preventDefault()
    if (!payingPotID) return
    try {
      await creditsApi.createPayment({
        account_id: accountId!,
        credit_pot_id: payingPotID,
        amount: payForm.amount,
        notes: payForm.notes || undefined,
      })
      setPayForm({ amount: "", notes: "" })
      setPayingPotID(null)
      loadData()
    } catch {
      console.error("Failed to create payment")
    }
  }

  function handleDeletePaymentClick(id: number) {
    setItemToDelete({ type: 'payment', id })
    setDeleteDialogOpen(true)
  }

  async function handleDeletePaymentConfirm() {
    if (!itemToDelete || itemToDelete.type !== 'payment') return
    try {
      await creditsApi.deletePayment(itemToDelete.id)
      loadData()
    } catch {
      console.error("Failed to delete payment")
    }
  }

  async function handleDeleteConfirm() {
    if (!itemToDelete) return
    if (itemToDelete.type === 'pot') {
      await handleDeletePotConfirm()
    } else if (itemToDelete.type === 'payment') {
      await handleDeletePaymentConfirm()
    }
  }

  async function loadPotTransactions(potID: number) {
    setLoadingTransactions(true)
    try {
      const response = await transactionsApi.getByCreditPot(potID)
      setPotTransactions(response.data || [])
    } catch {
      console.error("Failed to load pot transactions")
    } finally {
      setLoadingTransactions(false)
    }
  }

  function handleViewTransactions(potID: number) {
    if (viewingTransactionsPotID === potID) {
      setViewingTransactionsPotID(null)
      setPotTransactions([])
    } else {
      setViewingTransactionsPotID(potID)
      loadPotTransactions(potID)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className={theme === "light" ? "text-[#6C7A73]" : "text-[#ABA9A2]"}>Loading credits...</p>
      </div>
    )
  }

  const totalPayable = summary ? parseFloat(summary.total_payable) : 0
  const totalPaid = summary ? parseFloat(summary.total_paid) : 0
  const remaining = summary ? parseFloat(summary.remaining) : 0
  const pots = summary?.pots || []

  return (
    <>
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={cn(
            "text-2xl font-bold tracking-tight",
            theme === "light" ? "text-[#1F2A24]" : "text-[#EDEBE6]"
          )}>Credits</h1>
          <p className={theme === "light" ? "text-[#6C7A73]" : "text-[#ABA9A2]"}>
            Track your credit and debt payoff progress
          </p>
        </div>
        <Button onClick={() => setShowPotForm(!showPotForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Add credit
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className={cn(
          "border",
          theme === "light" ? "bg-[#E8DCC5]/50 border-[#E6E0D6]" : "bg-[#201E1B]/50 border-[#38352F]"
        )}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className={cn("text-sm font-medium", theme === "light" ? "text-[#6C7A73]" : "text-[#ABA9A2]")}>
              Total payable
            </CardTitle>
            <CreditCard className={cn("h-4 w-4", theme === "light" ? "text-[#C97C5D]" : "text-[#C97C5D]")} />
          </CardHeader>
          <CardContent>
            <div className={cn("text-2xl font-bold", theme === "light" ? "text-[#C97C5D]" : "text-[#C97C5D]")}>
              {formatCurrency(totalPayable)}
            </div>
            <p className={cn("text-xs mt-1", theme === "light" ? "text-[#6C7A73]" : "text-[#ABA9A2]")}>
              Total credit debt
            </p>
          </CardContent>
        </Card>

        <Card className={cn(
          "border",
          theme === "light" ? "bg-[#E8DCC5]/50 border-[#E6E0D6]" : "bg-[#201E1B]/50 border-[#38352F]"
        )}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className={cn("text-sm font-medium", theme === "light" ? "text-[#6C7A73]" : "text-[#ABA9A2]")}>
              Total paid
            </CardTitle>
            <TrendingDown className={cn("h-4 w-4", theme === "light" ? "text-[#6BAF92]" : "text-[#88B39B]")} />
          </CardHeader>
          <CardContent>
            <div className={cn("text-2xl font-bold", theme === "light" ? "text-[#6BAF92]" : "text-[#88B39B]")}>
              {formatCurrency(totalPaid)}
            </div>
            <p className={cn("text-xs mt-1", theme === "light" ? "text-[#6C7A73]" : "text-[#ABA9A2]")}>
              Amount paid off
            </p>
          </CardContent>
        </Card>

        <Card className={cn(
          "border",
          theme === "light" ? "bg-[#E8DCC5]/50 border-[#E6E0D6]" : "bg-[#201E1B]/50 border-[#38352F]"
        )}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className={cn("text-sm font-medium", theme === "light" ? "text-[#6C7A73]" : "text-[#ABA9A2]")}>
              Remaining
            </CardTitle>
            <ArrowDownRight className={cn("h-4 w-4", theme === "light" ? "text-[#C97C5D]" : "text-[#C97C5D]")} />
          </CardHeader>
          <CardContent>
            <div className={cn("text-2xl font-bold", theme === "light" ? "text-[#C97C5D]" : "text-[#C97C5D]")}>
              {formatCurrency(remaining)}
            </div>
            <p className={cn("text-xs mt-1", theme === "light" ? "text-[#6C7A73]" : "text-[#ABA9A2]")}>
              Debt still owed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Forecast panel */}
      {forecast && parseFloat(forecast.total_monthly) > 0 && (
        <Card className={cn(
          "border",
          theme === "light" ? "bg-[#E8DCC5]/50 border-[#E6E0D6]" : "bg-[#201E1B]/50 border-[#38352F]"
        )}>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className={cn(
              "flex items-center gap-2",
              theme === "light" ? "text-[#1F2A24]" : "text-[#EDEBE6]"
            )}>
              <TrendingDown className={cn("h-4 w-4", theme === "light" ? "text-[#6BAF92]" : "text-[#88B39B]")} />
              Payoff forecast
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
                <p className="text-xs text-muted-foreground mb-1">Monthly payments</p>
                <p className="text-lg font-bold text-primary">
                  {formatCurrency(forecast.total_monthly)}
                </p>
              </div>
              <div className="text-center p-3 rounded-lg bg-secondary/50">
                <p className="text-xs text-muted-foreground mb-1">Remaining in 3 months</p>
                <p className="text-lg font-bold">
                  {formatCurrency(forecast.projected_total_3mo)}
                </p>
              </div>
              <div className="text-center p-3 rounded-lg bg-secondary/50">
                <p className="text-xs text-muted-foreground mb-1">Remaining in 6 months</p>
                <p className="text-lg font-bold">
                  {formatCurrency(forecast.projected_total_6mo)}
                </p>
              </div>
              <div className="text-center p-3 rounded-lg bg-secondary/50">
                <p className="text-xs text-muted-foreground mb-1">Remaining in 12 months</p>
                <p className={cn("text-lg font-bold", theme === "light" ? "text-[#6BAF92]" : "text-[#88B39B]")}>
                  {formatCurrency(forecast.projected_total_12mo)}
                </p>
              </div>
            </div>

            {showForecast && (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-secondary/30">
                      <th className="text-left p-3 font-medium">Credit</th>
                      <th className="text-right p-3 font-medium">Total</th>
                      <th className="text-right p-3 font-medium">Paid</th>
                      <th className="text-right p-3 font-medium">Payment</th>
                      <th className="text-right p-3 font-medium">3 months</th>
                      <th className="text-right p-3 font-medium">6 months</th>
                      <th className="text-right p-3 font-medium">12 months</th>
                      <th className="text-right p-3 font-medium">Payoff date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {forecast.pots.map((f) => (
                      <tr key={f.pot_id} className="border-b last:border-0">
                        <td className="p-3 font-medium">{f.pot_name}</td>
                        <td className="p-3 text-right">{formatCurrency(f.total_payable)}</td>
                        <td className="p-3 text-right">{formatCurrency(f.paid)}</td>
                        <td className="p-3 text-right">
                          {f.monthly_payment
                            ? `${formatCurrency(f.monthly_payment)}/${f.payment_period?.slice(0, 2) ?? "mo"}`
                            : "—"}
                        </td>
                        <td className="p-3 text-right">{formatCurrency(f.projections[0])}</td>
                        <td className="p-3 text-right">{formatCurrency(f.projections[1])}</td>
                        <td className={cn("p-3 text-right font-medium", theme === "light" ? "text-[#6BAF92]" : "text-[#88B39B]")}>
                          {formatCurrency(f.projections[2])}
                        </td>
                        <td className="p-3 text-right">
                          {f.payoff_date ? (
                            <span className="flex items-center justify-end gap-1 text-xs">
                              <Calendar className="h-3 w-3" />
                              {new Date(f.payoff_date).toLocaleDateString("en-ZA", {
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
        <Card className={cn(
          "border",
          theme === "light" ? "bg-[#E8DCC5]/50 border-[#E6E0D6]" : "bg-[#201E1B]/50 border-[#38352F]"
        )}>
          <CardHeader>
            <CardTitle className={theme === "light" ? "text-[#1F2A24]" : "text-[#EDEBE6]"}>
              {editingPot ? "Edit credit pot" : "New credit pot"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleCreatePot}
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
            >
              <div className="space-y-2">
                <label className={cn("text-sm font-medium", theme === "light" ? "text-[#6C7A73]" : "text-[#ABA9A2]")}>Name</label>
                <Input
                  placeholder="e.g. Credit card"
                  value={potForm.name}
                  onChange={(e) =>
                    setPotForm({ ...potForm, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <label className={cn("text-sm font-medium", theme === "light" ? "text-[#6C7A73]" : "text-[#ABA9A2]")}>
                  Total payable
                </label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={potForm.total_payable}
                  onChange={(e) =>
                    setPotForm({ ...potForm, total_payable: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <label className={cn("text-sm font-medium", theme === "light" ? "text-[#6C7A73]" : "text-[#ABA9A2]")}>Colour</label>
                <div className="flex gap-1.5 flex-wrap items-center">
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
                  <input
                    type="color"
                    value={potForm.colour}
                    onChange={(e) => setPotForm({ ...potForm, colour: e.target.value })}
                    className="h-7 w-7 rounded-full border-2 cursor-pointer overflow-hidden"
                    title="Custom color"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className={cn("text-sm font-medium", theme === "light" ? "text-[#6C7A73]" : "text-[#ABA9A2]")}>
                  Monthly payment (optional)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={potForm.monthly_payment}
                  onChange={(e) =>
                    setPotForm({ ...potForm, monthly_payment: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className={cn("text-sm font-medium", theme === "light" ? "text-[#6C7A73]" : "text-[#ABA9A2]")}>
                  Payment period
                </label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  value={potForm.payment_period}
                  onChange={(e) =>
                    setPotForm({ ...potForm, payment_period: e.target.value })
                  }
                >
                  <option value="weekly">Weekly</option>
                  <option value="fortnightly">Fortnightly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className={cn("text-sm font-medium", theme === "light" ? "text-[#6C7A73]" : "text-[#ABA9A2]")}>Interest rate % (optional)</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={potForm.interest_rate}
                  onChange={(e) =>
                    setPotForm({ ...potForm, interest_rate: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className={cn("text-sm font-medium", theme === "light" ? "text-[#6C7A73]" : "text-[#ABA9A2]")}>Interest period</label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  value={potForm.interest_period}
                  onChange={(e) =>
                    setPotForm({ ...potForm, interest_period: e.target.value })
                  }
                >
                  <option value="monthly">Monthly</option>
                  <option value="annually">Annually</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className={cn("text-sm font-medium", theme === "light" ? "text-[#6C7A73]" : "text-[#ABA9A2]")}>Icon (emoji)</label>
                <Input
                  placeholder="e.g. 💳"
                  value={potForm.icon}
                  onChange={(e) =>
                    setPotForm({ ...potForm, icon: e.target.value })
                  }
                  maxLength={4}
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-4 flex gap-2">
                <Button type="submit">{editingPot ? "Update credit" : "Save credit"}</Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowPotForm(false)
                    setEditingPot(null)
                    setPotForm({ name: "", icon: "", colour: "#C97C5D", total_payable: "", monthly_payment: "", payment_period: "monthly", interest_rate: "", interest_period: "annually" })
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Credit pots grid */}
      {pots.length === 0 ? (
        <div className="text-center py-16">
          <CreditCard className={cn(
            "h-12 w-12 mx-auto mb-4",
            theme === "light" ? "text-[#6C7A73]" : "text-[#ABA9A2]"
          )} />
          <h2 className={cn(
            "text-lg font-semibold mb-1",
            theme === "light" ? "text-[#1F2A24]" : "text-[#EDEBE6]"
          )}>No credit pots yet</h2>
          <p className={cn("text-sm", theme === "light" ? "text-[#6C7A73]" : "text-[#ABA9A2]")}>
            Create credit pots to track your debt payoff progress.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {pots.map((pot) => {
            const paid = pot.paid ? parseFloat(pot.paid) : 0
            const total = parseFloat(pot.total_payable)
            const remaining = total - paid
            const progressPct = total > 0 ? Math.min((paid / total) * 100, 100) : 0
            const potPayments = payments.filter(
              (p) => p.credit_pot_id === pot.id
            )
            const potForecast = forecast?.pots.find((f) => f.pot_id === pot.id)

            return (
              <Card key={pot.id} className={cn(
                "border",
                theme === "light" ? "bg-[#E8DCC5]/50 border-[#E6E0D6]" : "bg-[#201E1B]/50 border-[#38352F]"
              )}>
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-9 w-9 rounded-full flex items-center justify-center text-sm text-white font-bold"
                      style={{
                        backgroundColor: pot.colour || "#C97C5D",
                      }}
                    >
                      {pot.icon || pot.name[0]}
                    </div>
                    <div>
                      <CardTitle className={cn("text-base", theme === "light" ? "text-[#1F2A24]" : "text-[#EDEBE6]")}>{pot.name}</CardTitle>
                      <p className={cn("text-xs", theme === "light" ? "text-[#6C7A73]" : "text-[#ABA9A2]")}>
                        Total: {formatCurrency(total)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(theme === "light" ? "text-[#6C7A73] hover:text-[#1F2A24]" : "text-[#ABA9A2] hover:text-[#EDEBE6]", "-mt-1")}
                      onClick={() => handleEditPotClick(pot)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(theme === "light" ? "text-[#6C7A73] hover:text-red-400" : "text-[#ABA9A2] hover:text-red-400", "-mt-1")}
                      onClick={() => handleDeletePotClick(pot.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className={cn("text-2xl font-bold", theme === "light" ? "text-[#1F2A24]" : "text-[#EDEBE6]")}>
                    {formatCurrency(remaining)}
                  </div>

                  {/* Progress to payoff */}
                  <div className="space-y-1">
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${progressPct}%`,
                          backgroundColor: pot.colour || "#C97C5D",
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {progressPct.toFixed(0)}% paid off
                    </p>
                  </div>

                  {/* Monthly payment & forecast info */}
                  {potForecast?.monthly_payment && (
                    <div className="rounded-md bg-secondary/50 p-2.5 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Monthly payment</span>
                        <span className="font-medium">
                          {formatCurrency(potForecast.monthly_payment)}/{potForecast.payment_period?.slice(0, 2) ?? "mo"}
                        </span>
                      </div>
                      {potForecast.months_to_payoff != null && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Paid off in</span>
                          <span className={cn("font-medium flex items-center gap-1", theme === "light" ? "text-[#6BAF92]" : "text-[#88B39B]")}>
                            <Calendar className="h-3 w-3" />
                            {potForecast.months_to_payoff} month{potForecast.months_to_payoff !== 1 ? "s" : ""}
                          </span>
                        </div>
                      )}
                      {potForecast.payoff_date && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Estimated date</span>
                          <span className="font-medium">
                            {new Date(potForecast.payoff_date).toLocaleDateString("en-ZA", {
                              year: "numeric",
                              month: "short",
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Payment actions */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setPayingPotID(
                          payingPotID === pot.id ? null : pot.id
                        )
                        setPayForm({
                          amount: "",
                          notes: "",
                        })
                      }}
                    >
                      {payingPotID === pot.id ? "Cancel" : "Record payment"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setViewingPotID(
                          viewingPotID === pot.id ? null : pot.id
                        )
                      }}
                    >
                      {viewingPotID === pot.id ? "Hide" : "History"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleViewTransactions(pot.id)}
                    >
                      {viewingTransactionsPotID === pot.id ? "Hide" : "Transactions"}
                    </Button>
                  </div>

                  {/* Payment form */}
                  {payingPotID === pot.id && (
                    <form onSubmit={handleCreatePayment} className="space-y-2 pt-2 border-t">
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Payment amount"
                        value={payForm.amount}
                        onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
                        required
                      />
                      <Input
                        placeholder="Notes (optional)"
                        value={payForm.notes}
                        onChange={(e) => setPayForm({ ...payForm, notes: e.target.value })}
                      />
                      <Button type="submit" className="w-full" size="sm">
                        Record payment
                      </Button>
                    </form>
                  )}

                  {/* Payment history */}
                  {viewingPotID === pot.id && potPayments.length > 0 && (
                    <div className="space-y-2 pt-2 border-t max-h-40 overflow-y-auto">
                      {potPayments.map((payment) => (
                        <div key={payment.id} className="flex items-center justify-between text-xs p-2 rounded bg-secondary/30">
                          <div>
                            <span className="font-medium">{formatCurrency(payment.amount)}</span>
                            {payment.notes && <span className="text-muted-foreground ml-2">- {payment.notes}</span>}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">
                              {new Date(payment.created_date).toLocaleDateString()}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 text-red-400 hover:text-red-500"
                              onClick={() => handleDeletePaymentClick(payment.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Transactions table */}
                  {viewingTransactionsPotID === pot.id && (
                    <div className="pt-2 border-t space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">
                        Transactions
                      </p>
                      {loadingTransactions ? (
                        <p className="text-xs text-muted-foreground">Loading transactions...</p>
                      ) : potTransactions.length === 0 ? (
                        <p className="text-xs text-muted-foreground">No transactions yet</p>
                      ) : (
                        <div className="border rounded-lg overflow-hidden">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="border-b bg-secondary/30">
                                <th className="text-left p-2 font-medium">Date</th>
                                <th className="text-left p-2 font-medium">Description</th>
                                <th className="text-right p-2 font-medium">Amount</th>
                              </tr>
                            </thead>
                            <tbody>
                              {potTransactions.map((txn) => (
                                <tr key={txn.id} className="border-b last:border-0">
                                  <td className="p-2 text-muted-foreground">
                                    {new Date(txn.date).toLocaleDateString()}
                                  </td>
                                  <td className="p-2">
                                    {txn.description || txn.category?.name || "Transaction"}
                                  </td>
                                  <td className={cn(
                                    "p-2 text-right font-medium",
                                    txn.type === "income" ? (theme === "light" ? "text-[#D9B44A]" : "text-[#C9A24A]") : "text-red-400"
                                  )}>
                                    {txn.type === "income" ? "+" : "-"}
                                    {formatCurrency(parseFloat(txn.amount))}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={itemToDelete?.type === 'pot' ? "Delete credit pot" : "Delete payment"}
        description={itemToDelete?.type === 'pot' 
          ? "Are you sure you want to delete this credit pot? This action cannot be undone." 
          : "Are you sure you want to delete this payment? This action cannot be undone."}
        onConfirm={handleDeleteConfirm}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
    </>
  )
}
