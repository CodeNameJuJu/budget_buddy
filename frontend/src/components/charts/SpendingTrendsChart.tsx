import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '@/lib/utils'

interface SpendingTrend {
  month: string
  income: string
  expenses: string
  savings: string
  budget_used: string
}

interface SpendingTrendsChartProps {
  data: SpendingTrend[]
}

export default function SpendingTrendsChart({ data }: SpendingTrendsChartProps) {
  // Transform data for Recharts
  const chartData = data.map(item => ({
    month: new Date(item.month + '-01').toLocaleDateString('en-US', { month: 'short' }),
    income: parseFloat(item.income),
    expenses: parseFloat(item.expenses),
    savings: parseFloat(item.savings),
    budgetUsed: parseFloat(item.budget_used)
  }))

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.name === 'Budget Used' 
                ? `${entry.value.toFixed(1)}%`
                : formatCurrency(entry.value)
              }
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis 
            dataKey="month" 
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF' }}
          />
          <YAxis 
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF' }}
            tickFormatter={(value) => `R${value}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="circle"
          />
          <Line 
            type="monotone" 
            dataKey="income" 
            stroke="#10B981" 
            strokeWidth={2}
            dot={{ fill: '#10B981', r: 4 }}
            activeDot={{ r: 6 }}
            name="Income"
          />
          <Line 
            type="monotone" 
            dataKey="expenses" 
            stroke="#EF4444" 
            strokeWidth={2}
            dot={{ fill: '#EF4444', r: 4 }}
            activeDot={{ r: 6 }}
            name="Expenses"
          />
          <Line 
            type="monotone" 
            dataKey="savings" 
            stroke="#3B82F6" 
            strokeWidth={2}
            dot={{ fill: '#3B82F6', r: 4 }}
            activeDot={{ r: 6 }}
            name="Savings"
          />
          <Line 
            type="monotone" 
            dataKey="budgetUsed" 
            stroke="#F59E0B" 
            strokeWidth={2}
            dot={{ fill: '#F59E0B', r: 4 }}
            activeDot={{ r: 6 }}
            name="Budget Used"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
