'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, Shield, AlertCircle, Clock } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import '../styles/login.css';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, isRateLimited, rateLimitRemainingSeconds } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  const validateForm = (): boolean => {
    const errors: { email?: string; password?: string } = {};
    
    if (!email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isRateLimited) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    const result = await login({
      email: email.trim(),
      password,
      rememberMe,
    });

    if (result.success) {
      // Redirect to home page on successful login
      router.push('/');
      router.refresh();
    } else {
      setError(result.error || 'Login failed. Please try again.');
    }
  };

  const formatLockoutTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds} seconds`;
    }
    const minutes = Math.ceil(seconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <div className="login-logo">
            <Shield className="login-logo-icon" />
          </div>
          <h1>Admin Login</h1>
          <p>Sign in to access the Management Information System</p>
        </div>

        {isRateLimited && (
          <div className="login-rate-limit" role="alert">
            <Clock className="login-rate-limit-icon" />
            <span>
              Too many failed attempts. Please try again in{' '}
              {formatLockoutTime(rateLimitRemainingSeconds)}.
            </span>
          </div>
        )}

        {error && !isRateLimited && (
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
                className={`login-input ${fieldErrors.email ? 'login-input-error' : ''}`}
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) {
                    setFieldErrors((prev) => ({ ...prev, email: undefined }));
                  }
                }}
                disabled={isLoading || isRateLimited}
                autoComplete="email"
                autoFocus
                required
              />
            </div>
            {fieldErrors.email && (
              <span className="form-error">{fieldErrors.email}</span>
            )}
          </div>

          <div className="login-form-field">
            <label htmlFor="password" className="login-form-label">
              Password<span className="required">*</span>
            </label>
            <div className="login-input-wrapper">
              <Lock className="login-input-icon" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className={`login-input ${fieldErrors.password ? 'login-input-error' : ''}`}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) {
                    setFieldErrors((prev) => ({ ...prev, password: undefined }));
                  }
                }}
                disabled={isLoading || isRateLimited}
                autoComplete="current-password"
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

          <div className="login-options">
            <label className="login-remember">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isLoading || isRateLimited}
              />
              Remember me
            </label>
          </div>

          <button
            type="submit"
            className={`login-submit ${isLoading ? 'login-submit-loading' : ''}`}
            disabled={isLoading || isRateLimited}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="login-footer">
          <p>Admin access only. Unauthorized attempts are logged.</p>
        </div>

        <div className="login-security-info">
          <Shield />
          <span>Secured with enterprise-grade encryption</span>
        </div>
      </div>
    </div>
  );
}
