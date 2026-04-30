import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks';
import { useTheme } from '../../contexts/ThemeContext';
import { cn } from '@/lib/utils';

interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

export const LoginForm: React.FC = () => {
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [errors, setErrors] = useState<Partial<LoginFormData>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const { theme } = useTheme();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;
    // Handle the remember-me checkbox name mismatch
    const fieldName = name === 'remember-me' ? 'rememberMe' : name;
    setFormData(prev => ({ ...prev, [fieldName]: fieldValue }));
    // Clear error when user starts typing
    if (errors[fieldName as keyof LoginFormData]) {
      setErrors(prev => ({ ...prev, [fieldName]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<LoginFormData> = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await login(formData.email, formData.password, formData.rememberMe);
      navigate('/dashboard');
    } catch (error: any) {
      setErrors({ 
        email: error.message || 'Login failed',
        password: error.message || 'Login failed'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn(
      "min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 mobile-safe-area transition-colors duration-300",
      theme === "light" 
        ? "bg-[#F6F4EF]" 
        : "bg-gradient-to-br from-[#0F1512] via-[#18231D] to-[#0F1512]"
    )}>
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className={cn(
            "mx-auto h-12 w-12 flex items-center justify-center rounded-full text-white shadow-lg transition-transform duration-300 hover:scale-110",
            theme === "light"
              ? "bg-gradient-to-br from-[#6BAF92] to-[#5E9C7E]"
              : "bg-gradient-to-br from-[#6BAF92] to-[#5E9C7E]"
          )}>
            <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className={cn(
            "mt-6 text-center text-3xl",
            theme === "light" ? "text-[#6BAF92]" : "text-[#88B39B]"
          )}>
            <span className="brand-name">Sign in to Bêre Bietjie</span>
          </h2>
          <p className={cn(
            "mt-2 text-center text-sm",
            theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]"
          )}>
            Or{' '}
            <Link to="/register" className={cn(
              "font-medium hover:underline",
              theme === "light" ? "text-[#6BAF92] hover:text-[#5E9C7E]" : "text-[#A8D5BA] hover:text-[#6BAF92]"
            )}>
              create a new account
            </Link>
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className={cn(
                "block text-sm font-medium",
                theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]"
              )}>
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className={cn(
                  "mt-1 appearance-none relative block w-full px-3 py-2 border rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 sm:text-sm transition-colors duration-200",
                  errors.email ? 'border-red-400' : theme === "light" ? "border-[#E6E0D6]" : "border-[#2E3B35]",
                  theme === "light"
                    ? "bg-white/80 text-[#1F2A24] focus:ring-[#6BAF92] focus:border-[#6BAF92]"
                    : "bg-[#18231D]/80 text-[#E7EFEA] focus:ring-[#6BAF92] focus:border-[#6BAF92]"
                )}
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-400">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className={cn(
                "block text-sm font-medium",
                theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]"
              )}>
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className={cn(
                    "appearance-none relative block w-full px-3 py-2 pr-10 border rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 sm:text-sm transition-colors duration-200",
                    errors.password ? 'border-red-400' : theme === "light" ? "border-[#E6E0D6]" : "border-[#2E3B35]",
                    theme === "light"
                      ? "bg-white/80 text-[#1F2A24] focus:ring-[#6BAF92] focus:border-[#6BAF92]"
                      : "bg-[#18231D]/80 text-[#E7EFEA] focus:ring-[#6BAF92] focus:border-[#6BAF92]"
                  )}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className={theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]"}>
                    {showPassword ? 'Hide' : 'Show'}
                  </span>
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-400">{errors.password}</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={formData.rememberMe}
                onChange={handleChange}
                className={cn(
                  "h-4 w-4 focus:ring-2 rounded transition-colors duration-200",
                  theme === "light"
                    ? "text-[#6BAF92] focus:ring-[#6BAF92] border-[#E6E0D6] bg-white"
                    : "text-[#6BAF92] focus:ring-[#6BAF92] border-[#2E3B35] bg-[#18231D]"
                )}
              />
              <label htmlFor="remember-me" className={cn(
                "ml-2 block text-sm",
                theme === "light" ? "text-[#6C7A73]" : "text-[#A7B3AD]"
              )}>
                Remember me {formData.rememberMe ? '(ON)' : '(OFF)'}
              </label>
            </div>

            <div className="text-sm">
              <Link to="/forgot-password" className={cn(
                "font-medium hover:underline",
                theme === "light" ? "text-[#6BAF92] hover:text-[#5E9C7E]" : "text-[#A8D5BA] hover:text-[#6BAF92]"
              )}>
                Forgot your password?
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                "group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transform hover:scale-[1.02] transition-all duration-200",
                theme === "light"
                  ? "bg-[#6BAF92] hover:bg-[#5E9C7E] focus:ring-[#6BAF92]"
                  : "bg-[#6BAF92] hover:bg-[#5E9C7E] focus:ring-[#6BAF92]"
              )}
            >
              {isLoading ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                'Sign in'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
