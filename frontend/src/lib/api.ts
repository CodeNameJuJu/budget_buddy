const API_BASE = import.meta.env.PROD 
  ? `${import.meta.env.RAILWAY_SERVICE_BUDGET_BUDDY_URL || 'https://budgetbuddy-production-b70f.up.railway.app'}/api`
  : 'https://budgetbuddy-production-b70f.up.railway.app/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  // Read the access token from either storage. Login may persist to either
  // localStorage (remember me) or sessionStorage; we must use whichever holds
  // the *current* user's token. Reading from only one place caused stale
  // tokens (from a previous login) to be sent, which leaked another user's
  // information into the dashboard.
  const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token')
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }
  
  // Add authorization header if token exists
  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  const res = await fetch(`${API_BASE}${path}`, {
    headers,
    ...options,
  })

  // Handle 401 Unauthorized - token expired or invalid
  if (res.status === 401) {
    // Try to refresh the token. Read the refresh token from whichever storage
    // currently holds it and remember which one so we can persist the new
    // tokens back to the same location. Writing tokens to a different storage
    // than they came from caused another user's session to take precedence.
    const localRefresh = localStorage.getItem('refresh_token')
    const refreshToken = localRefresh || sessionStorage.getItem('refresh_token')
    const storage: Storage = localRefresh ? localStorage : sessionStorage

    const clearAllTokens = () => {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('token_expires_at')
      sessionStorage.removeItem('access_token')
      sessionStorage.removeItem('refresh_token')
      sessionStorage.removeItem('token_expires_at')
    }

    if (refreshToken) {
      try {
        const refreshResponse = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refresh_token: refreshToken }),
        })

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json()
          // Clear both storages first so we don't leave behind tokens from a
          // previous user session.
          clearAllTokens()
          storage.setItem('access_token', refreshData.access_token)
          storage.setItem('refresh_token', refreshData.refresh_token)
          storage.setItem('token_expires_at', (Date.now() + refreshData.expires_in * 1000).toString())

          // Retry the original request with new token
          headers["Authorization"] = `Bearer ${refreshData.access_token}`
          const retryResponse = await fetch(`${API_BASE}${path}`, {
            headers,
            ...options,
          })

          if (!retryResponse.ok) {
            const body = await retryResponse.json().catch(() => null)
            throw new Error(body?.error || `Request failed: ${retryResponse.status}`)
          }

          return retryResponse.json()
        } else {
          // Refresh failed, clear tokens and redirect to login
          clearAllTokens()
          window.location.href = '/login'
          throw new Error('Session expired. Please log in again.')
        }
      } catch (error) {
        // Refresh failed, clear tokens and redirect to login
        clearAllTokens()
        window.location.href = '/login'
        throw new Error('Session expired. Please log in again.')
      }
    } else {
      // No refresh token, redirect to login
      window.location.href = '/login'
      throw new Error('Please log in to continue.')
    }
  }

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

function post<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, { method: "POST", body: JSON.stringify(body) })
}

function patch<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, { method: "PATCH", body: JSON.stringify(body) })
}

function del<T>(path: string): Promise<T> {
  return request<T>(path, { method: "DELETE" })
}

// Types matching the backend API response
export interface APIResponse<T> {
  data: T
  count: number
  error?: string
}

export interface Account {
  id: number
  name: string
  email: string
  currency: string
  timezone?: string
  savings_balance?: string
  created_date: string
}

export interface Category {
  id: number
  account_id: number
  name: string
  icon?: string
  colour?: string
  type: "income" | "expense"
  created_date: string
}

export interface Transaction {
  id: number
  account_id: number
  category_id?: number
  budget_id?: number
  amount: string
  type: "income" | "expense"
  description?: string
  date: string
  notes?: string
  tags?: string // JSON array of tags
  account_type?: "checking" | "savings" // Track which account the transaction is from
  category?: Category
  created_date: string
}

export interface Budget {
  id: number
  account_id: number
  category_id: number
  name: string
  amount: string
  period: "monthly" | "weekly" | "yearly"
  start_date: string
  end_date?: string
  category?: Category
  spent?: string
  remaining?: string
  created_date: string
}

export interface DashboardSummary {
  total_income: string
  total_expenses: string
  balance: string
  recent_transactions: Transaction[]
  top_categories: { category_id: number; category_name: string; total: string }[]
}

