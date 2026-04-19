import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

interface FinancialHealthGaugeProps {
  score: number
}

export default function FinancialHealthGauge({ score }: FinancialHealthGaugeProps) {
  const data = [
    { name: 'Score', value: score },
    { name: 'Remaining', value: 100 - score }
  ]

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10B981' // emerald
    if (score >= 60) return '#F59E0B' // amber
    return '#EF4444' // red
  }

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    if (score >= 40) return 'Fair'
    return 'Poor'
  }

  const scoreColor = getScoreColor(score)
  const scoreLabel = getScoreLabel(score)

  return (
    <div className="flex flex-col items-center">
      <div className="w-48 h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              startAngle={180}
              endAngle={0}
              innerRadius={60}
              outerRadius={80}
              dataKey="value"
            >
              <Cell fill={scoreColor} />
              <Cell fill="#374151" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="text-center mt-4">
        <div className="text-3xl font-bold" style={{ color: scoreColor }}>
          {score}
        </div>
        <div className="text-sm text-muted-foreground">Financial Health</div>
        <div className="text-lg font-medium mt-1" style={{ color: scoreColor }}>
          {scoreLabel}
        </div>
      </div>
    </div>
  )
}
