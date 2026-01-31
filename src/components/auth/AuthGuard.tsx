"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthentication();
  }, [pathname]);

  const checkAuthentication = () => {
    try {
      // Check if user exists in localStorage
      const userStr = localStorage.getItem("user");
      
      if (!userStr) {
        setIsAuthenticated(false);
        setIsLoading(false);
        // Redirect to signin, preserving the intended destination
        router.push(`/signin?redirect=${encodeURIComponent(pathname)}`);
        return;
      }

      // Parse and validate user data
      const user = JSON.parse(userStr);
      
      // Check if user has required fields
      if (!user || !user.email || !user._id) {
        setIsAuthenticated(false);
        setIsLoading(false);
        router.push(`/signin?redirect=${encodeURIComponent(pathname)}`);
        return;
      }

      // User is authenticated
      setIsAuthenticated(true);
      setIsLoading(false);
    } catch (error) {
      console.error("Error checking authentication:", error);
      setIsAuthenticated(false);
      setIsLoading(false);
      router.push(`/signin?redirect=${encodeURIComponent(pathname)}`);
    }
  };

  // Show loading state while checking authentication
  if (isLoading || isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, don't render children (redirect is happening)
  if (!isAuthenticated) {
    return null;
  }

  // User is authenticated, render children
  return <>{children}</>;
}
