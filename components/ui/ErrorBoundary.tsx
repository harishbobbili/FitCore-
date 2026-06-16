"use client";

import React from "react";
import ErrorFallback from "@/components/ui/ErrorFallback";

type Props = { children: React.ReactNode; context?: string };
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
        <ErrorFallback
          error={this.state.error}
          resetError={() => this.setState({ hasError: false, error: undefined })}
          context={this.props.context || "this component"}
          showHomeButton={true}
          showBackButton={false}
        />
      );
    }

    return this.props.children;
  }
}