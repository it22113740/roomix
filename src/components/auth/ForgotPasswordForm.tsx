"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";
import { ChevronLeftIcon } from "@/icons";

export default function ForgotPasswordForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showError, setShowError] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setShowError(false);
    setSuccess(false);

    // Validation
    if (!email.trim()) {
      setError("Email is required");
      setShowError(true);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      setShowError(true);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || "Failed to send OTP");
        setShowError(true);
        return;
      }

      setSuccess(true);
      // Redirect to OTP verification page after 2 seconds
      setTimeout(() => {
        router.push(`/verify-otp?email=${encodeURIComponent(email)}`);
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to send OTP");
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

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
            Forgot Password?
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Enter your email address and we'll send you an OTP to reset your password.
          </p>
        </div>

        {showError && error && (
          <div className="mb-6">
            <Alert variant="error" title="Error" message={error} showLink={false} />
          </div>
        )}

        {success && (
          <div className="mb-6">
            <Alert
              variant="success"
              title="Success!"
              message="OTP has been sent to your email address. Redirecting to verification page..."
              showLink={false}
            />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading || success}
              error={!!error && !success}
              hint={error && !success ? error : undefined}
            />
          </div>

          <div>
            <Button
              className="w-full"
              size="sm"
              type="submit"
              disabled={loading || success}
            >
              {loading ? "Sending OTP..." : success ? "OTP Sent!" : "Send OTP"}
            </Button>
          </div>
        </form>

        <div className="mt-5">
          <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
            Remember your password?{" "}
            <Link
              href="/signin"
              className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
