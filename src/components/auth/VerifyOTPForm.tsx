"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "@/icons";

export default function VerifyOTPForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showError, setShowError] = useState(false);
  const [step, setStep] = useState<"otp" | "password">("otp");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Focus first input on mount
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleOtpChange = (index: number, value: string) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) {
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits are entered
    if (value && index === 5) {
      const fullOtp = newOtp.join("");
      if (fullOtp.length === 6) {
        handleVerifyOTP(fullOtp);
      }
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split("");
      const newOtp = [...otp];
      digits.forEach((digit, index) => {
        if (index < 6) {
          newOtp[index] = digit;
        }
      });
      setOtp(newOtp);
      
      // Focus last input
      if (inputRefs.current[5]) {
        inputRefs.current[5].focus();
      }
      
      // Auto-verify if all 6 digits are pasted
      if (pastedData.length === 6) {
        setTimeout(() => handleVerifyOTP(pastedData), 100);
      }
    }
  };

  const handleVerifyOTP = async (otpValue?: string) => {
    const otpString = otpValue || otp.join("");
    
    if (otpString.length !== 6) {
      setError("Please enter the complete 6-digit OTP");
      setShowError(true);
      return;
    }

    if (!email) {
      setError("Email is required");
      setShowError(true);
      return;
    }

    try {
      setLoading(true);
      setError("");
      setShowError(false);

      // Verify OTP (we'll verify it when resetting password)
      // For now, just move to password step
      setStep("password");
    } catch (err: any) {
      setError(err.message || "Failed to verify OTP");
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setShowError(false);

    const otpString = otp.join("");

    // Validation
    if (otpString.length !== 6) {
      setError("Please enter the complete 6-digit OTP");
      setShowError(true);
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      setShowError(true);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      setShowError(true);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          otp: otpString,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || "Failed to reset password");
        setShowError(true);
        return;
      }

      // Success - redirect to sign in
      router.push("/signin?passwordReset=true");
    } catch (err: any) {
      setError(err.message || "Failed to reset password");
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  if (step === "otp") {
    return (
      <div className="flex flex-col flex-1 lg:w-1/2 w-full">
        <div className="w-full max-w-md sm:pt-10 mx-auto mb-5">
          <div className="mb-8">
            <Link
              href="/signin"
              className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <ChevronLeftIcon className="w-4 h-4" />
              Back to Sign In
            </Link>
          </div>

          <div className="mb-8">
            <h1 className="mb-2 text-2xl font-bold text-gray-800 dark:text-white/90">
              Verify OTP
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Enter the 6-digit OTP sent to <strong>{email}</strong>
            </p>
          </div>

          {showError && error && (
            <div className="mb-6">
              <Alert variant="error" title="Error" message={error} showLink={false} />
            </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); handleVerifyOTP(); }} className="space-y-6">
            <div>
              <Label>Enter OTP *</Label>
              <div className="flex gap-2 justify-center mt-2">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-brand-500 focus:ring-2 focus:ring-brand-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-brand-400"
                    disabled={loading}
                  />
                ))}
              </div>
            </div>

            <div>
              <Button
                className="w-full"
                size="sm"
                type="submit"
                disabled={loading || otp.join("").length !== 6}
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </Button>
            </div>
          </form>

          <div className="mt-5 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Didn't receive the OTP?{" "}
              <button
                type="button"
                onClick={() => router.push("/reset-password")}
                className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
              >
                Resend
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full">
      <div className="w-full max-w-md sm:pt-10 mx-auto mb-5">
        <div className="mb-8">
          <Link
            href="/signin"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <ChevronLeftIcon className="w-4 h-4" />
            Back to Sign In
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="mb-2 text-2xl font-bold text-gray-800 dark:text-white/90">
            Reset Password
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Enter your new password below.
          </p>
        </div>

        {showError && error && (
          <div className="mb-6">
            <Alert variant="error" title="Error" message={error} showLink={false} />
          </div>
        )}

        <form onSubmit={handleResetPassword} className="space-y-6">
          <div>
            <Label htmlFor="newPassword">New Password *</Label>
            <div className="relative">
              <Input
                id="newPassword"
                name="newPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={loading}
                error={!!error}
              />
              <span
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
              >
                {showPassword ? (
                  <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                ) : (
                  <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                )}
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Password must be at least 6 characters
            </p>
          </div>

          <div>
            <Label htmlFor="confirmPassword">Confirm Password *</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                error={!!error}
              />
              <span
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
              >
                {showConfirmPassword ? (
                  <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                ) : (
                  <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                )}
              </span>
            </div>
          </div>

          <div>
            <Button
              className="w-full"
              size="sm"
              type="submit"
              disabled={loading || !newPassword || !confirmPassword}
            >
              {loading ? "Resetting Password..." : "Reset Password"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
