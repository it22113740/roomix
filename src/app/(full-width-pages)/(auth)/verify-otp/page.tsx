import VerifyOTPForm from "@/components/auth/VerifyOTPForm";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Verify OTP | Roomix",
  description: "Verify the OTP sent to your email address",
};

function VerifyOTPFormWrapper() {
  return <VerifyOTPForm />;
}

export default function VerifyOTP() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    }>
      <VerifyOTPFormWrapper />
    </Suspense>
  );
}
