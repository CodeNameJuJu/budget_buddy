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
        ? "bg-gradient-to-br from-[#F6F4EF] via-[#E8DCC5] to-[#F6F4EF]"
        : "bg-gradient-to-br from-[#141311] via-[#201E1B] to-[#141311]"
    )}>
      <div className={cn(
        "backdrop-blur-md rounded-2xl shadow-xl border p-8 max-w-md w-full",
        theme === "light"
          ? "bg-white/90 border-[#E6E0D6]/30"
          : "bg-[#201E1B]/90 border-[#38352F]/30"
      )}>
        {status === 'loading' && (
          <div className="text-center">
            <div className={cn(
              "animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4",
              theme === "light" ? "border-[#6BAF92]" : "border-[#A8D5BA]"
            )}></div>
            <h2 className={cn(
              "text-xl font-semibold mb-2",
              theme === "light" ? "text-[#1F2A24]" : "text-[#EDEBE6]"
            )}>Verifying your email...</h2>
            <p className={cn(
              theme === "light" ? "text-[#6C7A73]" : "text-[#ABA9A2]"
            )}>Please wait while we verify your email address.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <div className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4",
              theme === "light" ? "bg-[#6BAF92]/20" : "bg-[#6BAF92]/20"
            )}>
              <svg className={cn(
                "w-8 h-8",
                theme === "light" ? "text-[#6BAF92]" : "text-[#A8D5BA]"
              )} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className={cn(
              "text-xl font-semibold mb-2",
              theme === "light" ? "text-[#1F2A24]" : "text-[#EDEBE6]"
            )}>Email Verified!</h2>
            <p className={cn(
              theme === "light" ? "text-[#6C7A73]" : "text-[#ABA9A2]"
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
              theme === "light" ? "text-[#1F2A24]" : "text-[#EDEBE6]"
            )}>Verification Failed</h2>
            <p className={cn(
              "mb-6",
              theme === "light" ? "text-[#6C7A73]" : "text-[#ABA9A2]"
            )}>{message}</p>
            <button
              onClick={() => navigate('/profile')}
              className={cn(
                "px-6 py-2 rounded-lg transition-colors",
                theme === "light"
                  ? "bg-[#6BAF92] hover:bg-[#5E9C7E] text-white"
                  : "bg-[#6BAF92] hover:bg-[#5E9C7E] text-white"
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
