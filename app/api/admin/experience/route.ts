import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase";
import { isSuperadminUser } from "@/lib/superadmin";

const COLOR_RE = /^#[0-9a-fA-F]{6}$/;
const RATING_SETTING_FIELDS = [
  "visual_theme",
  "logo_display",
  "incentive_text",
  "issue_options",
  "positive_redirect_title",
  "positive_redirect_body",
  "private_prompt_title",
  "private_prompt_body",
  "private_submit_label",
  "private_thanks_title",
  "private_thanks_body",
  "recovery_hint",
  "appreciation_note",
] as const;

function cleanSetting(value: FormDataEntryValue | null) {
  return typeof value === "string" && value.trim()
    ? value.trim().slice(0, 1000)
    : null;
}

function cleanChoice(value: FormDataEntryValue | null, allowed: string[]) {
  return typeof value === "string" && allowed.includes(value) ? value : null;
}

function isMissingSettingsSchema(error: { code?: string; message?: string }) {
  return (
    error.code === "42P01" ||
    error.code === "42703" ||
    error.message?.includes("business_rating_settings") ||
    error.message?.includes("relation") === true
  );
}

function isMissingColumn(error: { code?: string; message?: string }, column: string) {
  return error.code === "42703" || error.message?.includes(column) === true;
}

async function uploadBusinessImage({
  file,
  slug,
  prefix,
}: {
  file: File;
  slug: string;
  prefix: string;
}) {
  if (!file.type.startsWith("image/")) {
    throw new Error("El archivo debe ser una imagen");
  }

  const admin = supabaseAdmin();
  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const path = prefix === "banner" ? `${prefix}-${slug}` : `${prefix}-${slug}-${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await admin.storage
    .from("logos")
    .upload(path, buffer, { contentType: file.type, upsert: true });

  if (error) throw new Error(error.message);
  return admin.storage.from("logos").getPublicUrl(path).data.publicUrl;
}

async function getAccessibleBusinessIds(user: { id: string; email?: string | null }) {
  const admin = supabaseAdmin();
  const email = user.email?.trim();

  if (email) {
    const { data: matches } = await admin
      .from("businesses")
      .select("id")
      .ilike("email_owner", email);

    if (matches?.length) {
      await admin.from("admin_users").upsert(
        matches.map((business) => ({
          business_id: business.id,
          clerk_user_id: user.id,
          role: "owner",
        })),
        { onConflict: "business_id,clerk_user_id" }
      );
    }
  }

  const { data: links } = await admin
    .from("admin_users")
    .select("business_id")
    .eq("clerk_user_id", user.id);

  const directIds = (links ?? []).map((link) => link.business_id as string);
  const ids = new Set(directIds);

  if (directIds.length) {
    const { data: children } = await admin
      .from("businesses")
      .select("id")
      .in("parent_business_id", directIds);

    for (const child of children ?? []) ids.add(child.id as string);
  }

  return ids;
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "no_autorizado" }, { status: 401 });
    }

    const form = await req.formData();
    const businessId = String(form.get("business_id") ?? "").trim();
    if (!businessId) {
      return NextResponse.json({ error: "Negocio requerido" }, { status: 400 });
    }

    const canEditAll = isSuperadminUser(user);
    const accessibleIds = canEditAll ? new Set<string>() : await getAccessibleBusinessIds(user);
    if (!canEditAll && !accessibleIds.has(businessId)) {
      return NextResponse.json({ error: "no_autorizado" }, { status: 403 });
    }

    const admin = supabaseAdmin();
    const { data: business } = await admin
      .from("businesses")
      .select("id, slug")
      .eq("id", businessId)
      .single();

    if (!business) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    }

    const color = String(form.get("color_primary") ?? "").trim();
    if (color && !COLOR_RE.test(color)) {
      return NextResponse.json({ error: "Color inválido" }, { status: 400 });
    }

    const update: Record<string, unknown> = {
      google_review_link:
        String(form.get("google_review_link") ?? "").trim() || null,
      whatsapp_owner: String(form.get("whatsapp_owner") ?? "").trim() || null,
      email_owner: String(form.get("email_owner") ?? "").trim() || null,
    };
    if (color) update.color_primary = color;

    const logo = form.get("logo");
    if (logo && logo instanceof File && logo.size > 0) {
      try {
        update.logo_url = await uploadBusinessImage({
          file: logo,
          slug: business.slug,
          prefix: "logo",
        });
      } catch (err) {
        return NextResponse.json(
          { error: "No se pudo subir el logo: " + (err instanceof Error ? err.message : "") },
          { status: 400 }
        );
      }
    }

    const banner = form.get("banner");
    if (banner && banner instanceof File && banner.size > 0) {
      try {
        update.banner_url = await uploadBusinessImage({
          file: banner,
          slug: business.slug,
          prefix: "banner",
        });
      } catch (err) {
        return NextResponse.json(
          { error: "No se pudo subir el banner: " + (err instanceof Error ? err.message : "") },
          { status: 400 }
        );
      }
    }

    let warning: string | null = null;
    const { error: businessError } = await admin
      .from("businesses")
      .update(update)
      .eq("id", businessId);

    if (businessError) {
      if (isMissingColumn(businessError, "banner_url")) {
        delete update.banner_url;
        const fallback = await admin
          .from("businesses")
          .update(update)
          .eq("id", businessId);
        if (!fallback.error) {
          warning = null;
        } else {
          return NextResponse.json({ error: fallback.error.message }, { status: 400 });
        }
      } else {
        return NextResponse.json({ error: businessError.message }, { status: 400 });
      }
    }

    const settings: Record<string, unknown> = { business_id: businessId };
    for (const field of RATING_SETTING_FIELDS) {
      settings[field] = cleanSetting(form.get(field));
    }
    settings.visual_theme =
      cleanChoice(form.get("visual_theme"), ["sunrise", "hope", "coral"]) || "sunrise";
    settings.logo_display =
      cleanChoice(form.get("logo_display"), ["large", "compact"]) || "large";

    const { error: settingsError } = await admin
      .from("business_rating_settings")
      .upsert(settings, { onConflict: "business_id" });

    if (settingsError) {
      if (isMissingSettingsSchema(settingsError)) {
        return NextResponse.json({
          ok: true,
          warning: "settings_schema_missing",
        });
      }
      return NextResponse.json(
        { error: "Datos guardados, pero no se pudo guardar la experiencia QR." },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true, ...(warning ? { warning } : {}) });
  } catch (err) {
    console.error("[admin/experience PATCH] error:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
