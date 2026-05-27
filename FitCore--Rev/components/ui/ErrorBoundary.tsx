"use client";

import React from "react";
import GlassCard from "@/components/ui/GlassCard";
import NeonButton from "@/components/ui/NeonButton";

type Props = { children: React.ReactNode };
type State = { hasError: boolean; error?: Error };

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    this.setState({ error });
  }

  render() {
    if (this.state.hasError) {
      return (
        <GlassCard className="border border-rose-500/30">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-white">Something went wrong</h3>
              <p className="text-sm text-white/60">{this.state.error?.message ?? "An unexpected error occurred."}</p>
            </div>
            <NeonButton onClick={() => this.setState({ hasError: false, error: undefined })}>Try Again</NeonButton>
          </div>
        </GlassCard>
      );
    }

    return this.props.children;
  }
}