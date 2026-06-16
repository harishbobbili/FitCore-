import * as Sentry from "@sentry/nextjs";

export function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    Sentry.init({
      dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.NODE_ENV,
      release: process.env.NEXT_PUBLIC_APP_VERSION || "0.1.0",
      tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
      profilesSampleRate: process.env.NODE_ENV === "production" ? 0.05 : 0.5,
      beforeSend(event) {
        // Sanitize sensitive data before sending to Sentry
        if (event.request?.headers) {
          const headers = event.request.headers as Record<string, string>;
          delete headers["authorization"];
          delete headers["cookie"];
          delete headers["x-api-key"];
        }
        return event;
      },
    });
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    Sentry.init({
      dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 0.1,
      beforeSend(event) {
        if (event.request?.headers) {
          const headers = event.request.headers as Record<string, string>;
          delete headers["authorization"];
          delete headers["cookie"];
        }
        return event;
      },
    });
  }
}

export function onRequestError(
  err: Error,
  request: Request,
  context: { route: string; headers: Headers }
): void {
  Sentry.captureException(err, {
    contexts: {
      request: {
        url: request.url,
        method: request.method,
        headers: Object.fromEntries(context.headers.entries()),
      },
      route: {
        path: context.route,
      },
    },
  });
}
