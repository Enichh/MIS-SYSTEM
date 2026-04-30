'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, ArrowLeft, AlertCircle, CheckCircle, Shield, Eye, EyeOff } from 'lucide-react';
import '../styles/login.css';

function NewPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({ password: '', confirmPassword: '' });

  const validatePassword = (): boolean => {
    const errors = { password: '', confirmPassword: '' };
    let isValid = true;

    if (!password) {
      errors.password = 'Password is required';
      isValid = false;
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
      isValid = false;
    } else if (!/[A-Z]/.test(password)) {
      errors.password = 'Password must contain at least one uppercase letter';
      isValid = false;
    } else if (!/[a-z]/.test(password)) {
      errors.password = 'Password must contain at least one lowercase letter';
      isValid = false;
    } else if (!/[0-9]/.test(password)) {
      errors.password = 'Password must contain at least one number';
      isValid = false;
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
      isValid = false;
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    setFieldErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validatePassword()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/update-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Failed to update password');
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="login-page" data-theme="dark">
        <div className="login-container">
          <div className="login-header">
            <div className="login-logo">
              <CheckCircle className="login-logo-icon login-logo-icon-success" />
            </div>
            <h1>Password Updated</h1>
            <p>Your password has been successfully updated</p>
          </div>

          <div className="login-success login-center" role="status">
            <CheckCircle className="login-large-icon" />
            <span>Redirecting you to login...</span>
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
            <Lock className="login-logo-icon" />
          </div>
          <h1>Set New Password</h1>
          <p>Create a strong password for your account</p>
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
                placeholder="Enter new password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: '' });
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
            {fieldErrors.password && <span className="form-error">{fieldErrors.password}</span>}
          </div>

          <div className="login-form-field">
            <label htmlFor="confirmPassword" className="login-form-label">
              Confirm Password<span className="required">*</span>
            </label>
            <div className="login-input-wrapper">
              <Lock className="login-input-icon" />
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                className={`login-input ${fieldErrors.confirmPassword ? 'login-input-error' : ''}`}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (fieldErrors.confirmPassword) setFieldErrors({ ...fieldErrors, confirmPassword: '' });
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
            {fieldErrors.confirmPassword && <span className="form-error">{fieldErrors.confirmPassword}</span>}
          </div>

          <button
            type="submit"
            className={`login-submit ${isLoading ? 'login-submit-loading' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? 'Updating...' : 'Update Password'}
          </button>
        </form>

        <div className="login-footer">
          <button
            type="button"
            onClick={() => router.push('/login')}
            className="login-back-button"
            disabled={isLoading}
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

export default function NewPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NewPasswordContent />
    </Suspense>
  );
}
