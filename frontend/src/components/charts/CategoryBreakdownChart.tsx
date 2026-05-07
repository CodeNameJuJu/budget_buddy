import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts'
import { formatCurrency, formatPercentage } from '@/lib/utils'
import { useState, useEffect } from 'react'

interface CategoryBreakdown {
  category_id: number
  category_name: string
  amount: string
  percentage: string
  transaction_count: number
}

interface CategoryBreakdownChartProps {
  data: CategoryBreakdown[]
}

const COLORS = [
  '#6BAF92', // Primary Green
  '#88B39B', // Light Green
  '#D9B44A', // Accent Gold
  '#C97C5D', // Warning
  '#6C7A73', // Muted
  '#A7B3AD', // Dark Muted
  '#E6E0D6', // Border
  '#2E3B35', // Dark Border
]

export default function CategoryBreakdownChart({ data }: CategoryBreakdownChartProps) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Transform data for Recharts and sort by amount descending
  const chartData = data
    .map(item => ({
      name: item.category_name,
      value: parseFloat(item.amount),
      percentage: parseFloat(item.percentage),
      transactions: item.transaction_count
    }))
    .sort((a, b) => b.value - a.value)

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium mb-1">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            Amount: {formatCurrency(data.value)}
          </p>
          <p className="text-sm text-muted-foreground">
            Percentage: {formatPercentage(data.percentage)}
          </p>
          <p className="text-sm text-muted-foreground">
            Transactions: {data.transactions}
          </p>
        </div>
      )
    }
    return null
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-80 text-muted-foreground">
        No category data available
      </div>
    )
  }

  // Calculate height based on number of categories
  const chartHeight = Math.max(300, data.length * 50 + 100)

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="name"
            angle={-45}
            textAnchor="end"
            height={80}
            tick={{ fontSize: 12 }}
          />
          <YAxis tickFormatter={(value) => formatCurrency(value)} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="value" fill="#6BAF92" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
