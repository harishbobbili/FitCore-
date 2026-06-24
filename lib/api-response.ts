import { NextResponse } from "next/server";
import { ZodError } from "zod";

// ─── Typed response shapes ────────────────────────────────────────────────────

export type ApiSuccess<T = unknown> = {
  success: true;
  data: T;
};

export type ApiError = {
  success: false;
  error: string;
  /** Field-level validation errors from Zod */
  fieldErrors?: Record<string, string[]>;
};

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

// ─── Response constructors ────────────────────────────────────────────────────

export function ok<T>(data: T, status = 200): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({ success: true, data }, { status });
}

export function created<T>(data: T): NextResponse<ApiSuccess<T>> {
  return ok(data, 201);
}

export function badRequest(message: string): NextResponse<ApiError> {
  return NextResponse.json({ success: false, error: message }, { status: 400 });
}

export function unauthorized(): NextResponse<ApiError> {
  return NextResponse.json(
    { success: false, error: "Unauthorized — please log in." },
    { status: 401 }
  );
}

export function forbidden(): NextResponse<ApiError> {
  return NextResponse.json(
    { success: false, error: "Forbidden — you do not have access to this resource." },
    { status: 403 }
  );
}

export function notFound(resource = "Resource"): NextResponse<ApiError> {
  return NextResponse.json(
    { success: false, error: `${resource} not found.` },
    { status: 404 }
  );
}

export function unprocessable(
  message: string,
  fieldErrors?: Record<string, string[]>
): NextResponse<ApiError> {
  return NextResponse.json(
    { success: false, error: message, fieldErrors },
    { status: 422 }
  );
}

export function tooManyRequests(retryAfterSeconds = 60): NextResponse<ApiError> {
  return NextResponse.json(
    {
      success: false,
      error: `Too many requests. Please wait ${retryAfterSeconds} seconds before trying again.`,
    },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfterSeconds) },
    }
  );
}

export function serverError(message = "An unexpected error occurred. Please try again."): NextResponse<ApiError> {
  return NextResponse.json({ success: false, error: message }, { status: 500 });
}

// ─── Central error handler ────────────────────────────────────────────────────

/**
 * Converts any thrown value into a consistent NextResponse<ApiError>.
 * Use this in the catch block of every route handler.
 *
 * @example
 * } catch (err) {
 *   return handleApiError(err);
 * }
 */
export function handleApiError(error: unknown): NextResponse<ApiError> {
  // Zod validation failures → 422 with per-field messages
  if (error instanceof ZodError) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of error.issues) {
      const path = issue.path.join(".") || "_root";
      if (!fieldErrors[path]) fieldErrors[path] = [];
      fieldErrors[path].push(issue.message);
    }
    return unprocessable("Validation failed. Please check your input.", fieldErrors);
  }

  // Standard Error objects
  if (error instanceof Error) {
    // Don't expose internal messages in production
    const message =
      process.env.NODE_ENV === "production"
        ? "An unexpected error occurred. Please try again."
        : error.message;
    console.error("[API Error]", error);
    return serverError(message);
  }

  // Unknown shapes (strings, objects, etc.)
  console.error("[API Error — unknown shape]", error);
  return serverError();
}
