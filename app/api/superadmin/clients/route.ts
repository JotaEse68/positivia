import { NextRequest, NextResponse } from "next/server";
import { getSuperadmin } from "@/lib/superadmin";
import { supabaseAdmin } from "@/lib/supabase";

const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
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
  "reward_text",
] as const;

function cleanSetting(value: unknown) {
  return typeof value === "string" && value.trim()
    ? value.trim().slice(0, 600)
    : null;
}

function cleanChoice(value: unknown, allowed: string[]) {
  return typeof value === "string" && allowed.includes(value) ? value : null;
}

function isMissingSettingsTable(error: { code?: string; message?: string }) {
  return (
    error.code === "42P01" ||
    error.message?.includes("business_rating_settings") ||
    error.message?.includes("relation") === true
  );
}

async function findAuthUserByEmail(email: string) {
  const admin = supabaseAdmin();
  const needle = email.trim().toLowerCase();
  let page = 1;

  while (page < 10) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 100,
    });
    if (error || !data.users.length) return null;

    const match = data.users.find(
      (user) => user.email?.trim().toLowerCase() === needle
    );
    if (match) return match;
    page += 1;
  }

  return null;
}

async function ensureOwnerUser({
  businessId,
  businessName,
  email,
  password,
}: {
  businessId: string;
  businessName: string;
  email: string;
  password: string;
}) {
  const admin = supabaseAdmin();
  const existing = await findAuthUserByEmail(email);
  const metadata = {
    full_name: businessName,
    business_id: businessId,
    role: "owner",
  };

  const { data, error } = existing
    ? await admin.auth.admin.updateUserById(existing.id, {
        password,
        email_confirm: true,
        user_metadata: { ...existing.user_metadata, ...metadata },
      })
    : await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: metadata,
      });

  if (error || !data.user) {
    return { error: error?.message ?? "No se pudo crear el usuario" };
  }

  const { error: linkError } = await admin.from("admin_users").upsert(
    {
      business_id: businessId,
      clerk_user_id: data.user.id,
      role: "owner",
    },
    { onConflict: "business_id,clerk_user_id" }
  );

  if (linkError) return { error: linkError.message };

  return { userId: data.user.id, existed: Boolean(existing) };
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

