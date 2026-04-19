'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, ArrowLeft, AlertCircle, CheckCircle, Shield, Send } from 'lucide-react';
import { createBrowserSupabaseClient } from '@/lib/auth/client';
import '../styles/login.css';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [fieldError, setFieldError] = useState('');

  const validateEmail = (): boolean => {
    if (!email) {
      setFieldError('Email is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFieldError('Please enter a valid email address');
      return false;
    }
    setFieldError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateEmail()) {
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createBrowserSupabaseClient();

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: `${window.location.origin}/reset-password/confirm`,
        }
      );

      if (resetError) {
        setError(resetError.message);
        return;
      }

      setSuccess(true);
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="login-page">
        <div className="login-container">
          <div className="login-header">
            <div className="login-logo">
              <CheckCircle className="login-logo-icon login-logo-icon-success" />
            </div>
            <h1>Check Your Email</h1>
            <p>
              We&apos;ve sent a password reset link to <strong>{email}</strong>
            </p>
          </div>

          <div
            className="login-success login-center"
            role="status"
          >
            <Send className="login-large-icon" />
            <span>
              Please check your inbox and click the link to reset your password. The link will expire in 1 hour.
            </span>
          </div>

          <div className="login-footer">
            <p className="login-footer-text">
              Didn&apos;t receive the email? Check your spam folder or try again.
            </p>
            <button
              type="button"
              onClick={() => {
                setSuccess(false);
                setEmail('');
              }}
              className="login-back-button"
            >
              <Send />
              Resend Email
            </button>
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="login-back-button"
            >
              <ArrowLeft />
              Back to Login
            </button>
          </div>

          <div className="login-security-info">
            <Shield />
            <span>Secured with enterprise-grade encryption</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <div className="login-logo">
            <Shield className="login-logo-icon" />
          </div>
          <h1>Reset Password</h1>
          <p>Enter your email address and we&apos;ll send you a link to reset your password</p>
        </div>

        {error && (
          <div className="login-error" role="alert">
            <AlertCircle className="login-error-icon" />
            <span>{error}</span>
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <div className="login-form-field">
            <label htmlFor="email" className="login-form-label">
              Email Address<span className="required">*</span>
            </label>
            <div className="login-input-wrapper">
              <Mail className="login-input-icon" />
              <input
                id="email"
                type="email"
                className={`login-input ${fieldError ? 'login-input-error' : ''}`}
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldError) setFieldError('');
                }}
                disabled={isLoading}
                autoComplete="email"
                autoFocus
                required
              />
            </div>
            {fieldError && <span className="form-error">{fieldError}</span>}
          </div>

          <button
            type="submit"
            className={`login-submit ${isLoading ? 'login-submit-loading' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <div className="login-footer">
          <button
            type="button"
            onClick={() => router.push('/login')}
            className="login-back-button"
          >
            <ArrowLeft />
            Back to Login
          </button>
        </div>

        <div className="login-security-info">
          <Shield />
          <span>Secured with enterprise-grade encryption</span>
        </div>
      </div>
    </div>
  );
}
