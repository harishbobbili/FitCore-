import { NextResponse } from "next/server";
import { cleanupRateLimitsViaRpc } from "@/lib/rate-limit";
import { ok, serverError } from "@/lib/api-response";

/**
 * Cron endpoint to purge expired rate-limit buckets.
 *
 * Trigger this via:
 *   - Vercel Cron:  add to vercel.json
 *   - Supabase Cron: schedule in Supabase Dashboard
 *   - Manual:       curl -X POST /api/cron/rate-limit-cleanup?token=<CRON_SECRET>
 *
 * Expected response: { success: true, data: { deleted: number } }
 */
export async function POST(request: Request) {
  try {
    // Optional: verify a simple secret token if CRON_SECRET is set
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    const expected = process.env.CRON_SECRET;

    if (expected && token !== expected) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const deleted = await cleanupRateLimitsViaRpc();

    if (deleted === null) {
      return ok({ deleted: 0, note: "Supabase unavailable — nothing to clean." });
    }

    return ok({ deleted });
  } catch (error) {
    console.error("[Cron] Rate-limit cleanup failed:", error);
    return serverError("Rate-limit cleanup failed.");
  }
}
