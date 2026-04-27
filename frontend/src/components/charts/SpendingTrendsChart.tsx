import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '@/lib/utils'
import { useTheme } from '@/contexts/ThemeContext'
import { cn } from '@/lib/utils'

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
  const { theme } = useTheme()

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
          <CartesianGrid strokeDasharray="3 3" stroke={theme === "light" ? "#E6E0D6" : "#2E3B35"} />
          <XAxis 
            dataKey="month" 
            stroke={theme === "light" ? "#6C7A73" : "#A7B3AD"}
            tick={{ fill: theme === "light" ? "#6C7A73" : "#A7B3AD" }}
          />
          <YAxis 
            stroke={theme === "light" ? "#6C7A73" : "#A7B3AD"}
            tick={{ fill: theme === "light" ? "#6C7A73" : "#A7B3AD" }}
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
            stroke="#6BAF92" 
            strokeWidth={2}
            dot={{ fill: '#6BAF92', r: 4 }}
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
            stroke="#88B39B" 
            strokeWidth={2}
            dot={{ fill: '#88B39B', r: 4 }}
            activeDot={{ r: 6 }}
            name="Savings"
          />
          <Line 
            type="monotone" 
            dataKey="budgetUsed" 
            stroke="#D9B44A" 
            strokeWidth={2}
            dot={{ fill: '#D9B44A', r: 4 }}
            activeDot={{ r: 6 }}
            name="Budget Used"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