async function saveRatingSettingsSnapshot(
  businessId: string,
  settings: Record<string, unknown>
) {
  const payload = Buffer.from(JSON.stringify(settings), "utf8");
  await supabaseAdmin()
    .storage
    .from("logos")
    .upload(`rating-settings-${businessId}.json`, payload, {
      contentType: "application/json",
      upsert: true,
    });
}

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
    const ownerPassword = String(form.get("owner_password") ?? "").trim();

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

    let ownerUser:
      | { created: boolean; existed: boolean; error?: never }
      | { created: false; existed: false; error: string }
      | null = null;

    if (email && ownerPassword) {
      const result = await ensureOwnerUser({
        businessId: data.id,
        businessName: name,
        email,
        password: ownerPassword,
      });
      ownerUser = result.error
        ? { created: false, existed: false, error: result.error }
        : { created: true, existed: Boolean(result.existed) };
    }

    return NextResponse.json({
      ok: true,
      id: data.id,
      slug: data.slug,
      ownerUser,
    });
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
    const contentType = req.headers.get("content-type") ?? "";
    const form = contentType.includes("multipart/form-data")
      ? await req.formData()
      : null;
    const body = form ? null : await req.json().catch(() => null);
    const read = (field: string) =>
      form ? form.get(field) : body?.[field];
    const idValue = read("id");
    const id = typeof idValue === "string" ? idValue : null;
    if (!id) {
      return NextResponse.json({ error: "id requerido" }, { status: 400 });
    }

    const update: Record<string, unknown> = {};
    const nameValue = read("name");
    if (typeof nameValue === "string" && nameValue.trim()) {
      update.name = nameValue.trim();
    }
    const slugValue = read("slug");
    if (typeof slugValue === "string") {
      const slug = slugValue.trim().toLowerCase();
      if (!SLUG_RE.test(slug)) {
        return NextResponse.json({ error: "Slug inválido" }, { status: 400 });
      }
      update.slug = slug;
    }
    const colorValue = read("color_primary");
    if (typeof colorValue === "string") {
      const color = colorValue.trim();
      if (!COLOR_RE.test(color)) {
        return NextResponse.json({ error: "Color inválido" }, { status: 400 });
      }
      update.color_primary = color;
    }
    if (form || (body && "google_review_link" in body)) {
      const field = read("google_review_link");
      const value =
        typeof field === "string"
          ? field.trim()
          : "";
      update.google_review_link = value || null;
    }
    if (form || (body && "whatsapp_owner" in body)) {
      const field = read("whatsapp_owner");
      const value =
        typeof field === "string" ? field.trim() : "";
      update.whatsapp_owner = value || null;
    }
    if (form || (body && "email_owner" in body)) {
      const field = read("email_owner");
      const value =
        typeof field === "string" ? field.trim() : "";
      update.email_owner = value || null;
    }
    const planValue = read("plan");
    if (planValue === "starter" || planValue === "pro") update.plan = planValue;
    const planStatusValue = read("plan_status");
    if (
      typeof planStatusValue === "string" &&
      ["trial", "active", "cancelled"].includes(planStatusValue)
    ) {
      update.plan_status = planStatusValue;
    }
    if (read("remove_logo") === "1") update.logo_url = null;
    if (read("remove_banner") === "1") {
      update.banner_url = null;
      const currentSlug =
        typeof update.slug === "string" ? update.slug : `cliente-${id.slice(0, 8)}`;
      await supabaseAdmin().storage.from("logos").remove([`banner-${currentSlug}`]);
    }

    const logo = form?.get("logo");
    if (logo && logo instanceof File && logo.size > 0) {
      const currentSlug =
        typeof update.slug === "string" ? update.slug : `cliente-${id.slice(0, 8)}`;
      try {
        update.logo_url = await uploadBusinessImage({
          file: logo,
          slug: currentSlug,
          prefix: "logo",
        });
      } catch (err) {
        return NextResponse.json(
          { error: "No se pudo subir el logo: " + (err instanceof Error ? err.message : "") },
          { status: 400 }
        );
      }
    }

    const banner = form?.get("banner");
    if (banner && banner instanceof File && banner.size > 0) {
      const currentSlug =
        typeof update.slug === "string" ? update.slug : `cliente-${id.slice(0, 8)}`;
      try {
        update.banner_url = await uploadBusinessImage({
          file: banner,
          slug: currentSlug,
          prefix: "banner",
        });
      } catch (err) {
        return NextResponse.json(
          { error: "No se pudo subir el banner: " + (err instanceof Error ? err.message : "") },
          { status: 400 }
        );
      }
    }
    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "nada que actualizar" }, { status: 400 });
    }

    const admin = supabaseAdmin();
    let warning: string | null = null;
    const { error } = await admin
      .from("businesses")
      .update(update)
      .eq("id", id);
    if (error) {
      if (isMissingColumn(error, "banner_url")) {
        delete update.banner_url;
        const fallback = await admin
          .from("businesses")
          .update(update)
          .eq("id", id);
        if (!fallback.error) {
          warning = null;
        } else {
          return NextResponse.json({ error: fallback.error.message }, { status: 400 });
        }
      } else {
        const msg = error.message.includes("duplicate")
          ? "Ese slug ya está en uso"
          : error.message;
        return NextResponse.json({ error: msg }, { status: 400 });
      }
    }

    const hasRatingSettings =
      form ||
      (body?.rating_settings && typeof body.rating_settings === "object");
    if (hasRatingSettings) {
      const settings: Record<string, unknown> = { business_id: id };
      for (const field of RATING_SETTING_FIELDS) {
        settings[field] = form
          ? cleanSetting(form.get(field))
          : cleanSetting(body.rating_settings[field]);
      }
      settings.visual_theme =
        cleanChoice(
          form ? form.get("visual_theme") : body.rating_settings.visual_theme,
          ["sunrise", "hope", "coral"]
        ) ||
        "sunrise";
      settings.logo_display =
        cleanChoice(
          form ? form.get("logo_display") : body.rating_settings.logo_display,
          ["large", "compact"]
        ) || "large";
      settings.reward_enabled = form
        ? form.get("reward_enabled") === "on"
        : Boolean(body.rating_settings.reward_enabled);
      await saveRatingSettingsSnapshot(id, settings);

      const { error: settingsError } = await admin
        .from("business_rating_settings")
        .upsert(settings, { onConflict: "business_id" });

      if (settingsError) {
        if (isMissingSettingsTable(settingsError)) {
          return NextResponse.json({
            ok: true,
            slug: update.slug ?? null,
            ...(warning ? { warning } : {}),
          });
        }

        return NextResponse.json(
          { error: "Cambios guardados, pero no se pudieron guardar los mensajes QR." },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({
      ok: true,
      slug: update.slug ?? null,
      ...(warning ? { warning } : {}),
    });
  } catch (err) {
    console.error("[superadmin/clients PATCH] error:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
