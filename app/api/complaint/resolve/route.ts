import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

// Guarda la respuesta (posiblemente editada por el dueño) y marca la queja como
// gestionada. Usa el cliente con sesión → RLS garantiza que el dueño solo puede
// tocar el feedback de sus negocios. Nunca envía nada al cliente final.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const feedbackId = typeof body?.feedbackId === "string" ? body.feedbackId : null;
    const reply =
      typeof body?.reply === "string" && body.reply.trim()
        ? body.reply.trim().slice(0, 2000)
        : null;
    if (!feedbackId) {
      return NextResponse.json({ error: "feedbackId requerido" }, { status: 400 });
    }

    const supabase = createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "no_auth" }, { status: 401 });
    }

    const update: Record<string, unknown> = { reply_sent: true };
    if (reply !== null) update.suggested_reply = reply;

    // RLS filtra: si el feedback no pertenece a un negocio del dueño, no afecta
    // ninguna fila.
    const { data, error } = await supabase
      .from("feedback")
      .update(update)
      .eq("id", feedbackId)
      .select("id")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: "update_failed" }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: "no_encontrado_o_sin_acceso" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[complaint/resolve] error:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
