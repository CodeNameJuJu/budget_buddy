import { useEffect, useState } from "react"
import { Target, Calendar, TrendingUp, ChevronDown, ChevronUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { dashboardApi } from "@/lib/api"
import { formatCurrency, formatDate } from "@/lib/utils"
import { useTheme } from "@/contexts/ThemeContext"
import { cn } from "@/lib/utils"

interface GoalsOverviewWidgetProps {
  accountId: number
  size?: string
}

interface GoalData {
  id: number
  name: string
  current_amount: string
  target_amount: string
  progress: number
  deadline?: string
  monthly_contribution: string
}

interface GoalsOverviewData {
  goals: GoalData[]
  count: number
}

export default function GoalsOverviewWidget({ accountId, size }: GoalsOverviewWidgetProps) {
  const [data, setData] = useState<GoalsOverviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isExpanded, setIsExpanded] = useState(false)
  const { theme } = useTheme()

  useEffect(() => {
    loadData()
  }, [accountId])

  async function loadData() {
    try {
      const response = await dashboardApi.getWidgetData(accountId, "goals_overview")
      setData(response.data)
    } catch (error) {
      console.error("Failed to load goals overview widget data", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className={cn(
        "h-full border",
        theme === "light" ? "bg-[#E8DCC5]/50 border-[#E6E0D6]" : "bg-[#18231D]/50 border-[#2E3B35]"
      )}>
        <CardHeader className="pb-2">
          <CardTitle className={cn("text-sm font-medium flex items-center gap-2", theme === "light" ? "text-[#1F2A24]" : "text-[#E7EFEA]")}>
            <Target className="h-4 w-4" />
            Savings Goals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className={cn("animate-pulse h-4 w-24 rounded", theme === "light" ? "bg-[#E6E0D6]" : "bg-[#2E3B35]")}></div>
                  <div className={cn("animate-pulse h-4 w-12 rounded", theme === "light" ? "bg-[#E6E0D6]" : "bg-[#2E3B35]")}></div>
                </div>
                <div className={cn("animate-pulse h-2 w-full rounded", theme === "light" ? "bg-[#E6E0D6]" : "bg-[#2E3B35]")}></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data || !data.goals || data.goals.length === 0) {
    return (
      <Card className={cn(
        "h-full border",
        theme === "light" ? "bg-[#E8DCC5]/50 border-[#E6E0D6]" : "bg-[#18231D]/50 border-[#2E3B35]"
      )}>
        <CardHeader className="pb-2">
          <CardTitle className={cn("text-sm font-medium flex items-center gap-2", theme === "light" ? "text-[#1F2A24]" : "text-[#E7EFEA]")}>
            <Target className="h-4 w-4" />
            Savings Goals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={cn("text-center py-8", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>
            <Target className={cn("h-8 w-8 mx-auto mb-2 opacity-50", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")} />
            <p className="text-sm mb-2">No active goals</p>
            <p className="text-xs">Set savings goals to track your progress</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const defaultDisplayCount = size === "small" ? 2 : size === "large" ? 6 : 4
  const displayCount = isExpanded ? data.goals.length : defaultDisplayCount
  const goals = data.goals.slice(0, displayCount)
  const hasMore = data.count > defaultDisplayCount

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className={cn("text-sm font-medium flex items-center justify-between", theme === "light" ? "text-[#1F2A24]" : "text-[#E7EFEA]")}>
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Savings Goals
            <Badge variant="secondary" className="text-xs">
              {data.count}
            </Badge>
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
                  Show All ({data.count})
                </>
              )}
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden flex flex-col">
        <div className="space-y-3 flex-1 overflow-auto">
          {goals.map((goal) => {
            const progress = Math.min(goal.progress, 100)
            const isCompleted = goal.progress >= 100
            const current = parseFloat(goal.current_amount)
            const target = parseFloat(goal.target_amount)
            const remaining = target - current
            
            return (
              <div key={goal.id} className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-sm font-medium truncate">
                      {goal.name}
                    </span>
                    {isCompleted && (
                      <Badge variant="default" className="text-xs">
                        Done
                      </Badge>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {formatCurrency(goal.current_amount)}
                    </div>
                    <div className={cn("text-xs", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>
                      of {formatCurrency(goal.target_amount)}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <Progress 
                    value={progress} 
                    className="h-2"
                  />
                  <div className={cn("flex items-center justify-between text-xs", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>
                    <div className="flex items-center gap-1">
                      {goal.deadline && (
                        <>
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(goal.deadline)}</span>
                        </>
                      )}
                    </div>
                    <span className={cn(
                      "font-medium",
                      isCompleted
                        ? (theme === "light" ? "text-[#6BAF92]" : "text-[#A8D5BA]")
                        : (theme === "light" ? "text-[#6BAF92]" : "text-[#A8D5BA]")
                    )}>
                      {progress.toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
          
          {!isExpanded && hasMore && (
            <div className="text-center pt-2">
              <p className={cn("text-xs", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>
                {data.count - defaultDisplayCount} more goals
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
