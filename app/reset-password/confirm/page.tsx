'use client';

import { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Eye, EyeOff, Shield, AlertCircle, CheckCircle, KeyRound } from 'lucide-react';
import { createBrowserSupabaseClient } from '@/lib/auth/client';
import '../../styles/login.css';

function ResetPasswordContent() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ password?: string; confirmPassword?: string }>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const validateForm = (): boolean => {
    const errors: { password?: string; confirmPassword?: string } = {};

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      errors.password = 'Password must contain uppercase, lowercase, and number';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createBrowserSupabaseClient();

      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        if (updateError.message.includes('same password')) {
          setError('New password must be different from your current password');
        } else {
          setError(updateError.message);
        }
        return;
      }

      setSuccess(true);

      setTimeout(() => {
        router.push('/login');
      }, 3000);
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
            <h1>Password Reset Successful</h1>
            <p>Your password has been updated successfully</p>
          </div>

          <div
            className="login-success login-center"
            role="status"
          >
            <KeyRound className="login-large-icon" />
            <span>
              You can now log in with your new password. Redirecting to login page...
            </span>
          </div>

          <button
            type="button"
            className="login-submit"
            onClick={() => router.push('/login')}
          >
            Go to Login
          </button>

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
          <h1>Create New Password</h1>
          <p>Enter your new password below</p>
        </div>

        {error && (
          <div className="login-error" role="alert">
            <AlertCircle className="login-error-icon" />
            <span>{error}</span>
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <div className="login-form-field">
            <label htmlFor="password" className="login-form-label">
              New Password<span className="required">*</span>
            </label>
            <div className="login-input-wrapper">
              <Lock className="login-input-icon" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className={`login-input ${fieldErrors.password ? 'login-input-error' : ''}`}
                placeholder="Create a strong password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) {
                    setFieldErrors((prev) => ({ ...prev, password: undefined }));
                  }
                }}
                disabled={isLoading}
                autoComplete="new-password"
                autoFocus
                required
              />
              <button
                type="button"
                className="login-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </button>
            </div>
            {fieldErrors.password && (
              <span className="form-error">{fieldErrors.password}</span>
            )}
          </div>

          <div className="login-form-field">
            <label htmlFor="confirmPassword" className="login-form-label">
              Confirm New Password<span className="required">*</span>
            </label>
            <div className="login-input-wrapper">
              <Lock className="login-input-icon" />
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                className={`login-input ${fieldErrors.confirmPassword ? 'login-input-error' : ''}`}
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (fieldErrors.confirmPassword) {
                    setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                  }
                }}
                disabled={isLoading}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="login-password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isLoading}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff /> : <Eye />}
              </button>
            </div>
            {fieldErrors.confirmPassword && (
              <span className="form-error">{fieldErrors.confirmPassword}</span>
            )}
          </div>

          <button
            type="submit"
            className={`login-submit ${isLoading ? 'login-submit-loading' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? 'Updating Password...' : 'Reset Password'}
          </button>
        </form>

        <div className="login-security-info">
          <Shield />
          <span>Secured with enterprise-grade encryption</span>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordConfirmPage() {
  return (
    <Suspense fallback={
      <div className="login-page">
        <div className="login-container">
          <div className="login-header">
            <div className="login-logo">
              <Shield className="login-logo-icon" />
            </div>
            <h1>Loading...</h1>
          </div>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
