import { useEffect, useState } from "react"
import { Wallet, TrendingUp, TrendingDown } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { dashboardApi } from "@/lib/api"
import { formatCurrency } from "@/lib/utils"
import { useTheme } from "@/contexts/ThemeContext"
import { cn } from "@/lib/utils"

interface BalanceWidgetProps {
  accountId: number
}

interface BalanceData {
  balance: string
  income: string
  expenses: string
  period: string
}

export default function BalanceWidget({ accountId }: BalanceWidgetProps) {
  const [data, setData] = useState<BalanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const { theme } = useTheme()

  useEffect(() => {
    loadData()
  }, [accountId])

  async function loadData() {
    try {
      const response = await dashboardApi.getWidgetData(accountId, "balance")
      setData(response.data)
    } catch (error) {
      console.error("Failed to load balance widget data", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Account Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-20 flex items-center justify-center">
            <div className="animate-pulse bg-muted h-8 w-24 rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Account Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <Wallet className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm mb-2">Unable to load balance</p>
            <p className="text-xs">Please check your connection and try again</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const balance = parseFloat(data.balance)
  const isPositive = balance >= 0

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Wallet className="h-4 w-4" />
          Account Balance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-center py-2">
            <div className={cn(
              "text-3xl font-bold",
              isPositive ? (theme === "light" ? "text-[#9EC489]" : "text-[#B8D5A8]") : "text-red-400"
            )}>
              {isPositive ? '+' : ''}{formatCurrency(data.balance)}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className={cn(
              "flex flex-col items-center gap-1 p-2 rounded-lg border",
              theme === "light"
                ? "bg-[#9EC489]/10 border-[#9EC489]/20"
                : "bg-[#9EC489]/10 border-[#9EC489]/20"
            )}>
              <div className={cn(
                "flex items-center gap-1",
                theme === "light" ? "text-[#9EC489]" : "text-[#B8D5A8]"
              )}>
                <TrendingUp className="h-3 w-3" />
                <span className="text-xs">Income</span>
              </div>
              <span className={cn(
                "font-semibold",
                theme === "light" ? "text-[#9EC489]" : "text-[#B8D5A8]"
              )}>{formatCurrency(data.income)}</span>
            </div>
            <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
              <div className="flex items-center gap-1 text-red-400">
                <TrendingDown className="h-3 w-3" />
                <span className="text-xs">Expenses</span>
              </div>
              <span className="font-semibold text-red-400">{formatCurrency(data.expenses)}</span>
            </div>
          </div>
          
          <div className={cn(
            "text-center text-xs",
            theme === "light" ? "text-[#5A6B55]" : "text-[#B8B3A8]"
          )}>
            {data.period}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
