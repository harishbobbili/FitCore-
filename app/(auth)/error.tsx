"use client";

import { useEffect } from "react";
import ErrorFallback from "@/components/ui/ErrorFallback";

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error("Auth error:", error);
    }
  }, [error]);

  return (
    <ErrorFallback
      error={error}
      resetError={reset}
      customMessage="Authentication Error"
      context="authentication"
      showHomeButton={false}
      showBackButton={true}
    />
  );
}
