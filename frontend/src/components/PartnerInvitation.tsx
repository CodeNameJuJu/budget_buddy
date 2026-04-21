import { useState, useEffect } from "react"
import { UserPlus, Mail, Send, Clock, CheckCircle, XCircle, Users, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Partnership {
  id: number
  name: string
  description?: string
  is_active: boolean
  created_at: string
  members: PartnershipMember[]
  shared_accounts: SharedAccount[]
}

interface PartnershipMember {
  id: number
  user_id: number
  role: string
  joined_at: string
  user: {
    id: number
    email: string
    first_name?: string
    last_name?: string
  }
}

interface PartnerInvitation {
  id: number
  partnership_id: number
  invited_email: string
  status: string
  message?: string
  expires_at: string
  partnership: {
    id: number
    name: string
  }
  invited_by_user: {
    id: number
    email: string
    first_name?: string
    last_name?: string
  }
}

interface SharedAccount {
  id: number
  account_id: number
  account: {
    id: number
    name: string
    email: string
  }
}

export default function PartnerInvitation() {
  const [partnerships, setPartnerships] = useState<Partnership[]>([])
  const [pendingInvitations, setPendingInvitations] = useState<PartnerInvitation[]>([])
  const [loading, setLoading] = useState(true)
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [inviteForm, setInviteForm] = useState({
    email: "",
    message: "",
    role: "member",
    partnershipId: ""
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      // This would be implemented in your API
      // const response = await couplesApi.getUserPartnerships()
      // setPartnerships(response.data.partnerships)
      // setPendingInvitations(response.data.pending_invitations)
    } catch (error) {
      console.error("Failed to load partnerships", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleInvitePartner(e: React.FormEvent) {
    e.preventDefault()
    if (!inviteForm.email || !inviteForm.partnershipId) return

    try {
      // This would be implemented in your API
      // await couplesApi.invitePartner(parseInt(inviteForm.partnershipId), {
      //   email: inviteForm.email,
      //   message: inviteForm.message,
      //   role: inviteForm.role
      // })
      
      setShowInviteForm(false)
      setInviteForm({ email: "", message: "", role: "member", partnershipId: "" })
      loadData()
    } catch (error) {
      console.error("Failed to invite partner", error)
    }
  }

  async function handleRespondToInvitation(invitationId: number, action: "accept" | "decline") {
    try {
      // This would be implemented in your API
      // await couplesApi.respondToInvitation(invitationId, { action })
      loadData()
    } catch (error) {
      console.error("Failed to respond to invitation", error)
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="bg-yellow-800/30 text-yellow-300"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
      case "accepted":
        return <Badge variant="secondary" className="bg-green-800/30 text-green-300"><CheckCircle className="w-3 h-3 mr-1" />Accepted</Badge>
      case "declined":
        return <Badge variant="secondary" className="bg-red-800/30 text-red-300"><XCircle className="w-3 h-3 mr-1" />Declined</Badge>
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

  if (loading) {
    return <div className="p-6 text-center text-slate-400">Loading partnerships...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-400" />
          <h2 className="text-xl font-semibold text-slate-100">Partners & Sharing</h2>
        </div>
        <Button onClick={() => setShowInviteForm(!showInviteForm)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Invite Partner
        </Button>
      </div>

      {/* Invite Partner Form */}
      {showInviteForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-slate-100">Invite Partner</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInvitePartner} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Partnership
                </label>
                <Select value={inviteForm.partnershipId} onValueChange={(value) => setInviteForm({...inviteForm, partnershipId: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a partnership" />
                  </SelectTrigger>
                  <SelectContent>
                    {partnerships.map((partnership) => (
                      <SelectItem key={partnership.id} value={partnership.id.toString()}>
                        {partnership.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Partner Email
                </label>
                <Input
                  type="email"
                  placeholder="partner@example.com"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({...inviteForm, email: e.target.value})}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Role
                </label>
                <Select value={inviteForm.role} onValueChange={(value) => setInviteForm({...inviteForm, role: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member (view & add transactions)</SelectItem>
                    <SelectItem value="admin">Admin (full access except managing partners)</SelectItem>
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
                  onChange={(e) => setInviteForm({...inviteForm, message: e.target.value})}
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  <Send className="h-4 w-4 mr-2" />
                  Send Invitation
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowInviteForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-slate-100">Pending Invitations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingInvitations.map((invitation) => (
              <div key={invitation.id} className="flex items-center justify-between p-4 border border-slate-700 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-slate-100">
                      Invitation to join {invitation.partnership.name}
                    </span>
                    {getStatusBadge(invitation.status)}
                  </div>
                  <p className="text-sm text-slate-400 mb-1">
                    From {invitation.invited_by_user.first_name} {invitation.invited_by_user.last_name} ({invitation.invited_by_user.email})
                  </p>
                  {invitation.message && (
                    <p className="text-sm text-slate-400 italic">"{invitation.message}"</p>
                  )}
                  <p className="text-xs text-slate-500">
                    Expires: {new Date(invitation.expires_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleRespondToInvitation(invitation.id, "accept")}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRespondToInvitation(invitation.id, "decline")}
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

      {/* Existing Partnerships */}
      <div className="space-y-4">
        {partnerships.length === 0 ? (
          <Alert>
            <Users className="h-4 w-4" />
            <AlertDescription>
              No partnerships yet. Create your first partnership to start sharing accounts with your partner.
            </AlertDescription>
          </Alert>
        ) : (
          partnerships.map((partnership) => (
            <Card key={partnership.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-slate-100">{partnership.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-slate-600 text-slate-300">
                      {partnership.members.length} members
                    </Badge>
                    <Button size="sm" variant="ghost">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {partnership.description && (
                  <p className="text-sm text-slate-400">{partnership.description}</p>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-slate-300 mb-2">Members</h4>
                    <div className="space-y-2">
                      {partnership.members.map((member) => (
                        <div key={member.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                              {member.user.first_name?.[0] || member.user.email[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-100">
                                {member.user.first_name} {member.user.last_name}
                              </p>
                              <p className="text-xs text-slate-400">{member.user.email}</p>
                            </div>
                          </div>
                          {getRoleBadge(member.role)}
                        </div>
                      ))}
                    </div>
                  </div>

                  {partnership.shared_accounts.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-300 mb-2">Shared Accounts</h4>
                      <div className="space-y-2">
                        {partnership.shared_accounts.map((sharedAccount) => (
                          <div key={sharedAccount.id} className="flex items-center gap-2 p-2 bg-slate-800/50 rounded">
                            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-sm font-medium">
                              {sharedAccount.account.name[0].toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-slate-100">{sharedAccount.account.name}</p>
                              <p className="text-xs text-slate-400">{sharedAccount.account.email}</p>
                            </div>
                            <Badge variant="outline" className="border-green-600 text-green-400 text-xs">
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
