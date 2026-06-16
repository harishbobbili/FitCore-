"use client";

import React from "react";
import { AlertCircle, RefreshCw, Home, ArrowLeft } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import NeonButton from "@/components/ui/NeonButton";

interface ErrorFallbackProps {
  error?: Error;
  resetError?: () => void;
  showHomeButton?: boolean;
  showBackButton?: boolean;
  customMessage?: string;
  context?: string;
}

export default function ErrorFallback({
  error,
  resetError,
  showHomeButton = true,
  showBackButton = false,
  customMessage,
  context = "this page"
}: ErrorFallbackProps) {
  const handleReset = () => {
    if (resetError) {
      resetError();
    } else {
      window.location.reload();
    }
  };

  const goHome = () => {
    window.location.href = "/dashboard";
  };

  const goBack = () => {
    window.history.back();
  };

  return (
    <div className="min-h-screen bg-brandBg flex items-center justify-center p-6">
      <GlassCard className="max-w-md w-full border border-rose-500/30">
        <div className="text-center space-y-6">
          {/* Error Icon */}
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-rose-400" />
            </div>
          </div>

          {/* Error Message */}
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white">
              {customMessage || "Something went wrong"}
            </h3>
            <p className="text-sm text-white/60">
              {error?.message || `An unexpected error occurred while loading ${context}.`}
            </p>
          </div>

          {/* Error Details (Development Only) */}
          {process.env.NODE_ENV === "development" && error?.stack && (
            <details className="text-left">
              <summary className="text-xs text-white/40 cursor-pointer hover:text-white/60">
                Show error details
              </summary>
              <pre className="mt-2 text-xs text-white/30 bg-black/20 p-3 rounded-lg overflow-auto max-h-40">
                {error.stack}
              </pre>
            </details>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            {resetError && (
              <NeonButton
                onClick={handleReset}
                className="w-full"
                variant="gradient"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </NeonButton>
            )}

            <div className="flex gap-3">
              {showBackButton && (
                <NeonButton
                  onClick={goBack}
                  className="flex-1"
                  variant="cyan-outline"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Go Back
                </NeonButton>
              )}
              {showHomeButton && (
                <NeonButton
                  onClick={goHome}
                  className="flex-1"
                  variant="purple-outline"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Dashboard
                </NeonButton>
              )}
            </div>
          </div>

          {/* Help Text */}
          <p className="text-xs text-white/40">
            If this problem persists, please try refreshing the page or contact support.
          </p>
        </div>
      </GlassCard>
    </div>
  );
}
