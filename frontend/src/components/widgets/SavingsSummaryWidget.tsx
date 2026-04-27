import { useEffect, useState } from "react"
import { PiggyBank, TrendingUp, Target, Calendar, ChevronDown, ChevronUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { dashboardApi } from "@/lib/api"
import { formatCurrency, formatDate } from "@/lib/utils"
import { useTheme } from "@/contexts/ThemeContext"
import { cn } from "@/lib/utils"

interface SavingsSummaryWidgetProps {
  accountId: number
  size?: string
}

interface PotData {
  id: number
  name: string
  allocated: string
  target: string
  colour: string
}

interface SavingsSummaryData {
  total_balance: string
  total_allocated: string
  unallocated: string
  pots: PotData[]
  monthly_contribution: string
}

export default function SavingsSummaryWidget({ accountId, size }: SavingsSummaryWidgetProps) {
  const [data, setData] = useState<SavingsSummaryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isExpanded, setIsExpanded] = useState(false)
  const { theme } = useTheme()

  useEffect(() => {
    loadData()
  }, [accountId])

  async function loadData() {
    try {
      const response = await dashboardApi.getWidgetData(accountId, "savings_summary")
      setData(response.data)
    } catch (error) {
      console.error("Failed to load savings summary widget data", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <PiggyBank className="h-4 w-4" />
            Savings Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="animate-pulse bg-muted h-8 w-32 rounded"></div>
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="animate-pulse bg-muted h-4 w-20 rounded"></div>
                    <div className="animate-pulse bg-muted h-4 w-12 rounded"></div>
                  </div>
                  <div className="animate-pulse bg-muted h-2 w-full rounded"></div>
                </div>
              ))}
            </div>
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
            <PiggyBank className="h-4 w-4" />
            Savings Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <PiggyBank className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm mb-2">Unable to load savings data</p>
            <p className="text-xs">Please check your connection</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const balance = parseFloat(data.total_balance)
  const allocated = parseFloat(data.total_allocated)
  const unallocated = parseFloat(data.unallocated)
  const defaultDisplayCount = size === "small" ? 2 : size === "large" ? 6 : 4
  const displayCount = isExpanded ? data.pots.length : defaultDisplayCount
  const pots = data.pots.slice(0, displayCount)
  const hasMore = data.pots.length > defaultDisplayCount

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PiggyBank className="h-4 w-4" />
            Savings Summary
          </div>
          {hasMore && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-6 px-2 text-xs"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-3 w-3 mr-1" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3 mr-1" />
                  Show All ({data.pots.length})
                </>
              )}
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden flex flex-col">
        <div className="space-y-4 flex-1 overflow-auto">
          {/* Balance Overview */}
          <div className="grid grid-cols-3 gap-2">
            <div className={cn(
              "text-center p-2 rounded-lg border",
              theme === "light"
                ? "bg-white/50 border-[#E6E0D6]"
                : "bg-[#18231D]/50 border-[#2E3B35]"
            )}>
              <div className="text-xs text-muted-foreground mb-1 truncate">Balance</div>
              <div className={cn(
                "text-sm font-bold truncate",
                theme === "light" ? "text-[#6BAF92]" : "text-[#A8D5BA]"
              )}>{formatCurrency(data.total_balance)}</div>
            </div>
            <div className={cn(
              "text-center p-2 rounded-lg border",
              theme === "light"
                ? "bg-white/50 border-[#E6E0D6]"
                : "bg-[#18231D]/50 border-[#2E3B35]"
            )}>
              <div className="text-xs text-muted-foreground mb-1 truncate">Allocated</div>
              <div className="text-sm font-bold text-blue-400 truncate">{formatCurrency(data.total_allocated)}</div>
            </div>
            <div className={cn(
              "text-center p-2 rounded-lg border",
              theme === "light"
                ? "bg-white/50 border-[#E6E0D6]"
                : "bg-[#18231D]/50 border-[#2E3B35]"
            )}>
              <div className="text-xs text-muted-foreground mb-1 truncate">Available</div>
              <div className={cn(
                "text-sm font-bold truncate",
                unallocated >= 0 ? (theme === "light" ? "text-[#6BAF92]" : "text-[#A8D5BA]") : "text-red-400"
              )}>
                {formatCurrency(Math.abs(unallocated))}
              </div>
            </div>
          </div>

          {/* Monthly Contribution */}
          {data.monthly_contribution && (
            <div className={cn(
              "p-3 rounded-lg border",
              theme === "light"
                ? "bg-[#6BAF92]/10 border-[#6BAF92]/20"
                : "bg-[#6BAF92]/10 border-[#6BAF92]/20"
            )}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className={cn(
                    "h-4 w-4",
                    theme === "light" ? "text-[#6BAF92]" : "text-[#A8D5BA]"
                  )} />
                  <span className={cn(
                    "text-sm",
                    theme === "light" ? "text-[#6BAF92]" : "text-[#A8D5BA]"
                  )}>Monthly Contribution</span>
                </div>
                <div className={cn(
                  "text-sm font-bold",
                  theme === "light" ? "text-[#6BAF92]" : "text-[#A8D5BA]"
                )}>
                  {formatCurrency(data.monthly_contribution)}
                </div>
              </div>
            </div>
          )}

          {/* Pots */}
          <div className="space-y-3">
            {pots.map((pot) => {
              const potAllocated = parseFloat(pot.allocated)
              const potTarget = parseFloat(pot.target)
              const progress = potTarget > 0 ? (potAllocated / potTarget) * 100 : 0

              return (
                <div key={pot.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: pot.colour || '#3b82f6' }}
                      />
                      <span className="text-sm font-medium truncate max-w-[100px]">{pot.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{formatCurrency(pot.allocated)}</div>
                      {potTarget && (
                        <div className="text-xs text-muted-foreground">
                          of {formatCurrency(pot.target)}
                        </div>
                      )}
                    </div>
                  </div>
                  {potTarget > 0 && (
                    <div className="space-y-1">
                      <Progress value={Math.min(progress, 100)} className="h-2" />
                      <div className="text-xs text-muted-foreground text-right">
                        {progress.toFixed(0)}%
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
            
            {!isExpanded && hasMore && (
              <div className="text-center pt-2">
                <p className="text-xs text-muted-foreground">
                  {data.pots.length - defaultDisplayCount} more pots
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
