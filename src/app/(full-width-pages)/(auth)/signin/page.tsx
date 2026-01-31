import SignInForm from "@/components/auth/SignInForm";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Sign In | Roomix - Hotel Admin Management Booking System",
  description: "Sign in to your account to continue",
};

function SignInFormWrapper() {
  return <SignInForm />;
}

export default function SignIn() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    }>
      <SignInFormWrapper />
    </Suspense>
  );
}
