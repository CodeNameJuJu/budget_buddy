// Analytics types and API functions

import { get } from "./api"

export interface SpendingTrend {
  month: string
  income: string
  expenses: string
  savings: string
  budget_used: string
}

export interface CategoryBreakdown {
  category_id: number
  category_name: string
  amount: string
  percentage: string
  transaction_count: number
}

export interface FinancialHealth {
  score: number
  savings_rate: string
  budget_adherence: string
  income_stability: string
  recommendations: string[]
}

// Analytics API
export const analyticsApi = {
  trends: (accountID: number, months?: number) => {
    const params: Record<string, string> = { account_id: String(accountID) }
    if (months) params.months = String(months)
    return get<APIResponse<SpendingTrend[]>>("/analytics/trends", params)
  },
  
  categoryBreakdown: (accountID: number, period?: string) => {
    const params: Record<string, string> = { account_id: String(accountID) }
    if (period) params.period = period
    return get<APIResponse<CategoryBreakdown[]>>("/analytics/category-breakdown", params)
  },
  
  financialHealth: (accountID: number) =>
    get<APIResponse<FinancialHealth>>("/analytics/financial-health", { account_id: String(accountID) }),
}

export interface APIResponse<T> {
  data: T
  count: number
  error?: string
}
