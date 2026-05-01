import { useState, useEffect } from "react"
import { Calendar, Save } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTheme } from "@/contexts/ThemeContext"
import { cn } from "@/lib/utils"
import { accountsApi } from "@/lib/api"
import { useAuth } from "@/hooks"

export default function SettingsPage() {
  const { user } = useAuth()
  const { theme } = useTheme()
  const [billingCycleDay, setBillingCycleDay] = useState(25)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [accountId, setAccountId] = useState<number | null>(null)

  useEffect(() => {
    loadAccountSettings()
  }, [])

  async function loadAccountSettings() {
    setLoading(true)
    try {
      const response = await accountsApi.getMyAccount()
      console.log("getMyAccount response:", response)
      if (response.data && response.data.length > 0) {
        const account = response.data[0]
        console.log("Account:", account)
        setAccountId(account.id)
        setBillingCycleDay(account.billing_cycle_day || 25)
      } else {
        console.error("No accounts found in response")
      }
    } catch (error) {
      console.error("Failed to load account settings", error)
    } finally {
      setLoading(false)
    }
  }

  async function saveSettings() {
    console.log("saveSettings called, accountId:", accountId)
    if (!accountId) {
      setMessage({ type: 'error', text: 'No account found' })
      return
    }
    setSaving(true)
    setMessage(null)
    try {
      console.log("Calling update with accountId:", accountId, "billing_cycle_day:", billingCycleDay)
      await accountsApi.update(accountId, { billing_cycle_day: billingCycleDay })
      setMessage({ type: 'success', text: 'Settings saved successfully' })
    } catch (error) {
      console.error("Failed to save settings", error)
      setMessage({ type: 'error', text: 'Failed to save settings' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6">
      <h1 className={cn(
        "text-2xl font-bold mb-6",
        theme === "light" ? "text-[#1F2A24]" : "text-[#E7EFEA]"
      )}>
        Settings
      </h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Billing Cycle
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="billing-cycle-day">Billing Cycle Day</Label>
            <Input
              id="billing-cycle-day"
              type="number"
              min="1"
              max="31"
              value={billingCycleDay}
              onChange={(e) => setBillingCycleDay(parseInt(e.target.value) || 1)}
              disabled={loading || saving}
              className="max-w-xs"
            />
            <p className={cn(
              "text-sm",
              theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]"
            )}>
              The day of the month when your billing cycle starts (1-31).
              This is typically the day you get paid.
            </p>
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
            disabled={loading || saving}
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
    </div>
  )
}
