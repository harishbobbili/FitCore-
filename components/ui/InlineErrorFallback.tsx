"use client";

import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import NeonButton from "@/components/ui/NeonButton";

interface InlineErrorFallbackProps {
  error?: Error;
  resetError?: () => void;
  message?: string;
  compact?: boolean;
}

export default function InlineErrorFallback({
  error,
  resetError,
  message,
  compact = false
}: InlineErrorFallbackProps) {
  const handleReset = () => {
    if (resetError) {
      resetError();
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
        <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-rose-200">
            {message || error?.message || "Something went wrong"}
          </p>
        </div>
        {resetError && (
          <NeonButton
            onClick={handleReset}
            variant="purple-outline"
            className="shrink-0"
          >
            <RefreshCw className="w-3 h-3" />
          </NeonButton>
        )}
      </div>
    );
  }

  return (
    <GlassCard className="border border-rose-500/30">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-white mb-1">
              {message || "Something went wrong"}
            </h4>
            <p className="text-xs text-white/60">
              {error?.message || "An unexpected error occurred."}
            </p>
          </div>
        </div>
        {resetError && (
          <NeonButton
            onClick={handleReset}
            variant="purple-outline"
            className="w-full"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </NeonButton>
        )}
      </div>
    </GlassCard>
  );
}
