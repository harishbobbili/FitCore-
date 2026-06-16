"use client";

import { useEffect } from "react";
import ErrorFallback from "@/components/ui/ErrorFallback";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("Application error:", error);
    }
  }, [error]);

  return (
    <ErrorFallback
      error={error}
      resetError={reset}
      customMessage="Application Error"
      context="the application"
      showHomeButton={true}
      showBackButton={false}
    />
  );
}