// Account API
export const accountsApi = {
  list: () => get<APIResponse<Account[]>>("/accounts"),
  get: (id: number) => get<APIResponse<Account[]>>("/accounts", { id: String(id) }),
  create: (data: { name: string; email: string; currency?: string }) =>
    post<APIResponse<Account>>("/accounts", data),
  update: (id: number, data: Partial<Account>) =>
    patch<APIResponse<Account>>(`/accounts/${id}`, data),
  // Get the authenticated user's account
  getMyAccount: () => get<APIResponse<Account[]>>("/accounts/my"),
}

// Category API
export const categoriesApi = {
  list: (accountID: number, type?: string) => {
    const params: Record<string, string> = { account_id: String(accountID) }
    if (type) params.type = type
    return get<APIResponse<Category[]>>("/categories", params)
  },
  create: (data: { account_id: number; name: string; type: string; icon?: string; colour?: string }) =>
    post<APIResponse<Category>>("/categories", data),
  update: (id: number, data: Partial<Category>) =>
    patch<APIResponse<Category>>(`/categories/${id}`, data),
  delete: (id: number) => del<APIResponse<null>>(`/categories/${id}`),
}

// Transaction API
export const transactionsApi = {
  list: (accountID: number, params?: Record<string, string>) =>
    get<APIResponse<Transaction[]>>("/transactions", { account_id: String(accountID), ...params }),
  create: (data: {
    account_id: number
    category_id?: number
    budget_id?: number
    amount: string
    type: string
    description?: string
    date: string
    notes?: string
    tags?: string
    account_type?: "checking" | "savings"
  }) => post<APIResponse<Transaction>>("/transactions", data),
  update: (id: number, data: Partial<Transaction>) =>
    patch<APIResponse<Transaction>>(`/transactions/${id}`, data),
  delete: (id: number) => del<APIResponse<null>>(`/transactions/${id}`),
}

// Budget API
export const budgetsApi = {
  list: (accountID: number) =>
    get<APIResponse<Budget[]>>("/budgets", { account_id: String(accountID) }),
  create: (data: {
    account_id: number
    category_id: number
    name: string
    amount: string
    period: string
    start_date: string
    end_date?: string
  }) => post<APIResponse<Budget>>("/budgets", data),
  update: (id: number, data: Partial<Budget>) =>
    patch<APIResponse<Budget>>(`/budgets/${id}`, data),
  delete: (id: number) => del<APIResponse<null>>(`/budgets/${id}`),
}

// Savings types
export interface SavingsPot {
  id: number
  account_id: number
  name: string
  icon?: string
  colour?: string
  target?: string
  contribution?: string
  contribution_period?: string
  allocated?: string
  created_date: string
}

export interface PotForecast {
  pot_id: number
  pot_name: string
  allocated: string
  target?: string
  contribution?: string
  contribution_period?: string
  months_to_target?: number
  target_date?: string
  projections: string[]
}

export interface ForecastResponse {
  pots: PotForecast[]
  total_monthly: string
  projected_total_3mo: string
  projected_total_6mo: string
  projected_total_12mo: string
}

export interface SavingsAllocation {
  id: number
  account_id: number
  savings_pot_id: number
  amount: string
  notes?: string
  savings_pot?: SavingsPot
  created_date: string
}

export interface SavingsSummary {
  savings_balance: string | null
  total_allocated: string
  unallocated: string
  pots: SavingsPot[]
}

// Tag types
export interface TagStats {
  tag: string
  count: number
  total_amount: string
}

export interface PopularTag {
  tag: string
  count: number
  category: string
}

// Alert types
export interface Alert {
  id: number
  account_id: number
  type: string
  title: string
  message: string
  severity: string
  is_read: boolean
  expires_at?: string
  reference_id?: number
  metadata?: string
  created_date: string
}

export interface AlertPreference {
  id: number
  account_id: number
  type: string
  enabled: boolean
  threshold?: number
}

// Dashboard widget types
export interface Widget {
  id: string
  type: string
  title: string
  size: string
  position: { x: number; y: number; w: number; h: number }
  config?: string
  is_visible: boolean
  updated_at: string
}

export interface DashboardLayout {
  id: number
  account_id: number
  name: string
  is_active: boolean
  layout: string // JSON string of widgets
  created_date: string
  modified_date: string
}

