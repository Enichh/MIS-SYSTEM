"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Shield,
  ArrowLeft,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
} from "lucide-react";
import "../styles/verify-code.css";

function VerifyCodeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const type = searchParams.get("type") || "signup"; // signup or login
  const tempToken = searchParams.get("tempToken") || "";

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(60);
  const [attemptsRemaining, setAttemptsRemaining] = useState(5);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Start countdown timer
    const timer = setInterval(() => {
      setResendCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setResendDisabled(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleInputChange = (index: number, value: string) => {
    // Only allow numbers
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all 6 digits are entered
    if (newCode.every((digit) => digit !== "")) {
      handleVerify(newCode.join(""));
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    // Handle backspace
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);

    if (/^\d{6}$/.test(pastedData)) {
      const newCode = pastedData.split("");
      setCode(newCode);
      handleVerify(pastedData);
    }
  };

  const handleVerify = async (verificationCode: string) => {
    if (isLoading || success) return;

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          code: verificationCode,
          type,
          tempToken,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/");
        }, 1500);
      } else {
        setError(data.error || "Invalid verification code");
        setAttemptsRemaining((prev) => prev - 1);

        if (data.attemptsRemaining !== undefined) {
          setAttemptsRemaining(data.attemptsRemaining);
        }

        // Clear code on error
        setCode(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendDisabled || isLoading) return;

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, type }),
      });

      const data = await response.json();

      if (data.success) {
        setResendDisabled(true);
        setResendCountdown(60);
        setAttemptsRemaining(5);
        setCode(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      } else {
        setError(data.error || "Failed to resend code");
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (type === "signup") {
      router.push("/signup");
    } else if (type === "login") {
      router.push("/login");
    } else if (type === "password_reset") {
      router.push("/forgot-password");
    } else {
      router.push("/login");
    }
  };

  if (success) {
    return (
      <div className="verify-page" data-theme="dark">
        <div className="verify-container">
          <div className="verify-header">
            <div className="verify-logo">
              <CheckCircle className="verify-logo-icon verify-logo-icon-success" />
            </div>
            <h1>Verification Successful</h1>
            <p>Redirecting you to the dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="verify-page" data-theme="dark">
      <div className="verify-container">
        <div className="verify-header">
          <div className="verify-logo">
            <Shield className="verify-logo-icon" />
          </div>
          <h1>
            {type === "signup"
              ? "Verify Your Email"
              : type === "login"
                ? "Two-Factor Authentication"
                : "Password Reset Code"}
          </h1>
          <p>
            {type === "signup"
              ? `Enter the 6-digit code sent to ${email}`
              : type === "login"
                ? `Enter the 6-digit code sent to ${email} to complete login`
                : `Enter the 6-digit code sent to ${email} to reset your password`}
          </p>
        </div>

        {error && (
          <div className="verify-error" role="alert">
            <AlertCircle className="verify-error-icon" />
            <span>{error}</span>
          </div>
        )}

        {attemptsRemaining < 5 && attemptsRemaining > 0 && (
          <div className="verify-warning">
            <Clock className="verify-warning-icon" />
            <span>{attemptsRemaining} attempts remaining</span>
          </div>
        )}

        <div className="verify-code-inputs">
          {code.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              className="verify-code-input"
              value={digit}
              onChange={(e) => handleInputChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              disabled={isLoading || success}
              autoFocus={index === 0}
              aria-label={`Digit ${index + 1}`}
            />
          ))}
        </div>

        <div className="verify-resend">
          <button
            type="button"
            className="verify-resend-button"
            onClick={handleResend}
            disabled={resendDisabled || isLoading}
          >
            <RefreshCw
              className={`verify-resend-icon ${
                isLoading ? "verify-spinner" : ""
              }`}
            />
            {resendDisabled ? `Resend in ${resendCountdown}s` : "Resend Code"}
          </button>
        </div>

        <div className="verify-footer">
          <button
            type="button"
            onClick={handleBack}
            className="verify-back-button"
            disabled={isLoading}
          >
            <ArrowLeft />
            Back
          </button>
        </div>

        <div className="verify-security-info">
          <Shield />
          <span>
            {type === "signup"
              ? "Verification code expires in 10 minutes"
              : "Code expires in 5 minutes"}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function VerifyCodePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyCodeContent />
    </Suspense>
  );
}
