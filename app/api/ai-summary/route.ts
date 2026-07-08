import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { anthropicConfigured, summarizeWeek } from "@/lib/anthropic";
import { sendWhatsApp } from "@/lib/whatsapp";
import { sendEmail } from "@/lib/email";

// Genera el resumen semanal de un negocio (solo Pro): analiza el feedback de
// los últimos 7 días, lo guarda en weekly_summaries y lo envía por
// WhatsApp/email como "resumen del lunes". Se puede disparar manualmente desde
// el dashboard o por un job programado.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const businessId = typeof body?.businessId === "string" ? body.businessId : null;
    if (!businessId) {
      return NextResponse.json({ error: "businessId requerido" }, { status: 400 });
    }
    if (!anthropicConfigured()) {
      return NextResponse.json({ error: "ai_not_configured" }, { status: 503 });
    }

    const supabase = supabaseAdmin();
    const { data: business } = await supabase
      .from("businesses")
      .select("id, name, plan, whatsapp_owner, email_owner")
      .eq("id", businessId)
      .maybeSingle();

    if (!business) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    }
    if (business.plan !== "pro") {
      return NextResponse.json({ error: "solo_pro" }, { status: 403 });
    }

    // Ventana de 7 días.
    const now = new Date();
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekStartISO = weekStart.toISOString();
    const weekStartDate = weekStartISO.slice(0, 10);
    const weekEndDate = now.toISOString().slice(0, 10);

    const { data: rows } = await supabase
      .from("feedback")
      .select("rating, comment, status")
      .eq("business_id", business.id)
      .gte("created_at", weekStartISO);

    const feedback = rows ?? [];
    const positive = feedback.filter((f) => f.status === "public_redirected").length;
    const negativeComments = feedback
      .filter((f) => f.status === "private_captured" && f.comment?.trim())
      .map((f) => f.comment!.trim());
    const negativeCount = feedback.filter(
      (f) => f.status === "private_captured"
    ).length;

    const { summary, topTheme } = await summarizeWeek({
      businessName: business.name,
      positive,
      negativeComments,
    });

    await supabase.from("weekly_summaries").upsert(
      {
        business_id: business.id,
        week_start: weekStartDate,
        week_end: weekEndDate,
        summary_text: summary,
        positive_count: positive,
        negative_count: negativeCount,
        top_theme: topTheme,
      },
      { onConflict: "business_id,week_start" }
    );

    // Envío del resumen (WhatsApp o email). No bloquea la respuesta si falla.
    const subject = `📊 Resumen semanal — ${business.name}`;
    const text =
      `${subject}\n\n${summary}\n\n` +
      `✅ Reseñas positivas: ${positive}\n⚠️ Quejas privadas: ${negativeCount}` +
      (topTheme ? `\n🔁 Tema recurrente: ${topTheme}` : "");
    const html =
      `<div style="font-family:system-ui,sans-serif;max-width:520px">` +
      `<h2 style="margin:0 0 8px">📊 Resumen semanal</h2>` +
      `<p style="margin:0 0 8px"><strong>${business.name}</strong></p>` +
      `<p style="margin:8px 0;padding:12px;background:#f9fafb;border-radius:8px">${summary}</p>` +
      `<p style="margin:4px 0">✅ Reseñas positivas: <strong>${positive}</strong></p>` +
      `<p style="margin:4px 0">⚠️ Quejas privadas: <strong>${negativeCount}</strong></p>` +
      (topTheme ? `<p style="margin:4px 0">🔁 Tema recurrente: <strong>${topTheme}</strong></p>` : "") +
      `</div>`;

    let channel: string | null = null;
    if (business.whatsapp_owner) {
      const wa = await sendWhatsApp(business.whatsapp_owner, text);
      if (wa.sent) channel = "whatsapp";
    }
    if (!channel && business.email_owner) {
      const mail = await sendEmail(business.email_owner, subject, html);
      if (mail.sent) channel = "email";
    }

    return NextResponse.json({
      ok: true,
      summary,
      top_theme: topTheme,
      positive,
      negative: negativeCount,
      notified: channel,
    });
  } catch (err) {
    console.error("[ai-summary] error:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