export interface WidgetDefinition {
  type: string
  name: string
  description: string
  default_size: string
  available_sizes: string[]
  min_size: string
  max_size: string
  configurable: boolean
}

// Savings API
export const savingsApi = {
  summary: (accountID: number) =>
    get<APIResponse<SavingsSummary>>("/savings/summary", { account_id: String(accountID) }),
  listPots: (accountID: number) =>
    get<APIResponse<SavingsPot[]>>("/savings/pots", { account_id: String(accountID) }),
  createPot: (data: { account_id: number; name: string; icon?: string; colour?: string; target?: string; contribution?: string; contribution_period?: string }) =>
    post<APIResponse<SavingsPot>>("/savings/pots", data),
  updatePot: (id: number, data: Partial<SavingsPot>) =>
    patch<APIResponse<SavingsPot>>(`/savings/pots/${id}`, data),
  deletePot: (id: number) => del<APIResponse<null>>(`/savings/pots/${id}`),
  listAllocations: (accountID: number, potID?: number) => {
    const params: Record<string, string> = { account_id: String(accountID) }
    if (potID) params.savings_pot_id = String(potID)
    return get<APIResponse<SavingsAllocation[]>>("/savings/allocations", params)
  },
  createAllocation: (data: { account_id: number; savings_pot_id: number; amount: string; notes?: string }) =>
    post<APIResponse<SavingsAllocation>>("/savings/allocations", data),
  deleteAllocation: (id: number) => del<APIResponse<null>>(`/savings/allocations/${id}`),
  updateBalance: (accountID: number, savingsBalance: string) =>
    post<APIResponse<Account>>(`/savings/balance?account_id=${accountID}`, { savings_balance: savingsBalance }),
  forecast: (accountID: number) =>
    get<APIResponse<ForecastResponse>>("/savings/forecast", { account_id: String(accountID) }),
}

// Tags API
export const tagsApi = {
  stats: (accountID: number) =>
    get<APIResponse<TagStats[]>>("/tags/stats", { account_id: String(accountID) }),
  popular: (accountID: number) =>
    get<APIResponse<PopularTag[]>>("/tags/popular", { account_id: String(accountID) }),
}

// Alerts API
export const alertsApi = {
  list: (accountID: number, unreadOnly?: boolean, limit?: number) => {
    const params: Record<string, string> = { account_id: String(accountID) }
    if (unreadOnly) params.unread_only = "true"
    if (limit) params.limit = String(limit)
    return get<APIResponse<Alert[]>>("/alerts", params)
  },
  getPreferences: (accountID: number) =>
    get<APIResponse<AlertPreference[]>>("/alerts/preferences", { account_id: String(accountID) }),
  markAsRead: (alertID: number) =>
    post<APIResponse<null>>(`/alerts/mark-read?alert_id=${alertID}`, {}),
  markAllAsRead: (accountID: number) =>
    post<APIResponse<null>>("/alerts/mark-all-read", { account_id: accountID }),
  updatePreference: (data: { account_id: number; type: string; enabled: boolean; threshold?: number }) =>
    post<APIResponse<AlertPreference>>("/alerts/preferences", data),
  triggerAlerts: (accountID: number, alertType?: string) =>
    post<APIResponse<{ message: string }>>("/alerts/trigger", { account_id: accountID, alert_type: alertType }),
}

// Dashboard API
export const dashboardApi = {
  summary: (accountID: number, dateFrom?: string, dateTo?: string) => {
    const params: Record<string, string> = { account_id: String(accountID) }
    if (dateFrom) params.date_from = dateFrom
    if (dateTo) params.date_to = dateTo
    return get<APIResponse<DashboardSummary>>("/dashboard/summary", params)
  },
  getLayout: (accountID: number) =>
    get<APIResponse<DashboardLayout>>("/dashboard/layout", { account_id: String(accountID) }),
  saveLayout: (data: { account_id: number; name: string; layout: string }) =>
    post<APIResponse<DashboardLayout>>("/dashboard/layout", data),
  getAvailableWidgets: () =>
    get<APIResponse<WidgetDefinition[]>>("/dashboard/widgets"),
  getWidgetData: (accountID: number, widgetType: string) =>
    get<APIResponse<any>>("/dashboard/widget-data", { account_id: String(accountID), widget_type: widgetType }),
}

