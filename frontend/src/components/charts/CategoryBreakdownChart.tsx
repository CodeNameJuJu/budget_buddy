import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { formatCurrency, formatPercentage } from '@/lib/utils'

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
  '#10B981', // emerald
  '#3B82F6', // blue
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#14B8A6', // teal
  '#F97316', // orange
  '#6366F1', // indigo
  '#84CC16', // lime
]

export default function CategoryBreakdownChart({ data }: CategoryBreakdownChartProps) {
  // Transform data for Recharts
  const chartData = data.map(item => ({
    name: item.category_name,
    value: parseFloat(item.amount),
    percentage: parseFloat(item.percentage),
    transactions: item.transaction_count
  }))

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

  const renderCustomLabel = (entry: any) => {
    return `${entry.percentage.toFixed(1)}%`
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-80 text-muted-foreground">
        No category data available
      </div>
    )
  }

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomLabel}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="middle" 
            align="right" 
            layout="vertical"
            formatter={(value: any, entry: any) => [
              `${entry.payload.name}: ${formatCurrency(entry.payload.value)}`,
              ''
            ]}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
