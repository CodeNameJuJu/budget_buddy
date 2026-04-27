import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
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
    <div className="w-full pt-6 xs:pt-8 pb-4 xs:pb-6" style={{ height: isMobile ? 'auto' : '320px' }}>
      <ResponsiveContainer width="100%" height={isMobile ? 350 : '100%'}>
        <PieChart>
          <Pie
            data={chartData}
            cx={isMobile ? "50%" : "40%"}
            cy={isMobile ? "45%" : "50%"}
            labelLine={false}
            label={renderCustomLabel}
            outerRadius={isMobile ? 60 : 80}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign={isMobile ? "bottom" : "middle"}
            align={isMobile ? "center" : "right"}
            layout={isMobile ? "horizontal" : "vertical"}
            wrapperStyle={isMobile ? { paddingTop: '10px', paddingBottom: '10px' } : {}}
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
