import { useAuth } from '../hooks';
import { Button } from '../components/ui/button';
import { LogOut, Mail, User as UserIcon, Shield, Calendar, Clock, Edit, Check, Globe, DollarSign, Camera, Upload } from 'lucide-react';
import { useState, useEffect } from 'react';
import { authApi, accountsApi, type Account } from '../lib/api';
import { useTheme } from '../contexts/ThemeContext';
import { cn } from '../lib/utils';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ email: '', first_name: '', last_name: '', currency: '', timezone: '', billing_cycle_day: 25 });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [verificationToken, setVerificationToken] = useState('');
  const [showVerification, setShowVerification] = useState(false);
  const [account, setAccount] = useState<Account | null>(null);
  const [profilePictureUrl, setProfilePictureUrl] = useState('');
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);

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
    if (user) {
      setProfilePictureUrl(user.profile_picture_url || '');
    }
  }, [user]);

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
    if (!user) return;
    setEditForm({
      email: user.email,
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      currency: account?.currency || 'USD',
      timezone: account?.timezone || 'UTC',
      billing_cycle_day: account?.billing_cycle_day || 25,
    });
    setIsEditing(true);
    setSaveMessage(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updatedUser = await authApi.updateProfile(editForm);
      // Update account currency/timezone/billing cycle day
      if (account && (editForm.currency !== account.currency || editForm.timezone !== account.timezone || editForm.billing_cycle_day !== account.billing_cycle_day)) {
        await accountsApi.update(account.id, {
          currency: editForm.currency,
          timezone: editForm.timezone,
          billing_cycle_day: editForm.billing_cycle_day,
        });
        setAccount({ 
          ...account, 
          currency: editForm.currency, 
          timezone: editForm.timezone,
          billing_cycle_day: editForm.billing_cycle_day,
        });
      }
      // Update local user state
      // Note: In a real app, you'd update the auth context
      setIsEditing(false);
      setSaveMessage({ type: 'success', text: 'Profile updated successfully' });

      // If email changed, show verification UI
      if (user && editForm.email !== user.email) {
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

  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPicture(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await authApi.updateProfilePicture(formData);
      setProfilePictureUrl(response.data.profile_picture_url);
      
      // Update user in auth context
      if (user) {
        (user as any).profile_picture_url = response.data.profile_picture_url;
      }
      
      setSaveMessage({ type: 'success', text: 'Profile picture updated successfully' });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error: any) {
      setSaveMessage({ type: 'error', text: error.message || 'Failed to update profile picture' });
      setTimeout(() => setSaveMessage(null), 3000);
    } finally {
      setIsUploadingPicture(false);
    }
  };

  if (!user) {
    return (
      <div className={cn(
        "flex items-center justify-center min-h-screen",
        theme === "light"
          ? "bg-gradient-to-br from-[#F6F4EF] via-[#E8DCC5] to-[#F6F4EF]"
          : "bg-gradient-to-br from-[#141311] via-[#201E1B] to-[#141311]"
      )}>
        <div className={theme === "light" ? "text-[#1F2A24]" : "text-[#EDEBE6]"}>Loading...</div>
      </div>
    );
  }

  return (
    <div className="py-6 xs:py-8">
      <div className="mb-6 xs:mb-8 flex items-center gap-3 xs:gap-4">
        <div className="relative flex-shrink-0">
          {profilePictureUrl ? (
            <img 
              src={profilePictureUrl} 
              alt="Profile" 
              className={cn(
                "w-14 h-14 xs:w-16 xs:h-16 sm:w-20 sm:h-20 rounded-full object-cover border-4 cursor-pointer hover:opacity-90 transition-opacity",
                theme === "light" ? "border-[#6BAF92]" : "border-[#6BAF92]"
              )}
              onClick={() => document.getElementById('header-profile-upload')?.click()}
            />
          ) : (
            <div 
              className={cn(
                "w-14 h-14 xs:w-16 xs:h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center border-4 cursor-pointer hover:opacity-90 transition-opacity",
                theme === "light" ? "bg-[#6BAF92] border-[#6BAF92]" : "bg-[#6BAF92] border-[#6BAF92]"
              )}
              onClick={() => document.getElementById('header-profile-upload')?.click()}
            >
              <UserIcon className="h-7 w-7 xs:h-8 xs:w-8 sm:h-10 sm:w-10 text-white" />
            </div>
          )}
          <label className={cn(
            "absolute bottom-0 right-0 rounded-full p-1.5 cursor-pointer transition-colors",
            theme === "light" ? "bg-[#6BAF92] hover:bg-[#5E9C7E]" : "bg-[#6BAF92] hover:bg-[#5E9C7E]"
          )}>
            <Camera className="h-3 w-3 text-white" />
            <input
              id="header-profile-upload"
              type="file"
              accept="image/*"
              onChange={handleProfilePictureUpload}
              className="hidden"
              disabled={isUploadingPicture}
            />
          </label>
        </div>
        <div className="flex-1 min-w-0">
          <h1 className={cn(
            "text-xl xs:text-2xl lg:text-3xl font-bold bg-gradient-to-r bg-clip-text text-transparent truncate",
            theme === "light"
              ? "from-[#6BAF92] to-[#A8D5BA]"
              : "from-[#88B39B] to-[#A8D5BA]"
          )}>
            Profile
          </h1>
          <p className={cn(
            "mt-1 text-xs xs:text-sm",
            theme === "light" ? "text-[#6C7A73]" : "text-[#ABA9A2]"
          )}>Manage your account settings</p>
        </div>
      </div>

      <div className={cn(
        "backdrop-blur-md rounded-2xl shadow-xl border p-4 xs:p-6 mb-4 xs:mb-6 w-full",
        theme === "light"
          ? "bg-[#E8DCC5]/90 border-[#E6E0D6]/30"
          : "bg-[#201E1B]/90 border-[#38352F]/30"
      )}>
        <div className="flex items-center justify-between mb-4 xs:mb-6 gap-3">
          <h2 className={cn(
            "text-lg xs:text-xl font-semibold flex items-center gap-2",
            theme === "light" ? "text-[#1F2A24]" : "text-[#EDEBE6]"
          )}>
            <UserIcon className={cn(
              "h-5 w-5 flex-shrink-0",
              theme === "light" ? "text-[#6BAF92]" : "text-[#6BAF92]"
            )} />
            <span className="truncate">User Information</span>
          </h2>
          {!isEditing && (
            <Button
              onClick={handleEditClick}
              className={cn(
                "flex-shrink-0 text-xs xs:text-sm px-3 xs:px-4 py-2",
                theme === "light"
                  ? "bg-[#6BAF92] hover:bg-[#5E9C7E]"
                  : "bg-[#6BAF92] hover:bg-[#5E9C7E]"
              )}
            >
              <Edit className="h-4 w-4 mr-1 xs:mr-2" />
              <span className="hidden xs:inline">Edit</span>
              <span className="xs:hidden">Edit</span>
            </Button>
          )}
        </div>

        {saveMessage && (
          <div className={cn(
            "mb-4 p-3 rounded-lg",
            saveMessage.type === 'success'
              ? theme === "light" ? "bg-[#6BAF92]/50 text-[#6BAF92]" : "bg-[#6BAF92]/50 text-[#88B39B]"
              : "bg-red-900/50 text-red-300"
          )}>
            {saveMessage.text}
          </div>
        )}

        {isEditing ? (
          <div className="space-y-3 xs:space-y-4">
            <div className={cn(
              "rounded-xl p-3 xs:p-4",
              theme === "light" ? "bg-white/50" : "bg-[#141311]/50"
            )}>
              <label className={cn(
                "block text-sm font-medium mb-2 flex items-center gap-2",
                theme === "light" ? "text-[#6C7A73]" : "text-[#ABA9A2]"
              )}>
                <Mail className="h-4 w-4" />
                Email
              </label>
              <input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                className={cn(
                  "w-full border rounded-lg px-3 xs:px-4 py-2 text-sm xs:text-base focus:outline-none",
                  theme === "light"
                    ? "bg-white border-[#E6E0D6] text-[#1F2A24] focus:border-[#6BAF92]"
                    : "bg-[#201E1B] border-[#38352F] text-[#EDEBE6] focus:border-[#6BAF92]"
                )}
              />
            </div>
            
            <div className={cn(
              "rounded-xl p-3 xs:p-4",
              theme === "light" ? "bg-white/50" : "bg-[#141311]/50"
            )}>
              <label className={cn(
                "block text-sm font-medium mb-2 flex items-center gap-2",
                theme === "light" ? "text-[#6C7A73]" : "text-[#ABA9A2]"
              )}>
                <UserIcon className="h-4 w-4" />
                First Name
              </label>
              <input
                type="text"
                value={editForm.first_name}
                onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                className={cn(
                  "w-full border rounded-lg px-3 xs:px-4 py-2 text-sm xs:text-base focus:outline-none",
                  theme === "light"
                    ? "bg-white border-[#E6E0D6] text-[#1F2A24] focus:border-[#D9B44A]"
                    : "bg-[#201E1B] border-[#38352F] text-[#EDEBE6] focus:border-[#C9A24A]"
                )}
              />
            </div>

            <div className={cn(
              "rounded-xl p-3 xs:p-4",
              theme === "light" ? "bg-white/50" : "bg-[#141311]/50"
            )}>
              <label className={cn(
                "block text-sm font-medium mb-2 flex items-center gap-2",
                theme === "light" ? "text-[#6C7A73]" : "text-[#ABA9A2]"
              )}>
                <UserIcon className="h-4 w-4" />
                Last Name
              </label>
              <input
                type="text"
                value={editForm.last_name}
                onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                className={cn(
                  "w-full border rounded-lg px-3 xs:px-4 py-2 text-sm xs:text-base focus:outline-none",
                  theme === "light"
                    ? "bg-white border-[#E6E0D6] text-[#1F2A24] focus:border-[#D9B44A]"
                    : "bg-[#201E1B] border-[#38352F] text-[#EDEBE6] focus:border-[#C9A24A]"
                )}
              />
            </div>

            <div className={cn(
              "rounded-xl p-3 xs:p-4",
              theme === "light" ? "bg-white/50" : "bg-[#141311]/50"
            )}>
              <label className={cn(
                "block text-sm font-medium mb-2 flex items-center gap-2",
                theme === "light" ? "text-[#6C7A73]" : "text-[#ABA9A2]"
              )}>
                <DollarSign className="h-4 w-4" />
                Currency
              </label>
              <select
                value={editForm.currency}
                onChange={(e) => setEditForm({ ...editForm, currency: e.target.value })}
                className={cn(
                  "w-full border rounded-lg px-3 xs:px-4 py-2 text-sm xs:text-base focus:outline-none",
                  theme === "light"
                    ? "bg-white border-[#E6E0D6] text-[#1F2A24] focus:border-[#D9B44A]"
                    : "bg-[#201E1B] border-[#38352F] text-[#EDEBE6] focus:border-[#C9A24A]"
                )}
              >
                {CURRENCY_OPTIONS.map((opt) => (
                  <option key={opt.code} value={opt.code}>
                    {opt.symbol} {opt.name} ({opt.code})
                  </option>
                ))}
              </select>
            </div>

            <div className={cn(
              "rounded-xl p-3 xs:p-4",
              theme === "light" ? "bg-white/50" : "bg-[#141311]/50"
            )}>
              <label className={cn(
                "block text-sm font-medium mb-2 flex items-center gap-2",
                theme === "light" ? "text-[#6C7A73]" : "text-[#ABA9A2]"
              )}>
                <Globe className="h-4 w-4" />
                Timezone
              </label>
              <select
                value={editForm.timezone}
                onChange={(e) => setEditForm({ ...editForm, timezone: e.target.value })}
                className={cn(
                  "w-full border rounded-lg px-3 xs:px-4 py-2 text-sm xs:text-base focus:outline-none",
                  theme === "light"
                    ? "bg-white border-[#E6E0D6] text-[#1F2A24] focus:border-[#D9B44A]"
                    : "bg-[#201E1B] border-[#38352F] text-[#EDEBE6] focus:border-[#C9A24A]"
                )}
              >
                {TIMEZONE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className={cn(
              "rounded-xl p-3 xs:p-4",
              theme === "light" ? "bg-white/50" : "bg-[#141311]/50"
            )}>
              <label className={cn(
                "block text-sm font-medium mb-2 flex items-center gap-2",
                theme === "light" ? "text-[#6C7A73]" : "text-[#ABA9A2]"
              )}>
                <Calendar className="h-4 w-4" />
                Billing Cycle Day
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={editForm.billing_cycle_day}
                onChange={(e) => setEditForm({ ...editForm, billing_cycle_day: parseInt(e.target.value) || 1 })}
                className={cn(
                  "w-full border rounded-lg px-3 xs:px-4 py-2 text-sm xs:text-base focus:outline-none",
                  theme === "light"
                    ? "bg-white border-[#E6E0D6] text-[#1F2A24] focus:border-[#D9B44A]"
                    : "bg-[#201E1B] border-[#38352F] text-[#EDEBE6] focus:border-[#C9A24A]"
                )}
              />
              <p className={cn(
                "text-xs mt-1",
                theme === "light" ? "text-[#6C7A73]" : "text-[#ABA9A2]"
              )}>
                The day of the month when your billing cycle starts (1-31)
              </p>
            </div>

            <div className="flex gap-2 xs:gap-3 flex-wrap">
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className={cn(
                  "text-white font-medium text-sm xs:text-base px-4 xs:px-6",
                  theme === "light"
                    ? "bg-gradient-to-r from-[#6BAF92] to-[#5E9C7E] hover:from-[#5E9C7E] hover:to-[#88B39B]"
                    : "bg-gradient-to-r from-[#6BAF92] to-[#5E9C7E] hover:from-[#5E9C7E] hover:to-[#88B39B]"
                )}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button
                onClick={() => setIsEditing(false)}
                variant="outline"
                className={cn(
                  "border transition-colors text-sm xs:text-base px-4 xs:px-6",
                  theme === "light"
                    ? "border-[#E6E0D6] text-[#6C7A73] hover:bg-[#E8DCC5]"
                    : "border-[#38352F] text-[#ABA9A2] hover:bg-[#201E1B]"
                )}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3 xs:space-y-4">
            <div className={cn(
              "rounded-xl p-3 xs:p-4",
              theme === "light" ? "bg-white/50" : "bg-[#141311]/50"
            )}>
              <label className={cn(
                "block text-sm font-medium mb-1 flex items-center gap-2",
                theme === "light" ? "text-[#6C7A73]" : "text-[#ABA9A2]"
              )}>
                <Mail className="h-4 w-4" />
                Email
              </label>
              <p className={cn(
                "font-medium text-sm xs:text-base break-all",
                theme === "light" ? "text-[#1F2A24]" : "text-[#EDEBE6]"
              )}>{user.email}</p>
            </div>
            
            <div className={cn(
              "rounded-xl p-3 xs:p-4",
              theme === "light" ? "bg-white/50" : "bg-[#141311]/50"
            )}>
              <label className={cn(
                "block text-sm font-medium mb-1 flex items-center gap-2",
                theme === "light" ? "text-[#6C7A73]" : "text-[#ABA9A2]"
              )}>
                <UserIcon className="h-4 w-4" />
                Name
              </label>
              <p className={cn(
                "font-medium text-sm xs:text-base",
                theme === "light" ? "text-[#1F2A24]" : "text-[#EDEBE6]"
              )}>
                {user.first_name || ''} {user.last_name || ''} {(user.first_name || user.last_name) ? '' : 'N/A'}
              </p>
            </div>

            <div className={cn(
              "rounded-xl p-3 xs:p-4",
              theme === "light" ? "bg-white/50" : "bg-[#141311]/50"
            )}>
              <label className={cn(
                "block text-sm font-medium mb-1 flex items-center gap-2",
                theme === "light" ? "text-[#6C7A73]" : "text-[#ABA9A2]"
              )}>
                <DollarSign className="h-4 w-4" />
                Currency
              </label>
              <p className={cn(
                "font-medium text-sm xs:text-base",
                theme === "light" ? "text-[#1F2A24]" : "text-[#EDEBE6]"
              )}>
                {account?.currency || 'USD'}
              </p>
            </div>

            <div className={cn(
              "rounded-xl p-3 xs:p-4",
              theme === "light" ? "bg-white/50" : "bg-[#141311]/50"
            )}>
              <label className={cn(
                "block text-sm font-medium mb-1 flex items-center gap-2",
                theme === "light" ? "text-[#6C7A73]" : "text-[#ABA9A2]"
              )}>
                <Globe className="h-4 w-4" />
                Timezone
              </label>
              <p className={cn(
                "font-medium text-sm xs:text-base",
                theme === "light" ? "text-[#1F2A24]" : "text-[#EDEBE6]"
              )}>
                {account?.timezone || 'UTC'}
              </p>
            </div>

            <div className={cn(
              "rounded-xl p-3 xs:p-4",
              theme === "light" ? "bg-white/50" : "bg-[#141311]/50"
            )}>
              <label className={cn(
                "block text-sm font-medium mb-1 flex items-center gap-2",
                theme === "light" ? "text-[#6C7A73]" : "text-[#ABA9A2]"
              )}>
                <Calendar className="h-4 w-4" />
                Billing Cycle Day
              </label>
              <p className={cn(
                "font-medium text-sm xs:text-base",
                theme === "light" ? "text-[#1F2A24]" : "text-[#EDEBE6]"
              )}>
                {account?.billing_cycle_day || 25}
              </p>
            </div>
            
            <div className={cn(
              "rounded-xl p-3 xs:p-4",
              theme === "light" ? "bg-white/50" : "bg-[#141311]/50"
            )}>
              <label className={cn(
                "block text-sm font-medium mb-1 flex items-center gap-2",
                theme === "light" ? "text-[#6C7A73]" : "text-[#ABA9A2]"
              )}>
                <Shield className="h-4 w-4" />
                Account Status
              </label>
              <p className={cn(
                "font-medium text-sm xs:text-base",
                user.is_active
                  ? theme === "light" ? "text-[#6BAF92]" : "text-[#88B39B]"
                  : "text-red-400"
              )}>
                {user.is_active ? 'Active' : 'Inactive'}
              </p>
            </div>
            
            <div className={cn(
              "rounded-xl p-3 xs:p-4",
              theme === "light" ? "bg-white/50" : "bg-[#141311]/50"
            )}>
              <label className={cn(
                "block text-sm font-medium mb-1 flex items-center gap-2",
                theme === "light" ? "text-[#6C7A73]" : "text-[#ABA9A2]"
              )}>
                <Shield className="h-4 w-4" />
                Email Verified
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                <p className={cn(
                  "font-medium text-sm xs:text-base",
                  theme === "light" ? "text-[#6BAF92]" : "text-[#88B39B]"
                )}>
                  {user.email_verified ? 'Yes' : 'No'}
                </p>
                {!user.email_verified && (
                  <Button
                    onClick={handleSendVerification}
                    className={cn(
                      "text-xs text-white px-3 py-1",
                      theme === "light"
                        ? "bg-[#6BAF92] hover:bg-[#5E9C7E]"
                        : "bg-[#6BAF92] hover:bg-[#5E9C7E]"
                    )}
                  >
                    Verify
                  </Button>
                )}
              </div>
            </div>
            
            {showVerification && (
              <div className={cn(
                "rounded-xl p-3 xs:p-4",
                theme === "light" ? "bg-white/50" : "bg-[#141311]/50"
              )}>
                <label className={cn(
                  "block text-sm font-medium mb-2",
                  theme === "light" ? "text-[#6C7A73]" : "text-[#ABA9A2]"
                )}>
                  Verification Token
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={verificationToken}
                    onChange={(e) => setVerificationToken(e.target.value)}
                    placeholder="Enter verification token"
                    className={cn(
                      "flex-1 border rounded-lg px-3 xs:px-4 py-2 text-sm xs:text-base focus:outline-none",
                      theme === "light"
                        ? "bg-white border-[#E6E0D6] text-[#1F2A24] focus:border-[#D9B44A]"
                        : "bg-[#201E1B] border-[#38352F] text-[#EDEBE6] focus:border-[#C9A24A]"
                    )}
                  />
                  <Button
                    onClick={handleVerifyEmail}
                    className={cn(
                      "text-white",
                      theme === "light"
                        ? "bg-[#6BAF92] hover:bg-[#5E9C7E]"
                        : "bg-[#6BAF92] hover:bg-[#5E9C7E]"
                    )}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            
            <div className={cn(
              "rounded-xl p-3 xs:p-4",
              theme === "light" ? "bg-white/50" : "bg-[#141311]/50"
            )}>
              <label className={cn(
                "block text-sm font-medium mb-1 flex items-center gap-2",
                theme === "light" ? "text-[#6C7A73]" : "text-[#ABA9A2]"
              )}>
                <Clock className="h-4 w-4" />
                Last Login
              </label>
              <p className={cn(
                "font-medium text-sm xs:text-base",
                theme === "light" ? "text-[#1F2A24]" : "text-[#EDEBE6]"
              )}>
                {user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}
              </p>
            </div>
            
            <div className={cn(
              "rounded-xl p-3 xs:p-4",
              theme === "light" ? "bg-white/50" : "bg-[#141311]/50"
            )}>
              <label className={cn(
                "block text-sm font-medium mb-1 flex items-center gap-2",
                theme === "light" ? "text-[#6C7A73]" : "text-[#ABA9A2]"
              )}>
                <Calendar className="h-4 w-4" />
                Account Created
              </label>
              <p className={cn(
                "font-medium text-sm xs:text-base",
                theme === "light" ? "text-[#1F2A24]" : "text-[#EDEBE6]"
              )}>
                {new Date(user.created_at).toLocaleString()}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
