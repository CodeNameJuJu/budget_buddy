// Robust API client with proper error handling
const BACKEND_URL = 'https://budgetbuddy-production-b70f.up.railway.app/api';

interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    // Get auth token
    const token = localStorage.getItem('access_token');
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Cache-Control': 'no-cache',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    console.log(`API Request: ${options.method || 'GET'} ${url}`);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        // Ensure we don't follow redirects that might return HTML
        redirect: 'manual',
      });

      console.log(`API Response Status: ${response.status}`);
      console.log(`API Response Headers:`, Object.fromEntries(response.headers.entries()));

      // Handle non-JSON responses
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error(`Non-JSON response from ${url}:`, text.substring(0, 200));
        throw new Error(`Server returned non-JSON response. Status: ${response.status}`);
      }

      // Handle error responses
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.message || `HTTP ${response.status}`;
        console.error(`API Error: ${errorMessage}`, errorData);
        throw new Error(errorMessage);
      }

      // Parse successful JSON response
      const data = await response.json();
      console.log(`API Success:`, data);
      return data;

    } catch (error) {
      console.error(`API Request Failed:`, error);
      
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error('Network error occurred');
    }
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'GET',
    });
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }
}

// Create singleton instance
export const apiClient = new ApiClient(BACKEND_URL);

// Export typed methods for auth
export const authApi = {
  login: (credentials: { email: string; password: string }) =>
    apiClient.post('/auth/login', credentials),
  
  register: (credentials: { 
    email: string; 
    password: string; 
    first_name?: string; 
    last_name?: string; 
  }) => apiClient.post('/auth/register', credentials),
  
  refresh: () => apiClient.post('/auth/refresh', {}),
};
