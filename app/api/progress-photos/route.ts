import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ProgressPhoto, BodyAnalysisResult } from "@/lib/types";
import { PhotoAngleEnum } from "@/lib/validation";
import { ok, unauthorized, badRequest, notFound, forbidden, serverError, handleApiError } from "@/lib/api-response";
import { getAnthropicKey } from "@/lib/env";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const BUCKET_NAME = "progress-photos";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(request: NextRequest) {
  try {
    if (!SUPABASE_URL || !SUPABASE_KEY) return serverError("Supabase is not configured.");

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return unauthorized();

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const angleRaw = formData.get("angle") as string | null;
    const weight_kg = formData.get("weight_kg") as string | null;
    const notes = formData.get("notes") as string | null;
    const date = formData.get("date") as string | null;

    if (!file) return badRequest("file is required.");

    const angleResult = PhotoAngleEnum.safeParse(angleRaw);
    if (!angleResult.success) return badRequest("Invalid angle. Must be: front, back, side_left, or side_right.");

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return badRequest(`Invalid file type. Allowed: ${ALLOWED_MIME_TYPES.join(", ")}`);
    }
    if (file.size > MAX_FILE_SIZE) {
      return badRequest(`File too large. Max size: ${MAX_FILE_SIZE / 1024 / 1024}MB.`);
    }

    const photoDate = date ?? new Date().toISOString().split("T")[0];
    const ext = file.name.split(".").pop() ?? "jpg";
    const filePath = `${user.id}/${photoDate}_${angleResult.data}_${Date.now()}.${ext}`;

    // Upload to Supabase Storage
    const fileBuffer = await file.arrayBuffer();
    const uploadRes = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET_NAME}/${filePath}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": file.type, "x-upsert": "true" },
      body: fileBuffer,
    });

    if (!uploadRes.ok) {
      console.error("Supabase upload error:", await uploadRes.text());
      return serverError("Failed to upload file.");
    }

    // Signed URL for AI analysis
    const signedUrlRes = await fetch(
      `${SUPABASE_URL}/storage/v1/object/sign/${BUCKET_NAME}/${filePath}?expires=3600`,
      { method: "POST", headers: { Authorization: `Bearer ${SUPABASE_KEY}` } }
    );

    let analysis: BodyAnalysisResult | null = null;
    const apiKey = getAnthropicKey();

    if (signedUrlRes.ok && apiKey) {
      try {
        const { signedUrl } = await signedUrlRes.json();
        const imgBuffer = await (await fetch(signedUrl)).arrayBuffer();
        const base64 = Buffer.from(imgBuffer).toString("base64");

        const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
          },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1024,
            system: `You are a fitness body composition analyst. Analyse the fitness progress photo. Return ONLY valid JSON with keys: estimated_body_fat_pct (number|null), muscle_visibility ('low'|'medium'|'high'), posture_notes (string), progress_summary (string), recommendations (array of 3 strings), comparison_to_previous (null), analyzed_at (ISO string). Be encouraging but accurate. Do not make medical claims.`,
            messages: [{
              role: "user",
              content: [
                { type: "image", source: { type: "base64", media_type: file.type, data: base64 } },
                { type: "text", text: "Analyse this fitness progress photo." },
              ],
            }],
          }),
        });

        if (claudeRes.ok) {
          const claudeData = await claudeRes.json();
          const content = claudeData.content[0]?.text ?? "{}";
          analysis = JSON.parse(content) as BodyAnalysisResult;
          analysis.analyzed_at = new Date().toISOString();
        }
      } catch (err) {
        console.warn("AI photo analysis failed (non-fatal):", err);
      }
    }

    const { data: photo, error: insertError } = await supabase
      .from("progress_photos")
      .insert({
        user_id: user.id,
        date: photoDate,
        photo_url: filePath,
        angle: angleResult.data,
        weight_kg: weight_kg ? parseFloat(weight_kg) : null,
        notes: notes ?? null,
        ai_analysis: analysis,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Fresh signed URL for response
    let finalSignedUrl: string | null = null;
    try {
      const r = await fetch(
        `${SUPABASE_URL}/storage/v1/object/sign/${BUCKET_NAME}/${filePath}?expires=3600`,
        { method: "POST", headers: { Authorization: `Bearer ${SUPABASE_KEY}` } }
      );
      if (r.ok) finalSignedUrl = (await r.json()).signedUrl;
    } catch { /* non-fatal */ }

    return ok({ photo: { ...photo, signed_url: finalSignedUrl }, analysis }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET() {
  try {
    if (!SUPABASE_URL || !SUPABASE_KEY) return serverError("Supabase is not configured.");

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return unauthorized();

    const { data: photos, error } = await supabase
      .from("progress_photos")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Attach signed URLs in parallel
    const photosWithUrls = await Promise.all(
      (photos ?? []).map(async (photo: ProgressPhoto) => {
        try {
          const r = await fetch(
            `${SUPABASE_URL}/storage/v1/object/sign/${BUCKET_NAME}/${photo.photo_url}?expires=3600`,
            { method: "POST", headers: { Authorization: `Bearer ${SUPABASE_KEY}` } }
          );
          return { ...photo, signed_url: r.ok ? (await r.json()).signedUrl : null };
        } catch {
          return { ...photo, signed_url: null };
        }
      })
    );

    return ok(photosWithUrls);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!SUPABASE_URL || !SUPABASE_KEY) return serverError("Supabase is not configured.");

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return unauthorized();

    const { searchParams } = new URL(request.url);
    const photoId = searchParams.get("id");
    if (!photoId) return badRequest("Photo ID is required.");

    const { data: photo, error: fetchError } = await supabase
      .from("progress_photos")
      .select("*")
      .eq("id", photoId)
      .single();

    if (fetchError || !photo) return notFound("Photo");
    if (photo.user_id !== user.id) return forbidden();

    // Delete from storage (non-fatal)
    await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET_NAME}/${photo.photo_url}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${SUPABASE_KEY}` },
    }).catch(e => console.warn("Storage delete failed:", e));

    const { error: deleteError } = await supabase
      .from("progress_photos")
      .delete()
      .eq("id", photoId)
      .eq("user_id", user.id);

    if (deleteError) throw deleteError;
    return ok({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
