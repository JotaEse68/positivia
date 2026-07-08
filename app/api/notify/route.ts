import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sendWhatsApp } from "@/lib/whatsapp";
import { sendEmail } from "@/lib/email";
import { escapeHtml } from "@/lib/html";
import { recordNotificationEvent } from "@/lib/notification-events";

// Recibe un feedbackId (lo dispara /api/feedback tras una queja negativa) y
// alerta al dueño: WhatsApp si está configurado y hay número, si no email.
// En plan Pro, dispara /api/ai-classify de forma async para adjuntar la
// urgencia estimada (la ruta se implementa en FASE 4; el dispatch es
// tolerante a fallos para no bloquear la notificación).
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const feedbackId = typeof body?.feedbackId === "string" ? body.feedbackId : null;
    if (!feedbackId) {
      return NextResponse.json({ error: "feedbackId requerido" }, { status: 400 });
    }

    const supabase = supabaseAdmin();
    const { data: feedback } = await supabase
      .from("feedback")
      .select(
        "id, business_id, rating, comment, created_at, business:businesses(name, plan, whatsapp_owner, email_owner)"
      )
      .eq("id", feedbackId)
      .maybeSingle();

    if (!feedback || !feedback.business) {
      return NextResponse.json({ error: "Feedback no encontrado" }, { status: 404 });
    }

    // Supabase tipa la relación como array; tomamos el primer (único) negocio.
    const business = Array.isArray(feedback.business)
      ? feedback.business[0]
      : feedback.business;

    const when = new Date(feedback.created_at).toLocaleString("es-ES", {
      dateStyle: "short",
      timeStyle: "short",
    });
    const stars = "★".repeat(feedback.rating) + "☆".repeat(5 - feedback.rating);
    const comment = feedback.comment?.trim() || "(sin comentario)";
    const safeBusinessName = escapeHtml(business.name);
    const safeComment = escapeHtml(comment);

    const textBody =
      `⚠️ Nueva queja privada en ${business.name}\n\n` +
      `Valoración: ${stars} (${feedback.rating}/5)\n` +
      `Comentario: ${comment}\n` +
      `Fecha: ${when}\n\n` +
      `Responde desde tu panel de PositivIA.`;

    const htmlBody =
      `<div style="font-family:system-ui,sans-serif;max-width:520px">` +
      `<h2 style="color:#dc2626;margin:0 0 8px">⚠️ Nueva queja privada</h2>` +
      `<p style="margin:0 0 4px"><strong>${safeBusinessName}</strong></p>` +
      `<p style="margin:0 0 4px">Valoración: <strong>${feedback.rating}/5</strong> ${stars}</p>` +
      `<p style="margin:8px 0;padding:12px;background:#f9fafb;border-radius:8px">${safeComment}</p>` +
      `<p style="color:#6b7280;font-size:13px">Recibida el ${when}</p>` +
      `<p style="color:#6b7280;font-size:13px">Responde desde tu panel de PositivIA.</p>` +
      `</div>`;

    // Canal principal: WhatsApp si hay número + credenciales; si no, email.
    let channel: string | null = null;
    let error: string | undefined;

    if (business.whatsapp_owner) {
      const wa = await sendWhatsApp(business.whatsapp_owner, textBody);
      if (wa.sent) channel = "whatsapp";
      else error = wa.error;
    }

    if (!channel && business.email_owner) {
      const mail = await sendEmail(
        business.email_owner,
        `⚠️ Nueva queja en ${business.name}`,
        htmlBody
      );
      if (mail.sent) channel = "email";
      else error = mail.error ?? error;
    }

    // Clasificación de urgencia por IA (solo Pro), fire-and-forget.
    if (business.plan === "pro") {
      try {
        void fetch(`${req.nextUrl.origin}/api/ai-classify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ feedbackId: feedback.id }),
        }).catch(() => {});
      } catch {
        // La notificación no debe fallar por la clasificación.
      }
    }

    if (!channel) {
      console.error("[notify] sin canal disponible:", error);
      await recordNotificationEvent(supabase, {
        businessId: feedback.business_id,
        feedbackId: feedback.id,
        eventType: "complaint_alert",
        channel: "none",
        status: "failed",
        error: error ?? "no_channel_configured",
      });
      return NextResponse.json(
        { ok: false, error: error ?? "no_channel_configured" },
        { status: 502 }
      );
    }

    await recordNotificationEvent(supabase, {
      businessId: feedback.business_id,
      feedbackId: feedback.id,
      eventType: "complaint_alert",
      channel: channel as "whatsapp" | "email",
      status: "sent",
    });

    return NextResponse.json({ ok: true, channel });
  } catch (err) {
    console.error("[notify] error inesperado:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
