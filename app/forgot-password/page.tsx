"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, ArrowLeft, AlertCircle, Building2, Shield } from "lucide-react";
import "../styles/login.css";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldError, setFieldError] = useState("");

  const validateEmail = (): boolean => {
    if (!email) {
      setFieldError("Email is required");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFieldError("Please enter a valid email address");
      return false;
    }
    setFieldError("");
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateEmail()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          type: "password_reset",
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || "Failed to send reset code");
        return;
      }

      router.push(
        `/verify-code?email=${encodeURIComponent(email.trim())}&type=password_reset`,
      );
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page" data-theme="dark">
      <div className="login-container">
        <div className="login-header">
          <div className="login-logo">
            <Building2 className="login-logo-icon" />
          </div>
          <h1>Reset Password</h1>
          <p>
            Enter your email address and we&apos;ll send you a link to reset
            your password
          </p>
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
                className={`login-input ${fieldError ? "login-input-error" : ""}`}
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldError) setFieldError("");
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
            className={`login-submit ${isLoading ? "login-submit-loading" : ""}`}
            disabled={isLoading}
          >
            {isLoading ? "Sending..." : "Send Verification Code"}
          </button>
        </form>

        <div className="login-footer">
          <button
            type="button"
            onClick={() => router.push("/login")}
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
