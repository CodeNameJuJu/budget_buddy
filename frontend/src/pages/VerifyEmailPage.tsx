import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../lib/api';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const { theme } = useTheme();

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setStatus('error');
      setMessage('Verification token is missing');
      return;
    }

    const verifyEmail = async () => {
      try {
        await authApi.verifyEmail({ token });
        setStatus('success');
        setMessage('Email verified successfully! Redirecting to login...');
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } catch (error: any) {
        setStatus('error');
        setMessage(error.message || 'Failed to verify email. The link may have expired or is invalid.');
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  return (
    <div className={cn(
      "flex items-center justify-center min-h-screen p-6",
      theme === "light"
        ? "bg-gradient-to-br from-[#F5F0E8] via-[#E8E3D8] to-[#F5F0E8]"
        : "bg-gradient-to-br from-[#1A1D1A] via-[#242824] to-[#1A1D1A]"
    )}>
      <div className={cn(
        "backdrop-blur-md rounded-2xl shadow-xl border p-8 max-w-md w-full",
        theme === "light"
          ? "bg-white/90 border-[#C5C0B5]/30"
          : "bg-[#242824]/90 border-[#3A4038]/30"
      )}>
        {status === 'loading' && (
          <div className="text-center">
            <div className={cn(
              "animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4",
              theme === "light" ? "border-[#8B9A6B]" : "border-[#A8B78F]"
            )}></div>
            <h2 className={cn(
              "text-xl font-semibold mb-2",
              theme === "light" ? "text-[#2D3A28]" : "text-[#E8E3D8]"
            )}>Verifying your email...</h2>
            <p className={cn(
              theme === "light" ? "text-[#5A6B55]" : "text-[#B8B3A8]"
            )}>Please wait while we verify your email address.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <div className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4",
              theme === "light" ? "bg-[#8B9A6B]/20" : "bg-[#8B9A6B]/20"
            )}>
              <svg className={cn(
                "w-8 h-8",
                theme === "light" ? "text-[#8B9A6B]" : "text-[#A8B78F]"
              )} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className={cn(
              "text-xl font-semibold mb-2",
              theme === "light" ? "text-[#2D3A28]" : "text-[#E8E3D8]"
            )}>Email Verified!</h2>
            <p className={cn(
              theme === "light" ? "text-[#5A6B55]" : "text-[#B8B3A8]"
            )}>{message}</p>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className={cn(
              "text-xl font-semibold mb-2",
              theme === "light" ? "text-[#2D3A28]" : "text-[#E8E3D8]"
            )}>Verification Failed</h2>
            <p className={cn(
              "mb-6",
              theme === "light" ? "text-[#5A6B55]" : "text-[#B8B3A8]"
            )}>{message}</p>
            <button
              onClick={() => navigate('/profile')}
              className={cn(
                "px-6 py-2 rounded-lg transition-colors",
                theme === "light"
                  ? "bg-[#8B9A6B] hover:bg-[#6B7A4F] text-white"
                  : "bg-[#8B9A6B] hover:bg-[#6B7A4F] text-white"
              )}
            >
              Go to Profile
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
