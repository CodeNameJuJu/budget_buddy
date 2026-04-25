import { useEffect, useState } from "react"
import {
  UserPlus,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  Users,
  Plus,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  couplesApi,
  type PartnershipDTO,
  type PartnerInvitationDTO,
} from "@/lib/api"

export default function PartnerInvitation() {
  const [partnerships, setPartnerships] = useState<PartnershipDTO[]>([])
  const [pendingInvitations, setPendingInvitations] = useState<
    PartnerInvitationDTO[]
  >([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  // Create-partnership form
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createForm, setCreateForm] = useState({
    name: "Our household",
    description: "",
  })

  // Invite-partner form
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [inviteForm, setInviteForm] = useState({
    email: "",
    message: "",
    role: "member" as "admin" | "member",
    partnershipId: "",
  })

  // Last-issued invitation token (so the inviter can copy/share it manually
  // until email delivery is wired up).
  const [lastInvitation, setLastInvitation] = useState<PartnerInvitationDTO | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    setError(null)
    try {
      console.log('PartnerInvitation: Loading partnerships')
      const res = await couplesApi.list()
      const data = res.data ?? { partnerships: [], pending_invitations: [] }
      console.log('PartnerInvitation: Partnerships response:', data)
      setPartnerships(data.partnerships ?? [])
      setPendingInvitations(data.pending_invitations ?? [])
      console.log('PartnerInvitation: Partnerships state set to:', data.partnerships ?? [])
      // Default the invite form to the first partnership the user owns/admins.
      if (
        data.partnerships?.length &&
        !inviteForm.partnershipId
      ) {
        setInviteForm((f) => ({
          ...f,
          partnershipId: String(data.partnerships[0].id),
        }))
      }
    } catch (err) {
      console.error("Failed to load partnerships", err)
      setError(err instanceof Error ? err.message : "Failed to load partnerships")
    } finally {
      setLoading(false)
    }
  }

  async function handleCreatePartnership(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await couplesApi.create({
        name: createForm.name.trim(),
        description: createForm.description.trim() || undefined,
      })
      setShowCreateForm(false)
      setCreateForm({ name: "Our household", description: "" })
      await loadData()
    } catch (err) {
      console.error("Failed to create partnership", err)
      setError(
        err instanceof Error ? err.message : "Failed to create partnership"
      )
    }
  }

  async function handleInvitePartner(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    if (!inviteForm.email || !inviteForm.partnershipId) {
      setError("Pick a partnership and enter the partner's email.")
      return
    }
    try {
      const res = await couplesApi.invite(
        Number(inviteForm.partnershipId),
        {
          email: inviteForm.email.trim(),
          role: inviteForm.role,
          message: inviteForm.message.trim() || undefined,
        }
      )
      setShowInviteForm(false)
      setInviteForm({
        email: "",
        message: "",
        role: "member",
        partnershipId: inviteForm.partnershipId,
      })
      if (res.data) {
        setLastInvitation(res.data)
        setInfo(
          "Invitation created. Send the partner the link below; emailing isn't wired up yet."
        )
      }
      await loadData()
    } catch (err) {
      console.error("Failed to invite partner", err)
      setError(err instanceof Error ? err.message : "Failed to invite partner")
    }
  }

  async function handleRespondToInvitation(
    invitation: PartnerInvitationDTO,
    action: "accept" | "decline"
  ) {
    setError(null)
    try {
      await couplesApi.respond(invitation.invitation_token, action)
      await loadData()
    } catch (err) {
      console.error("Failed to respond to invitation", err)
      setError(
        err instanceof Error ? err.message : "Failed to respond to invitation"
      )
    }
  }

  async function handleRemoveMember(partnershipID: number, memberUserID: number) {
    if (!confirm("Remove this member from the partnership?")) return
    setError(null)
    try {
      await couplesApi.removeMember(partnershipID, memberUserID)
      await loadData()
    } catch (err) {
      console.error("Failed to remove member", err)
      setError(err instanceof Error ? err.message : "Failed to remove member")
    }
  }

  function inviteLink(token: string) {
    return `${window.location.origin}/partners?token=${encodeURIComponent(token)}`
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "pending":
        return (
          <Badge
            variant="secondary"
            className="bg-yellow-800/30 text-yellow-300"
          >
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        )
      case "accepted":
        return (
          <Badge
            variant="secondary"
            className="bg-green-800/30 text-green-300"
          >
            <CheckCircle className="w-3 h-3 mr-1" />
            Accepted
          </Badge>
        )
      case "declined":
        return (
          <Badge variant="secondary" className="bg-red-800/30 text-red-300">
            <XCircle className="w-3 h-3 mr-1" />
            Declined
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  function getRoleBadge(role: string) {
    switch (role) {
      case "owner":
        return <Badge className="bg-purple-800/30 text-purple-300">Owner</Badge>
      case "admin":
        return <Badge className="bg-blue-800/30 text-blue-300">Admin</Badge>
      case "member":
        return <Badge className="bg-gray-800/30 text-gray-300">Member</Badge>
      default:
        return <Badge>{role}</Badge>
    }
  }

  // If the user landed here via an invitation link (?token=...), prompt them to
  // accept it directly instead of asking them to dig through the pending list.
  const inviteToken = (() => {
    if (typeof window === "undefined") return null
    const params = new URLSearchParams(window.location.search)
    return params.get("token")
  })()

  if (loading) {
    return (
      <div className="p-6 text-center text-slate-400">
        Loading partnerships...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-400" />
          <h2 className="text-xl font-semibold text-slate-100">
            Partners &amp; Sharing
          </h2>
        </div>
        <div className="flex gap-2">
          {partnerships.length === 0 ? (
            <Button onClick={() => setShowCreateForm(!showCreateForm)}>
              <Plus className="h-4 w-4 mr-2" />
              Create partnership
            </Button>
          ) : (
            <Button onClick={() => setShowInviteForm(!showInviteForm)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Invite partner
            </Button>
          )}
        </div>
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

      {/* Token-based accept prompt (when arriving via invite link) */}
      {inviteToken && (
        <Card>
          <CardHeader>
            <CardTitle className="text-slate-100">
              You have a pending invitation
            </CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button
              onClick={() =>
                handleRespondToInvitation(
                  {
                    invitation_token: inviteToken,
                  } as PartnerInvitationDTO,
                  "accept"
                )
              }
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Accept
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                handleRespondToInvitation(
                  {
                    invitation_token: inviteToken,
                  } as PartnerInvitationDTO,
                  "decline"
                )
              }
            >
              <XCircle className="h-4 w-4 mr-1" />
              Decline
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Last-issued invitation (so user can copy the link to send manually) */}
      {lastInvitation && (
        <Card>
          <CardHeader>
            <CardTitle className="text-slate-100">
              Invitation link for {lastInvitation.invited_email}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-400 mb-2">
              Copy this link and send it to your partner. It expires{" "}
              {new Date(lastInvitation.expires_at).toLocaleDateString()}.
            </p>
            <div className="flex gap-2">
              <Input
                readOnly
                value={inviteLink(lastInvitation.invitation_token)}
                onFocus={(e) => e.currentTarget.select()}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  navigator.clipboard.writeText(
                    inviteLink(lastInvitation.invitation_token)
                  )
                }
              >
                Copy
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create partnership form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-slate-100">
              Create a partnership
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreatePartnership} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Name
                </label>
                <Input
                  value={createForm.name}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, name: e.target.value })
                  }
                  required
                  placeholder="e.g. Our household"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Description (optional)
                </label>
                <Textarea
                  rows={2}
                  value={createForm.description}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      description: e.target.value,
                    })
                  }
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  Create
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

      {/* Invite partner form */}
      {showInviteForm && partnerships.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-slate-100">Invite a partner</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInvitePartner} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Partnership
                </label>
                <Select
                  value={inviteForm.partnershipId}
                  onValueChange={(value) =>
                    setInviteForm({ ...inviteForm, partnershipId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a partnership" />
                  </SelectTrigger>
                  <SelectContent>
                    {console.log('Rendering partnerships in dropdown:', partnerships.length)}
                    {partnerships.map((p) => (
                      <SelectItem key={p.id} value={p.id.toString()}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Partner email
                </label>
                <Input
                  type="email"
                  placeholder="partner@example.com"
                  value={inviteForm.email}
                  onChange={(e) =>
                    setInviteForm({ ...inviteForm, email: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Role
                </label>
                <Select
                  value={inviteForm.role}
                  onValueChange={(value) =>
                    setInviteForm({
                      ...inviteForm,
                      role: value as "admin" | "member",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">
                      Member (view &amp; add transactions)
                    </SelectItem>
                    <SelectItem value="admin">
                      Admin (full access except managing partners)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Message (optional)
                </label>
                <Textarea
                  placeholder="Personal message for your partner..."
                  value={inviteForm.message}
                  onChange={(e) =>
                    setInviteForm({ ...inviteForm, message: e.target.value })
                  }
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  <Send className="h-4 w-4 mr-2" />
                  Send invitation
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowInviteForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Pending invitations addressed to me */}
      {pendingInvitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-slate-100">
              Pending invitations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingInvitations.map((invitation) => (
              <div
                key={invitation.id}
                className="flex items-center justify-between p-4 border border-slate-700 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-slate-100">
                      Invitation to join{" "}
                      {invitation.partnership?.name ?? "a partnership"}
                    </span>
                    {getStatusBadge(invitation.status)}
                  </div>
                  {invitation.invited_by_user && (
                    <p className="text-sm text-slate-400 mb-1">
                      From{" "}
                      {invitation.invited_by_user.first_name ??
                        invitation.invited_by_user.email}{" "}
                      {invitation.invited_by_user.last_name ?? ""} (
                      {invitation.invited_by_user.email})
                    </p>
                  )}
                  {invitation.message && (
                    <p className="text-sm text-slate-400 italic">
                      "{invitation.message}"
                    </p>
                  )}
                  <p className="text-xs text-slate-500">
                    Expires:{" "}
                    {new Date(invitation.expires_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() =>
                      handleRespondToInvitation(invitation, "accept")
                    }
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      handleRespondToInvitation(invitation, "decline")
                    }
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Decline
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Existing partnerships */}
      <div className="space-y-4">
        {partnerships.length === 0 ? (
          <Alert>
            <Users className="h-4 w-4" />
            <AlertDescription>
              No partnerships yet. Create one to start sharing accounts with
              your partner.
            </AlertDescription>
          </Alert>
        ) : (
          partnerships.map((partnership) => (
            <Card key={partnership.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-slate-100">
                    {partnership.name}
                  </CardTitle>
                  <Badge
                    variant="outline"
                    className="border-slate-600 text-slate-300"
                  >
                    {partnership.members?.length ?? 0} members
                  </Badge>
                </div>
                {partnership.description && (
                  <p className="text-sm text-slate-400">
                    {partnership.description}
                  </p>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-slate-300 mb-2">
                      Members
                    </h4>
                    <div className="space-y-2">
                      {(partnership.members ?? []).map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                              {member.user?.first_name?.[0]?.toUpperCase() ??
                                member.user?.email?.[0]?.toUpperCase() ??
                                "?"}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-100">
                                {member.user?.first_name ?? ""}{" "}
                                {member.user?.last_name ?? ""}
                              </p>
                              <p className="text-xs text-slate-400">
                                {member.user?.email ?? `User #${member.user_id}`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getRoleBadge(member.role)}
                            {member.role !== "owner" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-slate-400 hover:text-red-400"
                                onClick={() =>
                                  handleRemoveMember(
                                    partnership.id,
                                    member.user_id
                                  )
                                }
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {partnership.shared_accounts &&
                    partnership.shared_accounts.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-slate-300 mb-2">
                          Shared accounts
                        </h4>
                        <div className="space-y-2">
                          {partnership.shared_accounts.map((shared) => (
                            <div
                              key={shared.id}
                              className="flex items-center gap-2 p-2 bg-slate-800/50 rounded"
                            >
                              <div className="flex-1">
                                <p className="text-sm font-medium text-slate-100">
                                  {shared.account?.name ??
                                    `Account #${shared.account_id}`}
                                </p>
                                {shared.account?.email && (
                                  <p className="text-xs text-slate-400">
                                    {shared.account.email}
                                  </p>
                                )}
                              </div>
                              <Badge
                                variant="outline"
                                className="border-green-600 text-green-400 text-xs"
                              >
                                Shared
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
