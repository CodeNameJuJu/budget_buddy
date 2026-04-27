import { useEffect, useState } from "react"
import { UserPlus, Send, Clock, CheckCircle, XCircle, Users, Link as LinkIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { accountMergeApi, type AccountMergeToken } from "@/lib/api"
import { useTheme } from "@/contexts/ThemeContext"
import { cn } from "@/lib/utils"

export default function AccountMerge() {
  const { theme } = useTheme()
  const [pendingTokens, setPendingTokens] = useState<AccountMergeToken[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  // Create merge form
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createForm, setCreateForm] = useState({
    partnerEmail: "",
  })

  // Last created token (so the user can copy/share the link)
  const [lastToken, setLastToken] = useState<AccountMergeToken | null>(null)

  useEffect(() => {
    loadPendingTokens()
  }, [])

  async function loadPendingTokens() {
    setLoading(true)
    setError(null)
    try {
      const res = await accountMergeApi.getPending()
      setPendingTokens(res.data ?? [])
    } catch (err) {
      console.error("Failed to load pending merge tokens", err)
      setError(err instanceof Error ? err.message : "Failed to load pending merge tokens")
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateMergeToken(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    try {
      const res = await accountMergeApi.create({
        partner_email: createForm.partnerEmail.trim(),
      })
      setShowCreateForm(false)
      setCreateForm({ partnerEmail: "" })
      if (res.data) {
        setLastToken(res.data)
        setInfo("Merge token created. Send the link below to your partner.")
      }
      await loadPendingTokens()
    } catch (err) {
      console.error("Failed to create merge token", err)
      setError(err instanceof Error ? err.message : "Failed to create merge token")
    }
  }

  async function handleAcceptMerge(token: AccountMergeToken) {
    if (!confirm("This will merge your account with your partner's account. All your data will be combined. Continue?")) {
      return
    }
    setError(null)
    try {
      await accountMergeApi.accept({ token: token.token })
      setInfo("Accounts merged successfully! You can now view shared data.")
      await loadPendingTokens()
    } catch (err) {
      console.error("Failed to accept merge", err)
      setError(err instanceof Error ? err.message : "Failed to accept merge")
    }
  }

  function mergeLink(token: string) {
    return `${window.location.origin}/partners?token=${encodeURIComponent(token)}`
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary" className={cn(theme === "light" ? "bg-[#6BAF92]/20 text-[#4A7A60]" : "bg-[#88B39B]/20 text-[#88B39B]")}>
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        )
      case "accepted":
        return (
          <Badge className={cn(
            "border",
            theme === "light"
              ? "bg-[#6BAF92]/20 text-[#6BAF92] border-[#6BAF92]/40"
              : "bg-[#6BAF92]/20 text-[#A8D5BA] border-[#6BAF92]/40"
          )}>
            <CheckCircle className="w-3 h-3 mr-1" />
            Accepted
          </Badge>
        )
      case "expired":
        return (
          <Badge variant="secondary" className="bg-[#DC2626]/30 text-[#DC2626]">
            <XCircle className="w-3 h-3 mr-1" />
            Expired
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  // If the user landed here via a merge link (?token=...), prompt them to
  // accept it directly instead of asking them to dig through the pending list.
  const mergeToken = (() => {
    if (typeof window === "undefined") return null
    const params = new URLSearchParams(window.location.search)
    return params.get("token")
  })()

  if (loading) {
    return (
      <div className={cn("p-6 text-center", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>
        Loading account merge requests...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className={cn("h-5 w-5", theme === "light" ? "text-[#6BAF92]" : "text-[#88B39B]")} />
          <h2 className={cn("text-xl font-semibold", theme === "light" ? "text-[#1F2A24]" : "text-[#E7EFEA]")}>
            Account Merge
          </h2>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Merge with partner
        </Button>
      </div>

      {error && (
        <Alert>
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {info && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{info}</AlertDescription>
        </Alert>
      )}

      {/* Token-based accept prompt (when arriving via merge link) */}
      {mergeToken && (
        <Card>
          <CardHeader>
            <CardTitle className={cn(theme === "light" ? "text-[#1F2A24]" : "text-[#E7EFEA]")}>
              You have a pending account merge request
            </CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button
              onClick={() =>
                handleAcceptMerge({
                  token: mergeToken,
                } as AccountMergeToken)
              }
              className={cn(
                theme === "light"
                  ? "bg-[#6BAF92] hover:bg-[#5E9C7E]"
                  : "bg-[#6BAF92] hover:bg-[#5E9C7E]"
              )}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Accept Merge
            </Button>
            <Button
              variant="outline"
              onClick={() => window.location.search = ""}
            >
              Cancel
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Last created token (so user can copy the link to send manually) */}
      {lastToken && lastToken.status === "pending" && (
        <Card>
          <CardHeader>
            <CardTitle className={cn(theme === "light" ? "text-[#1F2A24]" : "text-[#E7EFEA]")}>
              Merge link for {lastToken.to_email}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={cn("text-xs mb-2", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>
              Copy this link and send it to your partner. It expires{" "}
              {new Date(lastToken.expires_at).toLocaleDateString()}.
            </p>
            <div className="flex gap-2">
              <Input
                readOnly
                value={mergeLink(lastToken.token)}
                onFocus={(e) => e.currentTarget.select()}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  navigator.clipboard.writeText(mergeLink(lastToken.token))
                }
              >
                <LinkIcon className="h-4 w-4 mr-2" />
                Copy
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create merge form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle className={cn(theme === "light" ? "text-[#1F2A24]" : "text-[#E7EFEA]")}>
              Merge accounts with partner
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateMergeToken} className="space-y-4">
              <div>
                <label className={cn("block text-sm font-medium mb-1", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>
                  Partner email
                </label>
                <Input
                  type="email"
                  placeholder="partner@example.com"
                  value={createForm.partnerEmail}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, partnerEmail: e.target.value })
                  }
                  required
                />
                <p className={cn("text-xs mt-1", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>
                  Your partner must have an account with this email address.
                </p>
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  <Send className="h-4 w-4 mr-2" />
                  Create merge link
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Pending merge requests */}
      {pendingTokens.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className={cn(theme === "light" ? "text-[#1F2A24]" : "text-[#E7EFEA]")}>
              Pending merge requests
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingTokens.map((token) => (
              <div
                key={token.id}
                className={cn("flex items-center justify-between p-4 border rounded-lg", theme === "light" ? "border-[#E6E0D6]" : "border-[#2E3B35]")}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn("font-medium", theme === "light" ? "text-[#1F2A24]" : "text-[#E7EFEA]")}>
                      Merge request from {token.from_email}
                    </span>
                    {getStatusBadge(token.status)}
                  </div>
                  <p className={cn("text-xs", theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]")}>
                    Expires: {new Date(token.expires_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleAcceptMerge(token)}
                    className={cn(
                      theme === "light"
                        ? "bg-[#6BAF92] hover:bg-[#5E9C7E]"
                        : "bg-[#6BAF92] hover:bg-[#5E9C7E]"
                    )}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Accept
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Info card when no pending requests */}
      {pendingTokens.length === 0 && !lastToken && (
        <Alert>
          <Users className="h-4 w-4" />
          <AlertDescription>
            No pending merge requests. Create one to merge your account with your partner's account.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
