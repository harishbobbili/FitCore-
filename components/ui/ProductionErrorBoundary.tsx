"use client";

import React from "react";
import ErrorFallback from "@/components/ui/ErrorFallback";

interface Props {
  children: React.ReactNode;
  context?: string;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

/**
 * Production-grade Error Boundary with error reporting and recovery
 */
export class ProductionErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ error, errorInfo });

    // Report to Sentry if available
    if (typeof window !== "undefined" && (window as any).__SENTRY__?.hub) {
      (window as any).__SENTRY__.hub.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
        },
      });
    }

    // Log to console in development only
    if (process.env.NODE_ENV === "development") {
      console.error("[ErrorBoundary]", error, errorInfo);
    }

    this.props.onError?.(error, errorInfo);
  }

  reset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorFallback
          error={this.state.error}
          resetError={this.reset}
          context={this.props.context || "this component"}
          showHomeButton={true}
          showBackButton={false}
        />
      );
    }

    return this.props.children;
  }
}

export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  boundaryProps?: Omit<Props, "children">
) {
  return function WrappedComponent(props: P) {
    return (
      <ProductionErrorBoundary {...boundaryProps}>
        <Component {...props} />
      </ProductionErrorBoundary>
    );
  };
}
