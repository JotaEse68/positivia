import { NextRequest, NextResponse } from "next/server";
import { getSuperadmin } from "@/lib/superadmin";
import { supabaseAdmin } from "@/lib/supabase";

const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const COLOR_RE = /^#[0-9a-fA-F]{6}$/;

// Alta de un cliente (negocio). Solo superadmin. Sube el logo a Storage y crea
// la fila en businesses. Opcionalmente vincula a un parent_business_id (local
// adicional de una cadena bajo un Pro base).
export async function POST(req: NextRequest) {
  try {
    const su = await getSuperadmin();
    if (!su) {
      return NextResponse.json({ error: "no_autorizado" }, { status: 403 });
    }

    const form = await req.formData();
    const name = String(form.get("name") ?? "").trim();
    const slug = String(form.get("slug") ?? "").trim().toLowerCase();
    const color = String(form.get("color_primary") ?? "#16a34a").trim();
    const googleLink = String(form.get("google_review_link") ?? "").trim() || null;
    const whatsapp = String(form.get("whatsapp_owner") ?? "").trim() || null;
    const email = String(form.get("email_owner") ?? "").trim() || null;
    const plan = String(form.get("plan") ?? "starter").trim();
    const parentId = String(form.get("parent_business_id") ?? "").trim() || null;
    const logo = form.get("logo");

    if (!name || !SLUG_RE.test(slug)) {
      return NextResponse.json(
        { error: "Nombre requerido y slug válido (minúsculas, guiones)" },
        { status: 400 }
      );
    }
    if (!COLOR_RE.test(color)) {
      return NextResponse.json({ error: "Color inválido" }, { status: 400 });
    }
    if (plan !== "starter" && plan !== "pro") {
      return NextResponse.json({ error: "Plan inválido" }, { status: 400 });
    }

    const admin = supabaseAdmin();

    // Subida del logo (opcional).
    let logoUrl: string | null = null;
    if (logo && logo instanceof File && logo.size > 0) {
      const ext = logo.name.split(".").pop()?.toLowerCase() || "png";
      const path = `${slug}-${Date.now()}.${ext}`;
      const buffer = Buffer.from(await logo.arrayBuffer());
      const { error: upErr } = await admin.storage
        .from("logos")
        .upload(path, buffer, { contentType: logo.type, upsert: true });
      if (upErr) {
        return NextResponse.json(
          { error: "Error al subir el logo: " + upErr.message },
          { status: 400 }
        );
      }
      logoUrl = admin.storage.from("logos").getPublicUrl(path).data.publicUrl;
    }

    const { data, error } = await admin
      .from("businesses")
      .insert({
        name,
        slug,
        color_primary: color,
        google_review_link: googleLink,
        whatsapp_owner: whatsapp,
        email_owner: email,
        plan,
        plan_status: "trial",
        parent_business_id: parentId,
        logo_url: logoUrl,
      })
      .select("id, slug")
      .single();

    if (error) {
      const msg = error.message.includes("duplicate")
        ? "Ese slug ya está en uso"
        : error.message;
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    return NextResponse.json({ ok: true, id: data.id, slug: data.slug });
  } catch (err) {
    console.error("[superadmin/clients] error:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// Actualiza plan y/o plan_status de un cliente. Solo superadmin.
export async function PATCH(req: NextRequest) {
  try {
    const su = await getSuperadmin();
    if (!su) {
      return NextResponse.json({ error: "no_autorizado" }, { status: 403 });
    }
    const body = await req.json().catch(() => null);
    const id = typeof body?.id === "string" ? body.id : null;
    if (!id) {
      return NextResponse.json({ error: "id requerido" }, { status: 400 });
    }

    const update: Record<string, unknown> = {};
    if (typeof body.name === "string" && body.name.trim()) {
      update.name = body.name.trim();
    }
    if (typeof body.slug === "string") {
      const slug = body.slug.trim().toLowerCase();
      if (!SLUG_RE.test(slug)) {
        return NextResponse.json({ error: "Slug inválido" }, { status: 400 });
      }
      update.slug = slug;
    }
    if (typeof body.color_primary === "string") {
      const color = body.color_primary.trim();
      if (!COLOR_RE.test(color)) {
        return NextResponse.json({ error: "Color inválido" }, { status: 400 });
      }
      update.color_primary = color;
    }
    if ("google_review_link" in body) {
      const value =
        typeof body.google_review_link === "string"
          ? body.google_review_link.trim()
          : "";
      update.google_review_link = value || null;
    }
    if ("whatsapp_owner" in body) {
      const value =
        typeof body.whatsapp_owner === "string" ? body.whatsapp_owner.trim() : "";
      update.whatsapp_owner = value || null;
    }
    if ("email_owner" in body) {
      const value =
        typeof body.email_owner === "string" ? body.email_owner.trim() : "";
      update.email_owner = value || null;
    }
    if (body.plan === "starter" || body.plan === "pro") update.plan = body.plan;
    if (["trial", "active", "cancelled"].includes(body.plan_status)) {
      update.plan_status = body.plan_status;
    }
    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "nada que actualizar" }, { status: 400 });
    }

    const { error } = await supabaseAdmin()
      .from("businesses")
      .update(update)
      .eq("id", id);
    if (error) {
      const msg = error.message.includes("duplicate")
        ? "Ese slug ya está en uso"
        : error.message;
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    return NextResponse.json({ ok: true, slug: update.slug ?? null });
  } catch (err) {
    console.error("[superadmin/clients PATCH] error:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
