// Analytics types and API functions

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

// Re-use API functions from main api file
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  })

  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error || `Request failed: ${res.status}`)
  }

  return res.json()
}

function get<T>(path: string, params?: Record<string, string>): Promise<T> {
  const query = params ? "?" + new URLSearchParams(params).toString() : ""
  return request<T>(path + query)
}

export interface APIResponse<T> {
  data: T
  count: number
  error?: string
}
