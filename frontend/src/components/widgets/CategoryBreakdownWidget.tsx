import { useEffect, useState } from "react"
import { Tag, ChevronDown, ChevronUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { dashboardApi } from "@/lib/api"
import { formatCurrency } from "@/lib/utils"

interface CategoryBreakdownWidgetProps {
  accountId: number
  size?: string
}

interface CategoryData {
  name: string
  amount: string
  percentage: number
}

interface CategoryBreakdownData {
  categories: CategoryData[]
  total_spent: string
  period: string
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

export default function CategoryBreakdownWidget({ accountId, size }: CategoryBreakdownWidgetProps) {
  const [data, setData] = useState<CategoryBreakdownData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    loadData()
  }, [accountId])

  async function loadData() {
    try {
      const response = await dashboardApi.getWidgetData(accountId, "category_breakdown")
      setData(response.data)
    } catch (error) {
      console.error("Failed to load category breakdown widget data", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Category Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="animate-pulse bg-muted h-32 w-full rounded"></div>
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse bg-muted h-4 w-full rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data || !data.categories || data.categories.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Category Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <Tag className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm mb-2">No category data</p>
            <p className="text-xs">Add transactions to see spending by category</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const defaultDisplayCount = size === "small" ? 3 : size === "large" ? 8 : 5
  const displayCount = isExpanded ? data.categories.length : defaultDisplayCount
  const categories = data.categories.slice(0, displayCount)
  const hasMore = data.categories.length > defaultDisplayCount

  const chartData = data.categories.map((cat, index) => ({
    name: cat.name,
    value: parseFloat(cat.amount),
    color: COLORS[index % COLORS.length],
  }))

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Category Breakdown
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
                  Show All ({data.categories.length})
                </>
              )}
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden flex flex-col">
        <div className="space-y-4 flex-1 overflow-auto">
          {/* Simple CSS Pie Chart */}
          <div className="h-32 flex items-center justify-center">
            <div className="relative w-32 h-32 rounded-full" style={{
              background: `conic-gradient(${chartData.map((cat, i) => `${cat.color} 0 ${(cat.value / parseFloat(data.total_spent)) * 100}%`).join(', ')})`
            }}>
              <div className="absolute inset-4 bg-slate-800 rounded-full flex items-center justify-center">
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">Total</div>
                  <div className="text-lg font-bold">{formatCurrency(data.total_spent)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Total Spent */}
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Total Spent</div>
            <div className="text-xl font-bold">{formatCurrency(data.total_spent)}</div>
            <div className="text-xs text-muted-foreground">{data.period}</div>
          </div>

          {/* Category List */}
          <div className="space-y-2">
            {categories.map((category, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-sm">{category.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {category.percentage.toFixed(0)}%
                  </Badge>
                  <span className="text-sm font-medium">{formatCurrency(category.amount)}</span>
                </div>
              </div>
            ))}
            
            {!isExpanded && hasMore && (
              <div className="text-center pt-2">
                <p className="text-xs text-muted-foreground">
                  {data.categories.length - defaultDisplayCount} more categories
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
