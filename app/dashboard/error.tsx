"use client";

import { useEffect } from "react";
import ErrorFallback from "@/components/ui/ErrorFallback";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error("Dashboard error:", error);
    }
  }, [error]);

  return (
    <ErrorFallback
      error={error}
      resetError={reset}
      customMessage="Dashboard Error"
      context="the dashboard"
      showHomeButton={true}
      showBackButton={false}
    />
  );
}
