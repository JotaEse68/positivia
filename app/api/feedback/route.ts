import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// Recibe rating (+ comentario opcional) desde la landing pública y
// decide el routing: 4-5★ devuelve el link de reseña de Google,
// 1-3★ queda capturado en privado y dispara la alerta al dueño.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const slug = typeof body?.slug === "string" ? body.slug : null;
    const rating = Number(body?.rating);
    const comment =
      typeof body?.comment === "string" && body.comment.trim()
        ? body.comment.trim().slice(0, 2000)
        : null;

    if (!slug || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    const supabase = supabaseAdmin();
    const { data: business } = await supabase
      .from("businesses")
      .select("id, name, plan, plan_status, google_review_link")
      .eq("slug", slug)
      .maybeSingle();

    if (!business || business.plan_status === "cancelled") {
      return NextResponse.json({ error: "Negocio no disponible" }, { status: 404 });
    }

    const isPositive = rating >= 4;
    const { data: feedback, error: insertError } = await supabase
      .from("feedback")
      .insert({
        business_id: business.id,
        rating,
        comment,
        status: isPositive ? "public_redirected" : "private_captured",
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("[feedback] insert error:", insertError.message);
      return NextResponse.json({ error: "Error al guardar" }, { status: 500 });
    }

    if (isPositive) {
      return NextResponse.json({
        ok: true,
        redirectUrl: business.google_review_link ?? null,
      });
    }

    // Alerta al dueño (FASE 3): fire-and-forget para no retrasar la
    // respuesta al cliente final.
    try {
      const origin = req.nextUrl.origin;
      void fetch(`${origin}/api/notify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedbackId: feedback.id }),
      }).catch(() => {});
    } catch {
      // La captura del feedback nunca debe fallar por la notificación.
    }

    return NextResponse.json({ ok: true, redirectUrl: null });
  } catch (err) {
    console.error("[feedback] unexpected error:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
