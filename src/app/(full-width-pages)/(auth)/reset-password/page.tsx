import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Reset Password | Roomix",
  description: "Reset your password by entering your email address",
};

function ForgotPasswordFormWrapper() {
  return <ForgotPasswordForm />;
}

export default function ResetPassword() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    }>
      <ForgotPasswordFormWrapper />
    </Suspense>
  );
}
