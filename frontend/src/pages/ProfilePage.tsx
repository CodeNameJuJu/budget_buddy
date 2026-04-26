import { useAuth } from '../hooks';
import { Button } from '../components/ui/button';
import { LogOut, Mail, User as UserIcon, Shield, Calendar, Clock } from 'lucide-react';

export default function ProfilePage() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-300 to-teal-300 bg-clip-text text-transparent">
          Profile
        </h1>
        <p className="text-slate-400 mt-1">Manage your account settings</p>
      </div>
      
      <div className="bg-slate-800/90 backdrop-blur-md rounded-2xl shadow-xl border border-blue-900/30 p-6 mb-6">
        <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
          <UserIcon className="h-5 w-5 text-blue-400" />
          User Information
        </h2>
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
              <Shield className="h-4 w-4" />
              Account Status
            </label>
            <p className={`font-medium ${user.is_active ? 'text-teal-400' : 'text-red-400'}`}>
              {user.is_active ? 'Active' : 'Inactive'}
            </p>
          </div>
          
          <div className="bg-slate-900/50 rounded-xl p-4">
            <label className="block text-sm font-medium text-slate-400 mb-1 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Email Verified
            </label>
            <p className={`font-medium ${user.email_verified ? 'text-teal-400' : 'text-amber-400'}`}>
              {user.email_verified ? 'Yes' : 'No'}
            </p>
          </div>
          
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
      </div>

      <div className="bg-slate-800/90 backdrop-blur-md rounded-2xl shadow-xl border border-blue-900/30 p-6">
        <h2 className="text-xl font-semibold text-white mb-6">Actions</h2>
        <Button
          onClick={handleLogout}
          className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  );
}
