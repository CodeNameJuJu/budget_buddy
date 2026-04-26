import { useState, useEffect } from "react"
import { Plus, Sparkles, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { transactionsApi, type Transaction } from "@/lib/api"
import { formatCurrency } from "@/lib/utils"

interface QuickAddTransactionProps {
  onTransactionAdded: (transaction: Transaction) => void
}

export default function QuickAddTransaction({ onTransactionAdded }: QuickAddTransactionProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [suggestedCategory, setSuggestedCategory] = useState<any>(null)

  // Removed smart categorization for now

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || !description) return

    setIsSubmitting(true)
    try {
      const response = await transactionsApi.create({
        account_id: 1, // Default account for now
        amount,
        description,
        date: new Date().toISOString().split('T')[0],
        notes: notes || undefined,
        type: amount.startsWith('-') ? 'expense' : 'income',
      })

      onTransactionAdded(response.data)
      
      // Reset form
      setAmount("")
      setDescription("")
      setNotes("")
      setSuggestedCategory(null)
      setShowAdvanced(false)
      setIsOpen(false)
    } catch (error) {
      console.error("Failed to create transaction:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getTransactionType = () => {
    const num = parseFloat(amount)
    if (isNaN(num)) return "expense"
    return num >= 0 ? "income" : "expense"
  }

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="w-full"
        size="lg"
      >
        <Plus className="h-4 w-4 mr-2" />
        Quick Add Transaction
      </Button>
    )
  }

  return (
    <Card className="border-2 border-dashed border-emerald-800/50 bg-slate-800/30">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-400" />
              <h3 className="font-semibold text-slate-100">Quick Add Transaction</h3>
              {suggestedCategory && (
                <Badge variant="secondary" className="text-xs bg-emerald-800/30 text-emerald-300 border border-emerald-700/50">
                  Auto-categorized as {suggestedCategory.category}
                </Badge>
              )}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Amount</label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="text-lg font-semibold"
                autoFocus
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Description</label>
              <Input
                placeholder="e.g. Grocery shopping at Woolworths"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-slate-400"
            >
              {showAdvanced ? (
                <ChevronUp className="h-4 w-4 mr-1" />
              ) : (
                <ChevronDown className="h-4 w-4 mr-1" />
              )}
              {showAdvanced ? "Hide" : "Show"} options
            </Button>
            
            {amount && (
              <Badge variant={getTransactionType() === "income" ? "secondary" : "destructive"} className={getTransactionType() === "income" ? "bg-teal-800/30 text-teal-300 border border-teal-700/50" : "bg-red-800/30 text-red-300 border border-red-700/50"}>
                {getTransactionType() === "income" ? "Income" : "Expense"}
              </Badge>
            )}
          </div>

          {showAdvanced && (
            <div className="space-y-4 pt-4 border-t">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Notes (optional)</label>
                <Input
                  placeholder="Additional notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button 
              type="submit" 
              disabled={!amount || !description || isSubmitting}
              className="flex-1 sm:flex-none"
            >
              {isSubmitting ? "Adding..." : "Add Transaction"}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
