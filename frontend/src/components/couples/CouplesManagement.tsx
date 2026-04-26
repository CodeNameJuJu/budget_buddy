import React, { useState, useEffect } from 'react';
import { Heart, Users, Plus, Mail, Settings, UserPlus, Shield, Eye, Edit, User } from 'lucide-react';
import { couplesApi } from '@/lib/api';

// Types for couples system
interface Partnership {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  member_count: number;
  current_user_role: string;
  members: PartnershipMember[];
  shared_accounts: SharedAccount[];
}

interface PartnershipMember {
  id: number;
  partnership_id: number;
  user_id: number;
  role: string;
  joined_at: string;
  user?: {
    id: number;
    email: string;
    first_name?: string;
    last_name?: string;
  };
}

interface SharedAccount {
  id: number;
  partnership_id: number;
  account_id: number;
  account?: {
    id: number;
    name: string;
    currency: string;
  };
}

interface PartnerInvitation {
  id: number;
  partnership_id: number;
  invited_email: string;
  status: string;
  role: string;
  message?: string;
  expires_at: string;
  invitation_token?: string;
  partnership?: {
    id: number;
    name: string;
  };
  invited_by_user?: {
    id: number;
    email: string;
    first_name?: string;
    last_name?: string;
  };
}

export const CouplesManagement: React.FC = () => {
  const [partnerships, setPartnerships] = useState<Partnership[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<PartnerInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [selectedPartnership, setSelectedPartnership] = useState<Partnership | null>(null);
  const [activeTab, setActiveTab] = useState<'partnerships' | 'invitations'>('partnerships');

  // Form states
  const [newPartnership, setNewPartnership] = useState({ name: '', description: '' });
  const [inviteForm, setInviteForm] = useState({ email: '', message: '', role: 'member' as 'admin' | 'member' });

  useEffect(() => {
    fetchPartnerships();
  }, []);

  const fetchPartnerships = async () => {
    try {
      const response = await couplesApi.list();
      setPartnerships(response.data.partnerships || []);
      setPendingInvitations(response.data.pending_invitations || []);
    } catch (error) {
      console.error('Failed to fetch partnerships:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createPartnership = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await couplesApi.create(newPartnership);
      setShowCreateForm(false);
      setNewPartnership({ name: '', description: '' });
      fetchPartnerships();
    } catch (error) {
      console.error('Failed to create partnership:', error);
    }
  };

  const invitePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPartnership) return;

    try {
      await couplesApi.invite(selectedPartnership.id, inviteForm);
      setShowInviteForm(false);
      setInviteForm({ email: '', message: '', role: 'member' });
      fetchPartnerships();
    } catch (error) {
      console.error('Failed to invite partner:', error);
    }
  };

  const respondToInvitation = async (token: string, action: 'accept' | 'decline') => {
    try {
      await couplesApi.respond(token, action);
      fetchPartnerships();
    } catch (error) {
      console.error('Failed to respond to invitation:', error);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-purple-800/30 text-purple-300 border border-purple-700/50';
      case 'admin': return 'bg-emerald-800/30 text-emerald-300 border border-emerald-700/50';
      case 'member': return 'bg-slate-700/30 text-slate-300 border border-slate-600/50';
      default: return 'bg-slate-700/30 text-slate-300 border border-slate-600/50';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Shield className="h-4 w-4" />;
      case 'admin': return <Settings className="h-4 w-4" />;
      case 'member': return <Users className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-100 flex items-center gap-2">
          <Heart className="h-8 w-8 text-red-400" />
          Couples & Partners
        </h1>
        <p className="text-slate-400 mt-2">Manage your shared finances with your partner</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-700 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('partnerships')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'partnerships'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-600'
            }`}
          >
            My Partnerships ({partnerships.length})
          </button>
          <button
            onClick={() => setActiveTab('invitations')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'invitations'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-600'
            }`}
          >
            Pending Invitations ({pendingInvitations.length})
          </button>
        </nav>
      </div>

      {activeTab === 'partnerships' && (
        <div className="space-y-6">
          {/* Create Partnership Button */}
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-slate-100">Your Partnerships</h2>
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors duration-200"
            >
              <Plus className="h-4 w-4" />
              Create Partnership
            </button>
          </div>

          {/* Partnerships List */}
          {partnerships.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <Users className="h-12 w-12 text-slate-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-100 mb-2">No partnerships yet</h3>
              <p className="text-slate-400 mb-4">Create your first partnership to start sharing finances with your partner</p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors duration-200"
              >
                Create Partnership
              </button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {partnerships.map((partnership) => (
                <div key={partnership.id} className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-100">{partnership.name}</h3>
                      {partnership.description && (
                        <p className="text-slate-400 text-sm mt-1">{partnership.description}</p>
                      )}
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(partnership.current_user_role)}`}>
                      {getRoleIcon(partnership.current_user_role)}
                      <span className="ml-1">{partnership.current_user_role}</span>
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Members</span>
                      <span className="font-medium">{partnership.member_count}</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Shared Accounts</span>
                      <span className="font-medium">{partnership.shared_accounts.length}</span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Created</span>
                      <span className="font-medium">
                        {new Date(partnership.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Members */}
                  {partnership.members && partnership.members.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-700">
                      <h4 className="text-sm font-medium text-slate-100 mb-2">Members</h4>
                      <div className="space-y-2">
                        {partnership.members.slice(0, 3).map((member) => (
                          <div key={member.id} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 bg-slate-600 rounded-full flex items-center justify-center">
                                <User className="h-3 w-3 text-slate-300" />
                              </div>
                              <span>
                                {member.user?.first_name || member.user?.email}
                              </span>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs ${getRoleColor(member.role)}`}>
                              {member.role}
                            </span>
                          </div>
                        ))}
                        {partnership.members.length > 3 && (
                          <div className="text-xs text-gray-500">
                            +{partnership.members.length - 3} more members
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedPartnership(partnership);
                        setShowInviteForm(true);
                      }}
                      className="flex-1 flex items-center justify-center gap-1 bg-indigo-600 text-white px-3 py-2 rounded text-sm hover:bg-indigo-700"
                    >
                      <UserPlus className="h-3 w-3" />
                      Invite
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-1 border border-gray-300 text-gray-700 px-3 py-2 rounded text-sm hover:bg-gray-50">
                      <Eye className="h-3 w-3" />
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'invitations' && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">Pending Invitations</h2>
          
          {pendingInvitations.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No pending invitations</h3>
              <p className="text-gray-600">You don't have any pending partnership invitations</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingInvitations.map((invitation) => (
                <div key={invitation.id} className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {invitation.partnership?.name}
                      </h3>
                      <p className="text-gray-600 text-sm mt-1">
                        Invited by {invitation.invited_by_user?.first_name || invitation.invited_by_user?.email}
                      </p>
                      {invitation.message && (
                        <p className="text-gray-700 mt-2 italic">"{invitation.message}"</p>
                      )}
                    </div>
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                      Pending
                    </span>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => respondToInvitation(invitation.invitation_token || '', 'accept')}
                      className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => respondToInvitation(invitation.invitation_token || '', 'decline')}
                      className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-50"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Partnership Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Partnership</h3>
            <form onSubmit={createPartnership}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Partnership Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newPartnership.name}
                    onChange={(e) => setNewPartnership({ ...newPartnership, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., Our Family Finances"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (optional)
                  </label>
                  <textarea
                    value={newPartnership.description}
                    onChange={(e) => setNewPartnership({ ...newPartnership, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    rows={3}
                    placeholder="Describe your partnership..."
                  />
                </div>
              </div>
              <div className="mt-6 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite Partner Modal */}
      {showInviteForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Invite Partner
            </h3>
            <form onSubmit={invitePartner}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Partnership
                  </label>
                  <select
                    value={selectedPartnership?.id || ''}
                    onChange={(e) => setSelectedPartnership(partnerships.find(p => p.id === parseInt(e.target.value)) || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  >
                    <option value="">Select a partnership</option>
                    {partnerships && partnerships.length > 0 ? (
                      partnerships.map((partnership) => (
                        <option key={partnership.id} value={partnership.id}>
                          {partnership.name}
                        </option>
                      ))
                    ) : (
                      <option value="">No partnerships available</option>
                    )}
                  </select>
                  {(!partnerships || partnerships.length === 0) && (
                    <p className="text-xs text-red-500 mt-1">No partnerships found. Create one first.</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Partner's Email
                  </label>
                  <input
                    type="email"
                    required
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="partner@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    value={inviteForm.role}
                    onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value as 'admin' | 'member' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message (optional)
                  </label>
                  <textarea
                    value={inviteForm.message}
                    onChange={(e) => setInviteForm({ ...inviteForm, message: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    rows={3}
                    placeholder="Add a personal message..."
                  />
                </div>
              </div>
              <div className="mt-6 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowInviteForm(false);
                    setSelectedPartnership(null);
                    setInviteForm({ email: '', message: '', role: 'member' });
                  }}
                  className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
