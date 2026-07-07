import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@/lib/api';

// Types
interface User {
  id: number;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  is_active: boolean;
  email_verified: boolean;
  last_login?: string | null;
  created_at: string;
  updated_at: string;
  profile_picture_url?: string | null;
}

interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterCredentials {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  timezone?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

// API base URL
const API_BASE = import.meta.env.VITE_API_BASE || 'https://budgetbuddy-production-b70f.up.railway.app/api';

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Check for existing tokens on mount
  useEffect(() => {
    const initAuth = async () => {
      // Check both localStorage and sessionStorage for tokens
      const localStorageToken = localStorage.getItem('access_token');
      const sessionStorageToken = sessionStorage.getItem('access_token');
      const accessToken = localStorageToken || sessionStorageToken;
      
      const localStorageRefresh = localStorage.getItem('refresh_token');
      const sessionStorageRefresh = sessionStorage.getItem('refresh_token');
      const refreshToken = localStorageRefresh || sessionStorageRefresh;

      if (accessToken && refreshToken) {
        try {
          // Validate access token
          const userData = await validateToken(accessToken);
          setUser(userData);
        } catch (error) {
          // Access token invalid, try refresh
          try {
            await refreshAccessToken();
          } catch (refreshError) {
            // Refresh failed, clear tokens
            clearTokens();
          }
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const validateToken = async (token: string): Promise<User> => {
    const response = await fetch(`${API_BASE}/auth/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.error(`Token validation failed: ${response.status} ${response.statusText}`);
      throw new Error(`Token validation failed: ${response.status} ${response.statusText}`);
    }

    // Check content type before parsing JSON
    const contentType = response.headers.get('content-type');
    
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Token validation returned non-JSON response:', text.substring(0, 200));
      throw new Error('Token validation returned non-JSON response');
    }

    const data = await response.json();
    return data.data || data;
  };

  const refreshAccessToken = async (): Promise<void> => {
    const refreshToken = localStorage.getItem('refresh_token') || sessionStorage.getItem('refresh_token');
    if (!refreshToken) {
      console.error('No refresh token available in either storage');
      throw new Error('No refresh token available');
    }

    // Determine which storage type to use based on where the token was found
    const useLocalStorage = localStorage.getItem('refresh_token') === refreshToken;

    console.log('Attempting to refresh access token...');

    const response = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      console.error(`Token refresh failed: ${response.status} ${response.statusText}`);
      throw new Error(`Token refresh failed: ${response.status} ${response.statusText}`);
    }

    // Check content type before parsing JSON
    const contentType = response.headers.get('content-type');
    
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Token refresh returned non-JSON response:', text.substring(0, 200));
      throw new Error('Token refresh returned non-JSON response');
    }

    const data: AuthResponse = await response.json();
    console.log('Token refresh successful');
    // Use the same storage type as before
    setTokens(data, useLocalStorage);
    setUser(data.user);
  };

  const setTokens = (data: AuthResponse, rememberMe: boolean = false) => {
    console.log('Setting tokens, rememberMe:', rememberMe);
    
    // Clear any tokens from BOTH storages first. Leaving stale tokens behind
    // (e.g. from a previous user who used a different rememberMe setting)
    // caused the auth bootstrap to pick up the wrong user's session, which
    // leaked another user's information onto the dashboard.
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('token_expires_at');
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('refresh_token');
    sessionStorage.removeItem('token_expires_at');

    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem('access_token', data.access_token);
    storage.setItem('refresh_token', data.refresh_token);
    storage.setItem('token_expires_at', (Date.now() + data.expires_in * 1000).toString());
    
    console.log('Tokens stored in:', rememberMe ? 'localStorage' : 'sessionStorage');
  };

  const clearTokens = () => {
    console.log('Clearing tokens from both storage locations');
    // Clear from both storage locations
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('token_expires_at');
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('refresh_token');
    sessionStorage.removeItem('token_expires_at');
    setUser(null);
  };

  const login = async (email: string, password: string, rememberMe: boolean = false): Promise<void> => {
    setIsLoading(true);
    try {
      const data = await authApi.login({ email, password });
      setTokens({
        user: data.user,
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        token_type: data.token_type || 'Bearer',
        expires_in: data.expires_in || 3600,
      }, rememberMe);
      setUser(data.user);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (credentials: RegisterCredentials): Promise<void> => {
    setIsLoading(true);
    try {
      const data = await authApi.register(credentials);
      setTokens({
        user: data.user,
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        token_type: data.token_type || 'Bearer',
        expires_in: data.expires_in || 3600,
      }, true);
      setUser(data.user);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    console.log('Logging out user');
    try {
      // Try to call logout API, but don't fail if it doesn't work
      await authApi.logout();
    } catch (error) {
      // Even if logout API fails, clear local tokens
      console.error('Logout API error:', error);
    } finally {
      clearTokens();
      navigate('/login');
    }
  };

  const refreshToken = async (): Promise<void> => {
    try {
      await refreshAccessToken();
    } catch (error) {
      clearTokens();
      navigate('/login');
      throw error;
    }
  };

  const updateProfile = async (data: Partial<User>): Promise<void> => {
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) {
      throw new Error('No access token available');
    }

    const response = await fetch(`${API_BASE}/auth/profile`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Profile update failed');
    }

    const updatedUser = await response.json();
    setUser(updatedUser.data || updatedUser);
  };

  // Auto-refresh token before expiry
  useEffect(() => {
    if (!user) return;

    const checkTokenExpiry = () => {
      // Check both storage locations for token expiry
      const localStorageExpires = localStorage.getItem('token_expires_at');
      const sessionStorageExpires = sessionStorage.getItem('token_expires_at');
      const expiresAt = localStorageExpires || sessionStorageExpires;
      
      if (!expiresAt) return;

      const timeUntilExpiry = parseInt(expiresAt) - Date.now();
      if (timeUntilExpiry < 5 * 60 * 1000) { // 5 minutes before expiry
        refreshToken().catch((error) => {
          console.error('Auto-refresh failed:', error);
          // Navigate to login on refresh failure
          navigate('/login');
        });
      }
    };

    const interval = setInterval(checkTokenExpiry, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [user, navigate]);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshToken,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Hook to get current user
export const useCurrentUser = (): User | null => {
  const { user } = useAuth();
  return user;
};

// Hook to check if user is authenticated
export const useIsAuthenticated = (): boolean => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated;
};
