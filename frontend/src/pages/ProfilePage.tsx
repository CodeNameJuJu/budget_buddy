import { useAuth } from '../hooks';
import { Button } from '../components/ui/button';

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
    return <div>Loading...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Profile</h1>
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">User Information</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <p className="text-gray-900">{user.email}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <p className="text-gray-900">
              {user.first_name || ''} {user.last_name || ''} {(user.first_name || user.last_name) ? '' : 'N/A'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Account Status</label>
            <p className="text-gray-900">
              {user.is_active ? 'Active' : 'Inactive'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email Verified</label>
            <p className="text-gray-900">
              {user.email_verified ? 'Yes' : 'No'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Last Login</label>
            <p className="text-gray-900">
              {user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Account Created</label>
            <p className="text-gray-900">
              {new Date(user.created_at).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Actions</h2>
        <Button
          onClick={handleLogout}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          Logout
        </Button>
      </div>
    </div>
  );
}
