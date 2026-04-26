import { useAuth } from '../hooks';
import { Button } from '../components/ui/button';
import { LogOut, Mail, User as UserIcon, Shield, Calendar, Clock, Edit, Check, Globe, DollarSign } from 'lucide-react';
import { useState, useEffect } from 'react';
import { authApi, accountsApi, type Account } from '../lib/api';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ email: '', first_name: '', last_name: '', currency: '', timezone: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [verificationToken, setVerificationToken] = useState('');
  const [showVerification, setShowVerification] = useState(false);
  const [account, setAccount] = useState<Account | null>(null);

  const CURRENCY_OPTIONS = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
    { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  ];

  const TIMEZONE_OPTIONS = [
    { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
    { value: 'America/New_York', label: 'Eastern Time (US & Canada)' },
    { value: 'America/Chicago', label: 'Central Time (US & Canada)' },
    { value: 'America/Denver', label: 'Mountain Time (US & Canada)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (US & Canada)' },
    { value: 'Europe/London', label: 'London (GMT)' },
    { value: 'Europe/Paris', label: 'Paris (CET)' },
    { value: 'Europe/Berlin', label: 'Berlin (CET)' },
    { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
    { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
    { value: 'Africa/Johannesburg', label: 'Johannesburg (SAST)' },
  ];

  useEffect(() => {
    loadAccount();
  }, []);

  async function loadAccount() {
    try {
      const response = await accountsApi.getMyAccount();
      if (response.data && response.data.length > 0) {
        setAccount(response.data[0]);
      }
    } catch (error) {
      console.error('Failed to load account', error);
    }
  }

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleEditClick = () => {
    setEditForm({
      email: user.email,
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      currency: account?.currency || 'USD',
      timezone: account?.timezone || 'UTC',
    });
    setIsEditing(true);
    setSaveMessage(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updatedUser = await authApi.updateProfile(editForm);
      // Update account currency/timezone
      if (account && (editForm.currency !== account.currency || editForm.timezone !== account.timezone)) {
        await accountsApi.update(account.id, {
          currency: editForm.currency,
          timezone: editForm.timezone,
        });
        setAccount({ ...account, currency: editForm.currency, timezone: editForm.timezone });
      }
      // Update local user state
      // Note: In a real app, you'd update the auth context
      setIsEditing(false);
      setSaveMessage({ type: 'success', text: 'Profile updated successfully' });

      // If email changed, show verification UI
      if (editForm.email !== user.email) {
        setShowVerification(true);
      }

      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error: any) {
      setSaveMessage({ type: 'error', text: error.message || 'Failed to update profile' });
      setTimeout(() => setSaveMessage(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendVerification = async () => {
    try {
      const response = await authApi.sendVerificationEmail();
      if (response.verification_token) {
        setVerificationToken(response.verification_token);
      }
      setSaveMessage({ type: 'success', text: 'Verification email sent' });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error: any) {
      setSaveMessage({ type: 'error', text: error.message || 'Failed to send verification email' });
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  const handleVerifyEmail = async () => {
    try {
      await authApi.verifyEmail({ token: verificationToken });
      setSaveMessage({ type: 'success', text: 'Email verified successfully' });
      setShowVerification(false);
      setVerificationToken('');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error: any) {
      setSaveMessage({ type: 'error', text: error.message || 'Failed to verify email' });
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="responsive-margin">
      <div className="mb-6 xs:mb-8">
        <h1 className="text-2xl xs:text-3xl font-bold bg-gradient-to-r from-emerald-300 to-green-300 bg-clip-text text-transparent">
          Profile
        </h1>
        <p className="text-slate-400 mt-1">Manage your account settings</p>
      </div>
      
      <div className="bg-slate-800/90 backdrop-blur-md rounded-2xl shadow-xl border border-emerald-900/30 p-4 xs:p-6 mb-4 xs:mb-6 w-full">
        <div className="flex items-center justify-between mb-4 xs:mb-6">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <UserIcon className="h-5 w-5 text-emerald-400" />
            User Information
          </h2>
          {!isEditing && (
            <Button
              onClick={handleEditClick}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </div>

        {saveMessage && (
          <div className={`mb-4 p-3 rounded-lg ${
            saveMessage.type === 'success' ? 'bg-emerald-900/50 text-emerald-300' : 'bg-red-900/50 text-red-300'
          }`}>
            {saveMessage.text}
          </div>
        )}

        {isEditing ? (
          <div className="space-y-4">
            <div className="bg-slate-900/50 rounded-xl p-4">
              <label className="block text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </label>
              <input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                className="w-full bg-slate-800 border border-blue-900/50 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            
            <div className="bg-slate-900/50 rounded-xl p-4">
              <label className="block text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                <UserIcon className="h-4 w-4" />
                First Name
              </label>
              <input
                type="text"
                value={editForm.first_name}
                onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                className="w-full bg-slate-800 border border-emerald-900/50 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="bg-slate-900/50 rounded-xl p-4">
              <label className="block text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                <UserIcon className="h-4 w-4" />
                Last Name
              </label>
              <input
                type="text"
                value={editForm.last_name}
                onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                className="w-full bg-slate-800 border border-emerald-900/50 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="bg-slate-900/50 rounded-xl p-4">
              <label className="block text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Currency
              </label>
              <select
                value={editForm.currency}
                onChange={(e) => setEditForm({ ...editForm, currency: e.target.value })}
                className="w-full bg-slate-800 border border-emerald-900/50 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
              >
                {CURRENCY_OPTIONS.map((opt) => (
                  <option key={opt.code} value={opt.code}>
                    {opt.symbol} {opt.name} ({opt.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-slate-900/50 rounded-xl p-4">
              <label className="block text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Timezone
              </label>
              <select
                value={editForm.timezone}
                onChange={(e) => setEditForm({ ...editForm, timezone: e.target.value })}
                className="w-full bg-slate-800 border border-emerald-900/50 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
              >
                {TIMEZONE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-medium"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button
                onClick={() => setIsEditing(false)}
                variant="outline"
                className="border border-slate-600 text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-slate-900/50 rounded-xl p-4">
              <label className="block text-sm font-medium text-slate-400 mb-1 flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </label>
              <p className="text-white font-medium">{user.email}</p>
            </div>
            
            <div className="bg-slate-900/50 rounded-xl p-4">
              <label className="block text-sm font-medium text-slate-400 mb-1 flex items-center gap-2">
                <UserIcon className="h-4 w-4" />
                Name
              </label>
              <p className="text-white font-medium">
                {user.first_name || ''} {user.last_name || ''} {(user.first_name || user.last_name) ? '' : 'N/A'}
              </p>
            </div>

            <div className="bg-slate-900/50 rounded-xl p-4">
              <label className="block text-sm font-medium text-slate-400 mb-1 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Currency
              </label>
              <p className="text-white font-medium">
                {account?.currency || 'USD'}
              </p>
            </div>

            <div className="bg-slate-900/50 rounded-xl p-4">
              <label className="block text-sm font-medium text-slate-400 mb-1 flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Timezone
              </label>
              <p className="text-white font-medium">
                {account?.timezone || 'UTC'}
              </p>
            </div>
            
            <div className="bg-slate-900/50 rounded-xl p-4">
              <label className="block text-sm font-medium text-slate-400 mb-1 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Account Status
              </label>
              <p className={`font-medium ${user.is_active ? 'text-emerald-400' : 'text-red-400'}`}>
                {user.is_active ? 'Active' : 'Inactive'}
              </p>
            </div>
            
            <div className="bg-slate-900/50 rounded-xl p-4">
              <label className="block text-sm font-medium text-slate-400 mb-1 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Email Verified
              </label>
              <div className="flex items-center gap-2">
                <p className={`font-medium ${user.email_verified ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {user.email_verified ? 'Yes' : 'No'}
                </p>
                {!user.email_verified && (
                  <Button
                    onClick={handleSendVerification}
                    className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1"
                  >
                    Verify
                  </Button>
                )}
              </div>
            </div>
            
            {showVerification && (
              <div className="bg-slate-900/50 rounded-xl p-4">
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Verification Token
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={verificationToken}
                    onChange={(e) => setVerificationToken(e.target.value)}
                    placeholder="Enter verification token"
                    className="flex-1 bg-slate-800 border border-emerald-900/50 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                  <Button
                    onClick={handleVerifyEmail}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            
            <div className="bg-slate-900/50 rounded-xl p-4">
              <label className="block text-sm font-medium text-slate-400 mb-1 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Last Login
              </label>
              <p className="text-white font-medium">
                {user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}
              </p>
            </div>
            
            <div className="bg-slate-900/50 rounded-xl p-4">
              <label className="block text-sm font-medium text-slate-400 mb-1 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Account Created
              </label>
              <p className="text-white font-medium">
                {new Date(user.created_at).toLocaleString()}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
