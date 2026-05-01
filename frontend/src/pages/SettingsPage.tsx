import { useState, useEffect } from "react"
import { Save, Moon, Sun, Bell, Download, Upload, Trash2, Shield, Lock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useTheme } from "@/contexts/ThemeContext"
import { cn } from "@/lib/utils"
import { alertsApi, transactionsApi, authApi } from "@/lib/api"
import { useAuth } from "@/hooks"

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme()
  const { user, logout } = useAuth()
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [accountId, setAccountId] = useState<number | null>(null)
  const [exporting, setExporting] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)
  
  const [alertPreferences, setAlertPreferences] = useState({
    budgetOverspending: true,
    savingsGoals: true,
  })

  const [privacySettings, setPrivacySettings] = useState({
    dataRetention: "indefinite",
    analyticsOptOut: false,
  })

  async function saveSettings() {
    if (!accountId) {
      setMessage({ type: 'error', text: 'No account found' })
      return
    }
    setSaving(true)
    setMessage(null)
    try {
      // Save budget overspending preference (AlertBudgetThreshold)
      await alertsApi.updatePreference({
        account_id: accountId,
        type: 'budget_threshold',
        enabled: alertPreferences.budgetOverspending,
        threshold: 70,
      })

      // Save savings goals preference (AlertGoalAchieved)
      await alertsApi.updatePreference({
        account_id: accountId,
        type: 'goal_achieved',
        enabled: alertPreferences.savingsGoals,
      })

      setMessage({ type: 'success', text: 'Settings saved successfully' })
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      console.error("Failed to save settings", error)
      setMessage({ type: 'error', text: 'Failed to save settings' })
      setTimeout(() => setMessage(null), 3000)
    } finally {
      setSaving(false)
    }
  }

  async function loadPreferences() {
    if (!accountId) return
    setLoading(true)
    try {
      const response = await alertsApi.getPreferences(accountId)
      const preferences = response.data || []
      
      // Map backend preferences to frontend state
      const budgetPref = preferences.find((p: any) => p.type === 'budget_threshold')
      const goalPref = preferences.find((p: any) => p.type === 'goal_achieved')
      
      setAlertPreferences({
        budgetOverspending: budgetPref?.enabled ?? true,
        savingsGoals: goalPref?.enabled ?? true,
      })
    } catch (error) {
      console.error("Failed to load preferences", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      // Get account ID from user
      const fetchAccount = async () => {
        try {
          const { accountsApi } = await import('@/lib/api')
          const response = await accountsApi.getMyAccount()
          if (response.data && response.data.length > 0) {
            setAccountId(response.data[0].id)
          }
        } catch (error) {
          console.error("Failed to load account", error)
        }
      }
      fetchAccount()
    }
  }, [user])

  async function handleExportData() {
    if (!accountId) return
    setExporting(true)
    try {
      const response = await transactionsApi.list(accountId)
      const transactions = response.data || []
      
      // Convert to CSV
      const headers = ["Date", "Description", "Amount", "Type", "Category", "Notes"]
      const rows = transactions.map(t => [
        t.date,
        t.description || "",
        t.amount,
        t.type,
        t.category?.name || "",
        t.notes || "",
      ])
      
      const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n")
      const blob = new Blob([csvContent], { type: "text/csv" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `transactions_export_${new Date().toISOString().split("T")[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
      
      setMessage({ type: 'success', text: 'Data exported successfully' })
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      console.error("Failed to export data", error)
      setMessage({ type: 'error', text: 'Failed to export data' })
      setTimeout(() => setMessage(null), 3000)
    } finally {
      setExporting(false)
    }
  }

  async function handleDeleteAccount() {
    if (!confirm("Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.")) return
    
    if (!confirm("This is your last chance. Type 'DELETE' to confirm account deletion.")) return
    
    setDeletingAccount(true)
    try {
      await authApi.deleteAccount()
      await logout()
    } catch (error) {
      console.error("Failed to delete account", error)
      setMessage({ type: 'error', text: 'Failed to delete account' })
      setTimeout(() => setMessage(null), 3000)
      setDeletingAccount(false)
    }
  }

  async function savePrivacySettings() {
    setSaving(true)
    try {
      localStorage.setItem('privacySettings', JSON.stringify(privacySettings))
      setMessage({ type: 'success', text: 'Privacy settings saved' })
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings' })
      setTimeout(() => setMessage(null), 3000)
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    if (accountId) {
      loadPreferences()
    }
  }, [accountId])

  useEffect(() => {
    const saved = localStorage.getItem('privacySettings')
    if (saved) {
      setPrivacySettings(JSON.parse(saved))
    }
  }, [])

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-6">
      <h1 className={cn(
        "text-2xl font-bold",
        theme === "light" ? "text-[#1F2A24]" : "text-[#E7EFEA]"
      )}>
        Settings
      </h1>

      {/* Appearance */}
      <Card className={cn(
        theme === "light"
          ? "bg-[#E8DCC5]/50 border-[#E6E0D6]"
          : "bg-[#18231D]/50 border-[#2E3B35]"
      )}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {theme === "light" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            Appearance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Theme</Label>
              <p className={cn("text-sm mt-1", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>
                Choose your preferred color scheme
              </p>
            </div>
            <Button
              onClick={toggleTheme}
              variant="outline"
              className={cn(
                theme === "light"
                  ? "border-[#E6E0D6] text-[#6C7A73] hover:bg-[#E8DCC5]"
                  : "border-[#2E3B35] text-[#A7B3AD] hover:bg-[#18231D]"
              )}
            >
              {theme === "light" ? <Moon className="h-4 w-4 mr-2" /> : <Sun className="h-4 w-4 mr-2" />}
              {theme === "light" ? "Dark" : "Light"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className={cn(
        theme === "light"
          ? "bg-[#E8DCC5]/50 border-[#E6E0D6]"
          : "bg-[#18231D]/50 border-[#2E3B35]"
      )}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Budget Overspending Alerts</Label>
              <p className={cn("text-sm mt-1", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>
                Get notified when you exceed 70% of your budget
              </p>
            </div>
            <input
              type="checkbox"
              checked={alertPreferences.budgetOverspending}
              onChange={(e) => setAlertPreferences({ ...alertPreferences, budgetOverspending: e.target.checked })}
              className="w-5 h-5 rounded"
              disabled={loading}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Savings Goal Alerts</Label>
              <p className={cn("text-sm mt-1", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>
                Get notified when you achieve your savings goals
              </p>
            </div>
            <input
              type="checkbox"
              checked={alertPreferences.savingsGoals}
              onChange={(e) => setAlertPreferences({ ...alertPreferences, savingsGoals: e.target.checked })}
              className="w-5 h-5 rounded"
              disabled={loading}
            />
          </div>

          {message && (
            <div className={cn(
              "p-3 rounded-lg text-sm",
              message.type === 'success'
                ? "bg-[#6BAF92]/20 text-[#6BAF92]"
                : "bg-red-500/20 text-red-400"
            )}>
              {message.text}
            </div>
          )}

          <Button
            onClick={saveSettings}
            disabled={saving}
            className={cn(
              theme === "light"
                ? "bg-[#D9B44A] hover:bg-[#C9A24A] text-[#1F2A24]"
                : "bg-[#C9A24A] hover:bg-[#B8923A] text-[#E7EFEA]"
            )}
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card className={cn(
        theme === "light"
          ? "bg-[#E8DCC5]/50 border-[#E6E0D6]"
          : "bg-[#18231D]/50 border-[#2E3B35]"
      )}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Data Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Export Data</Label>
              <p className={cn("text-sm mt-1", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>
                Download all your transactions as CSV
              </p>
            </div>
            <Button
              onClick={handleExportData}
              disabled={exporting}
              variant="outline"
              className={cn(
                theme === "light"
                  ? "border-[#E6E0D6] text-[#6C7A73] hover:bg-[#E8DCC5]"
                  : "border-[#2E3B35] text-[#A7B3AD] hover:bg-[#18231D]"
              )}
            >
              <Download className="h-4 w-4 mr-2" />
              {exporting ? "Exporting..." : "Export"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Account Management */}
      <Card className={cn(
        theme === "light"
          ? "bg-[#E8DCC5]/50 border-[#E6E0D6]"
          : "bg-[#18231D]/50 border-[#2E3B35]"
      )}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-500">
            <Trash2 className="h-5 w-5" />
            Account Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-red-500">Delete Account</Label>
              <p className={cn("text-sm mt-1", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>
                Permanently delete your account and all data
              </p>
            </div>
            <Button
              onClick={handleDeleteAccount}
              disabled={deletingAccount}
              variant="destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {deletingAccount ? "Deleting..." : "Delete Account"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Privacy */}
      <Card className={cn(
        theme === "light"
          ? "bg-[#E8DCC5]/50 border-[#E6E0D6]"
          : "bg-[#18231D]/50 border-[#2E3B35]"
      )}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Privacy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Data Retention</Label>
            <select
              className={cn("w-full border rounded-lg px-3 py-2", theme === "light" ? "border-[#E6E0D6] bg-white text-[#1F2A24]" : "border-[#2E3B35] bg-[#18231D] text-[#E7EFEA]")}
              value={privacySettings.dataRetention}
              onChange={(e) => setPrivacySettings({ ...privacySettings, dataRetention: e.target.value })}
            >
              <option value="indefinite">Keep data indefinitely</option>
              <option value="1year">Keep data for 1 year</option>
              <option value="2years">Keep data for 2 years</option>
              <option value="5years">Keep data for 5 years</option>
            </select>
            <p className={cn("text-sm", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>
              How long to keep your transaction data
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Analytics Opt-Out</Label>
              <p className={cn("text-sm mt-1", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>
                Disable anonymous usage analytics
              </p>
            </div>
            <input
              type="checkbox"
              checked={privacySettings.analyticsOptOut}
              onChange={(e) => setPrivacySettings({ ...privacySettings, analyticsOptOut: e.target.checked })}
              className="w-5 h-5 rounded"
            />
          </div>

          <Button
            onClick={savePrivacySettings}
            disabled={saving}
            className={cn(
              theme === "light"
                ? "bg-[#D9B44A] hover:bg-[#C9A24A] text-[#1F2A24]"
                : "bg-[#C9A24A] hover:bg-[#B8923A] text-[#E7EFEA]"
            )}
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Privacy Settings"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