// =====================================================================
// Couples / Partnerships API
// =====================================================================

export interface PartnershipUser {
  id: number
  email: string
  first_name?: string | null
  last_name?: string | null
}

export interface PartnershipMemberDTO {
  id: number
  partnership_id: number
  user_id: number
  role: "owner" | "admin" | "member"
  permissions?: string | null
  joined_at: string
  invited_by_user_id?: number | null
  user?: PartnershipUser
}

export interface SharedAccountDTO {
  id: number
  partnership_id: number
  account_id: number
  shared_by_user_id: number
  is_active: boolean
  account?: { id: number; name: string; email: string }
}

export interface PartnershipDTO {
  id: number
  name: string
  description?: string | null
  is_active: boolean
  created_at: string
  members: PartnershipMemberDTO[]
  shared_accounts: SharedAccountDTO[]
}

export interface PartnerInvitationDTO {
  id: number
  partnership_id: number
  invited_email: string
  invited_by_user_id: number
  invitation_token: string
  status: "pending" | "accepted" | "declined" | "expired"
  role: "admin" | "member"
  message?: string | null
  expires_at: string
  created_at: string
  partnership?: { id: number; name: string }
  invited_by_user?: PartnershipUser
}

export interface UserPartnershipsDTO {
  partnerships: PartnershipDTO[]
  pending_invitations: PartnerInvitationDTO[]
}

// Auth API
export const authApi = {
  register: (data: { email: string; password: string; first_name?: string; last_name?: string }) =>
    request<{ user: any; access_token: string; refresh_token: string; token_type: string; expires_in: number }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  login: (data: { email: string; password: string }) =>
    request<{ user: any; access_token: string; refresh_token: string; token_type: string; expires_in: number }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  refresh: (data: { refresh_token: string }) =>
    request<{ user: any; access_token: string; refresh_token: string; token_type: string; expires_in: number }>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  logout: () => request<{ message: string }>('/auth/logout', { method: 'POST' }),
  listDevices: () => request<any[]>('/auth/devices'),
  revokeDevice: (deviceId: string) => request<{ message: string }>(`/auth/devices?device_id=${deviceId}`, { method: 'DELETE' }),
  updateProfile: (data: { email: string; first_name?: string; last_name?: string }) =>
    request<any>('/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  sendVerificationEmail: () => request<{ message: string; verification_token?: string }>('/auth/verify-email/send', {
    method: 'POST',
  }),
  verifyEmail: (data: { token: string }) =>
    request<{ message: string }>('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
}

export const couplesApi = {
  list: () => get<APIResponse<UserPartnershipsDTO>>("/couples"),
  create: (data: { name: string; description?: string }) =>
    post<APIResponse<PartnershipDTO>>("/couples", data),
  details: (partnershipID: number) =>
    get<APIResponse<PartnershipDTO>>("/couples/details", {
      partnership_id: String(partnershipID),
    }),
  invite: (
    partnershipID: number,
    data: { email: string; role: "admin" | "member"; message?: string }
  ) =>
    post<APIResponse<PartnerInvitationDTO>>(
      `/couples/invite?partnership_id=${partnershipID}`,
      data
    ),
  invitationDetails: (token: string) =>
    get<APIResponse<PartnerInvitationDTO>>("/couples/invitation", { token }),
  respond: (token: string, action: "accept" | "decline") =>
    post<APIResponse<{ message: string }>>(
      `/couples/respond?token=${encodeURIComponent(token)}`,
      { action }
    ),
  shareAccount: (
    partnershipID: number,
    data: { account_id: number; permissions?: Record<string, boolean> }
  ) =>
    post<APIResponse<{ message: string }>>(
      `/couples/share-account?partnership_id=${partnershipID}`,
      data
    ),
  removeMember: (partnershipID: number, memberUserID: number) =>
    del<APIResponse<{ message: string }>>(
      `/couples/remove-member?partnership_id=${partnershipID}&member_id=${memberUserID}`
    ),
  updateMemberRole: (
    partnershipID: number,
    memberUserID: number,
    data: { role: "owner" | "admin" | "member" }
  ) =>
    patch<APIResponse<{ message: string }>>(
      `/couples/update-role?partnership_id=${partnershipID}&member_id=${memberUserID}`,
      data
    ),
}
