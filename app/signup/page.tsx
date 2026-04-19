"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Building2,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
} from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/auth/client";
import "../styles/login.css";

interface SignupFormData {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
}

interface FieldErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  fullName?: string;
}

export default function SignupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingExisting, setIsCheckingExisting] = useState(true);
  const [hasExistingAdmins, setHasExistingAdmins] = useState<boolean | null>(
    null,
  );
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState<SignupFormData>({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
  });

  useEffect(() => {
    checkExistingAdmins();
  }, []);

  const checkExistingAdmins = async () => {
    try {
      const response = await fetch("/api/auth/check-admins");
      const data = await response.json();
      setHasExistingAdmins(data.hasAdmins);
    } catch {
      setHasExistingAdmins(true);
    } finally {
      setIsCheckingExisting(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: FieldErrors = {};

    if (!formData.fullName.trim()) {
      errors.fullName = "Full name is required";
    }

    if (!formData.email) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      errors.password =
        "Password must contain uppercase, lowercase, and number";
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createBrowserSupabaseClient();

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName.trim(),
            role: hasExistingAdmins ? "admin" : "super_admin",
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      if (!data.user) {
        setError("Failed to create account. Please try again.");
        return;
      }

      setSuccess(
        "Account created successfully! Please check your email to verify your account before logging in.",
      );

      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof SignupFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  if (isCheckingExisting) {
    return (
      <div className="login-page" data-theme="dark">
        <div className="login-container">
          <div className="login-header">
            <div className="login-logo">
              <Building2 className="login-logo-icon" />
            </div>
            <h1>Loading...</h1>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page" data-theme="dark">
      <div className="login-container">
        <div className="login-header">
          <div className="login-logo">
            <Building2 className="login-logo-icon" />
          </div>
          <h1>Create Admin Account</h1>
          <p>
            {hasExistingAdmins
              ? "Sign up to create a new admin account"
              : "Initial setup: Create the first super admin account"}
          </p>
        </div>

        {success && (
          <div className="login-success" role="alert">
            <CheckCircle className="login-success-icon" />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="login-error" role="alert">
            <AlertCircle className="login-error-icon" />
            <span>{error}</span>
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <div className="login-form-field">
            <label htmlFor="fullName" className="login-form-label">
              Full Name<span className="required">*</span>
            </label>
            <div className="login-input-wrapper">
              <User className="login-input-icon" />
              <input
                id="fullName"
                type="text"
                className={`login-input ${fieldErrors.fullName ? "login-input-error" : ""}`}
                placeholder="John Doe"
                value={formData.fullName}
                onChange={(e) => handleInputChange("fullName", e.target.value)}
                disabled={isLoading || !!success}
                autoComplete="name"
                autoFocus
                required
              />
            </div>
            {fieldErrors.fullName && (
              <span className="form-error">{fieldErrors.fullName}</span>
            )}
          </div>

          <div className="login-form-field">
            <label htmlFor="email" className="login-form-label">
              Email Address<span className="required">*</span>
            </label>
            <div className="login-input-wrapper">
              <Mail className="login-input-icon" />
              <input
                id="email"
                type="email"
                className={`login-input ${fieldErrors.email ? "login-input-error" : ""}`}
                placeholder="admin@example.com"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                disabled={isLoading || !!success}
                autoComplete="email"
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
                type={showPassword ? "text" : "password"}
                className={`login-input ${fieldErrors.password ? "login-input-error" : ""}`}
                placeholder="Create a strong password"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                disabled={isLoading || !!success}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="login-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
                aria-label={showPassword ? "Hide password" : "Show password"}
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
              Confirm Password<span className="required">*</span>
            </label>
            <div className="login-input-wrapper">
              <Lock className="login-input-icon" />
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                className={`login-input ${fieldErrors.confirmPassword ? "login-input-error" : ""}`}
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) =>
                  handleInputChange("confirmPassword", e.target.value)
                }
                disabled={isLoading || !!success}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="login-password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isLoading}
                aria-label={
                  showConfirmPassword ? "Hide password" : "Show password"
                }
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
            className={`login-submit ${isLoading ? "login-submit-loading" : ""}`}
            disabled={isLoading || !!success}
          >
            {isLoading ? "Creating Account..." : "Create Account"}
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
          <Building2 />
          <span>Secured with enterprise-grade encryption</span>
        </div>
      </div>
    </div>
  );
}
