import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { anthropicConfigured, suggestReply } from "@/lib/anthropic";

// Genera un BORRADOR de respuesta a una queja (solo plan Pro) y lo guarda en
// suggested_reply. El dueño lo aprueba o edita antes de enviarlo — este
// endpoint NUNCA envía nada al cliente final. Lo llama directamente el
// navegador del dueño (ComplaintList.tsx), así que usamos el cliente con
// sesión (RLS) en vez de supabaseAdmin: si el feedback no pertenece a un
// negocio del usuario, la lectura ya vuelve vacía por política de RLS.
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
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

    const { data: feedback } = await supabase
      .from("feedback")
      .select("id, comment, business:businesses(name, plan)")
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
      return NextResponse.json({ error: "sin_comentario" }, { status: 400 });
    }

    const reply = await suggestReply(feedback.comment, business.name);

    await supabase
      .from("feedback")
      .update({ suggested_reply: reply })
      .eq("id", feedback.id);

    // Se devuelve el borrador; el envío real lo decide el dueño desde el panel.
    return NextResponse.json({ ok: true, suggested_reply: reply });
  } catch (err) {
    console.error("[ai-suggest-reply] error:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
