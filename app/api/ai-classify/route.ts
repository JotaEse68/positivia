import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { anthropicConfigured, classifyComplaint } from "@/lib/anthropic";
import { isAuthorizedCronRequest } from "@/lib/cron";

// Clasifica la urgencia de una queja (solo plan Pro) y guarda ai_urgency +
// ai_summary_theme. Solo la dispara /api/notify servidor-a-servidor (nunca
// el navegador), así que se protege con el mismo secreto que las crons.
export async function POST(req: NextRequest) {
  try {
    if (!isAuthorizedCronRequest(req)) {
      return NextResponse.json({ error: "no_autorizado" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const feedbackId = typeof body?.feedbackId === "string" ? body.feedbackId : null;
    if (!feedbackId) {
      return NextResponse.json({ error: "feedbackId requerido" }, { status: 400 });
    }
    if (!anthropicConfigured()) {
      return NextResponse.json({ error: "ai_not_configured" }, { status: 503 });
    }

    const supabase = supabaseAdmin();
    const { data: feedback } = await supabase
      .from("feedback")
      .select("id, comment, business:businesses(plan)")
      .eq("id", feedbackId)
      .maybeSingle();

    if (!feedback) {
      return NextResponse.json({ error: "Feedback no encontrado" }, { status: 404 });
    }
    const business = Array.isArray(feedback.business)
      ? feedback.business[0]
      : feedback.business;
    if (business?.plan !== "pro") {
      return NextResponse.json({ error: "solo_pro" }, { status: 403 });
    }
    if (!feedback.comment?.trim()) {
      return NextResponse.json({ ok: true, skipped: "sin_comentario" });
    }

    const { urgency, theme } = await classifyComplaint(feedback.comment);

    await supabase
      .from("feedback")
      .update({ ai_urgency: urgency, ai_summary_theme: theme })
      .eq("id", feedback.id);

    return NextResponse.json({ ok: true, urgency, theme });
  } catch (err) {
    console.error("[ai-classify] error:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
