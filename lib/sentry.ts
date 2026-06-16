"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export function initializeSentry() {
  if (typeof window === "undefined") return;

  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.NODE_ENV,
      release: process.env.NEXT_PUBLIC_APP_VERSION || "0.1.0",
      tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
      replaysSessionSampleRate: 0.0,
      replaysOnErrorSampleRate: 1.0,
      beforeSend(event) {
        // Redact sensitive query params
        if (event.request?.url) {
          try {
            const url = new URL(event.request.url);
            url.searchParams.delete("token");
            url.searchParams.delete("key");
            url.searchParams.delete("secret");
            event.request.url = url.toString();
          } catch {
            // ignore
          }
        }
        return event;
      },
    });
  }
}

export function SentryInitializer() {
  useEffect(() => {
    initializeSentry();
  }, []);

  return null;
}
