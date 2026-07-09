import { NextRequest, NextResponse } from "next/server";
import { getSuperadmin } from "@/lib/superadmin";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const su = await getSuperadmin();
    if (!su) {
      return NextResponse.json({ error: "no_autorizado" }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    const businessId = typeof body?.businessId === "string" ? body.businessId : null;
    if (!businessId) {
      return NextResponse.json({ error: "businessId requerido" }, { status: 400 });
    }

    const admin = supabaseAdmin();
    const { data: business } = await admin
      .from("businesses")
      .select("id, name, email_owner, whatsapp_owner")
      .eq("id", businessId)
      .single();

    if (!business) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    }
    if (!business.email_owner && !business.whatsapp_owner) {
      return NextResponse.json(
        { error: "Este cliente no tiene email ni WhatsApp de aviso." },
        { status: 400 }
      );
    }

    const { data: feedback, error: insertError } = await admin
      .from("feedback")
      .insert({
        business_id: business.id,
        rating: 2,
        comment:
          "[Prueba interna] Este aviso confirma que el encargado recibe una queja privada.",
        status: "private_captured",
        issue_categories: ["Prueba de aviso"],
        contact_info: "prueba@positivia.app",
      })
      .select("id")
      .single();

    if (insertError && insertError.code === "42703") {
      const fallback = await admin
        .from("feedback")
        .insert({
          business_id: business.id,
          rating: 2,
          comment:
            "[Prueba interna] Este aviso confirma que el encargado recibe una queja privada.",
          status: "private_captured",
        })
        .select("id")
        .single();
      if (fallback.error || !fallback.data) {
        return NextResponse.json(
          { error: fallback.error?.message ?? "No se pudo crear la prueba" },
          { status: 400 }
        );
      }
      const notify = await fetch(`${req.nextUrl.origin}/api/notify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedbackId: fallback.data.id }),
      });
      const result = await notify.json().catch(() => ({}));
      return NextResponse.json({ ok: notify.ok, feedbackId: fallback.data.id, ...result });
    }

    if (insertError || !feedback) {
      return NextResponse.json(
        { error: insertError?.message ?? "No se pudo crear la prueba" },
        { status: 400 }
      );
    }

    const notify = await fetch(`${req.nextUrl.origin}/api/notify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feedbackId: feedback.id }),
    });
    const result = await notify.json().catch(() => ({}));
    return NextResponse.json({ ok: notify.ok, feedbackId: feedback.id, ...result });
  } catch (err) {
    console.error("[test-notification] error:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
