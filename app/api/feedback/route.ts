import { NextRequest, NextResponse } from "next/server";
import { getDemoBusiness } from "@/lib/demo";
import { supabaseAdmin } from "@/lib/supabase";

function cleanIssueCategories(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => item.slice(0, 80))
    .slice(0, 5);
}

function isMissingFeedbackResolutionColumns(error: { message?: string; code?: string }) {
  return (
    error.code === "42703" ||
    error.message?.includes("issue_categories") ||
    error.message?.includes("contact_info")
  );
}

// navigator.sendBeacon envía el body como texto plano (Content-Type:
// text/plain), no como JSON: leemos el texto crudo y lo parseamos
// nosotros mismos en vez de depender de la cabecera.
async function readJsonBody(req: NextRequest) {
  try {
    const text = await req.text();
    return JSON.parse(text);
  } catch {
    return null;
  }
}

// Recibe rating (+ comentario opcional) desde la landing pública y
// decide el routing: 4-5★ devuelve el link de reseña de Google,
// 1-3★ queda capturado en privado y dispara la alerta al dueño.
export async function POST(req: NextRequest) {
  try {
    const body = await readJsonBody(req);
    const slug = typeof body?.slug === "string" ? body.slug : null;
    const rating = Number(body?.rating);
    const comment =
      typeof body?.comment === "string" && body.comment.trim()
        ? body.comment.trim().slice(0, 2000)
        : null;
    const issueCategories = cleanIssueCategories(body?.issueCategories);
    const contactInfo =
      typeof body?.contactInfo === "string" && body.contactInfo.trim()
        ? body.contactInfo.trim().slice(0, 240)
        : null;

    if (!slug || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    const demo = getDemoBusiness(slug);
    if (demo) {
      return NextResponse.json({
        ok: true,
        demo: true,
        redirectUrl: rating >= 4 ? demo.google_review_link : null,
      });
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
    const insertPayload = {
      business_id: business.id,
      rating,
      comment,
      status: isPositive ? "public_redirected" : "private_captured",
      issue_categories: issueCategories,
      contact_info: contactInfo,
    };

    let { data: feedback, error: insertError } = await supabase
      .from("feedback")
      .insert(insertPayload)
      .select("id")
      .single();

    if (insertError && isMissingFeedbackResolutionColumns(insertError)) {
      const fallbackPayload = {
        business_id: business.id,
        rating,
        comment,
        status: isPositive ? "public_redirected" : "private_captured",
      };
      const fallback = await supabase
        .from("feedback")
        .insert(fallbackPayload)
        .select("id")
        .single();
      feedback = fallback.data;
      insertError = fallback.error;
    }

    if (insertError) {
      console.error("[feedback] insert error:", insertError.message);
      return NextResponse.json({ error: "Error al guardar" }, { status: 500 });
    }
    if (!feedback) {
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
