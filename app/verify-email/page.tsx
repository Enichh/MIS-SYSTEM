'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Shield, CheckCircle, AlertCircle, XCircle, Loader2, Mail } from 'lucide-react';
import { createBrowserSupabaseClient } from '@/lib/auth/client';
import '../styles/login.css';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('Verifying your email address...');
  const [errorDetails, setErrorDetails] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      const token_hash = searchParams.get('token_hash');
      const type = searchParams.get('type');
      const code = searchParams.get('code');

      if (!token_hash && !code) {
        setStatus('error');
        setMessage('Invalid verification link');
        setErrorDetails('The verification link is missing required parameters. Please check your email and try again.');
        return;
      }

      try {
        const supabase = createBrowserSupabaseClient();

        let verifyResult;

        if (token_hash && type) {
          verifyResult = await supabase.auth.verifyOtp({
            token_hash,
            type: type as 'signup' | 'invite' | 'magiclink' | 'recovery' | 'email_change',
          });
        } else if (code) {
          verifyResult = await supabase.auth.exchangeCodeForSession(code);
        }

        if (verifyResult?.error) {
          setStatus('error');
          setMessage('Email verification failed');
          setErrorDetails(verifyResult.error.message);
        } else {
          setStatus('success');
          setMessage('Your email has been verified successfully!');

          setTimeout(() => {
            router.push('/login');
          }, 3000);
        }
      } catch (error) {
        setStatus('error');
        setMessage('An error occurred during verification');
        setErrorDetails(error instanceof Error ? error.message : 'Unknown error');
      }
    };

    verifyEmail();
  }, [searchParams, router]);

  const getStatusIcon = () => {
    switch (status) {
      case 'verifying':
        return <Loader2 className="login-logo-icon login-spinner login-logo-icon-primary" />;
      case 'success':
        return <CheckCircle className="login-logo-icon login-logo-icon-success" />;
      case 'error':
        return <XCircle className="login-logo-icon login-logo-icon-error" />;
    }
  };

  const getStatusClass = () => {
    switch (status) {
      case 'verifying':
        return 'login-header-primary';
      case 'success':
        return 'login-header-success';
      case 'error':
        return 'login-header-error';
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <div className="login-logo">{getStatusIcon()}</div>
          <h1 className={getStatusClass()}>
            {status === 'verifying' && 'Verifying Email'}
            {status === 'success' && 'Email Verified'}
            {status === 'error' && 'Verification Failed'}
          </h1>
          <p>{message}</p>
        </div>

        {status === 'verifying' && (
          <div
            className="login-info login-center"
            role="status"
          >
            <Loader2 className="login-spinner" style={{ width: '24px', height: '24px' }} />
            <span>Please wait while we verify your email address...</span>
          </div>
        )}

        {status === 'success' && (
          <div
            className="login-success login-center"
            role="status"
          >
            <Mail className="login-large-icon" />
            <span>
              Your email has been verified successfully! You can now log in to your account.
              Redirecting to login page...
            </span>
          </div>
        )}

        {status === 'error' && (
          <>
            <div className="login-error" role="alert">
              <AlertCircle className="login-error-icon" />
              <span>{errorDetails}</span>
            </div>

            <div className="login-actions-stack">
              <button
                type="button"
                className="login-submit"
                onClick={() => router.push('/signup')}
              >
                Back to Sign Up
              </button>
              <button
                type="button"
                className="login-submit login-submit-secondary"
                onClick={() => router.push('/login')}
              >
                Go to Login
              </button>
            </div>
          </>
        )}

        {status === 'success' && (
          <button
            type="button"
            className="login-submit"
            onClick={() => router.push('/login')}
          >
            Go to Login
          </button>
        )}

        <div className="login-security-info">
          <Shield />
          <span>Secured with enterprise-grade encryption</span>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="login-page">
        <div className="login-container">
          <div className="login-header">
            <div className="login-logo">
              <Loader2 className="login-logo-icon login-spinner" />
            </div>
            <h1>Loading...</h1>
          </div>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
