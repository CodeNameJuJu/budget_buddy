import { useState, useEffect } from "react"
import { Save, Moon, Sun, Bell, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useTheme } from "@/contexts/ThemeContext"
import { cn } from "@/lib/utils"

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme()
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  const [alertPreferences, setAlertPreferences] = useState({
    budgetOverspending: true,
    billReminders: true,
    savingsGoals: true,
  })

  async function saveSettings() {
    setSaving(true)
    setMessage(null)
    try {
      // Save alert preferences to localStorage for now
      localStorage.setItem('alertPreferences', JSON.stringify(alertPreferences))
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

  useEffect(() => {
    const saved = localStorage.getItem('alertPreferences')
    if (saved) {
      setAlertPreferences(JSON.parse(saved))
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
                Get notified when you exceed your budget
              </p>
            </div>
            <input
              type="checkbox"
              checked={alertPreferences.budgetOverspending}
              onChange={(e) => setAlertPreferences({ ...alertPreferences, budgetOverspending: e.target.checked })}
              className="w-5 h-5 rounded"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Bill Reminders</Label>
              <p className={cn("text-sm mt-1", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>
                Get reminded before bills are due
              </p>
            </div>
            <input
              type="checkbox"
              checked={alertPreferences.billReminders}
              onChange={(e) => setAlertPreferences({ ...alertPreferences, billReminders: e.target.checked })}
              className="w-5 h-5 rounded"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Savings Goal Alerts</Label>
              <p className={cn("text-sm mt-1", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>
                Track progress towards your savings goals
              </p>
            </div>
            <input
              type="checkbox"
              checked={alertPreferences.savingsGoals}
              onChange={(e) => setAlertPreferences({ ...alertPreferences, savingsGoals: e.target.checked })}
              className="w-5 h-5 rounded"
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
    </div>
  )
}
