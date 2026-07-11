import { supabaseAdmin } from "@/lib/supabase";

type SessionUser = { id: string; email?: string | null };

// Vincula automáticamente al usuario autenticado con cualquier negocio cuyo
// email_owner coincida con su email (alta por Stripe sin invitación manual).
export async function linkBusinessesForCurrentUser(user: SessionUser) {
  const email = user.email?.trim();
  if (!user?.id || !email) return;

  const admin = supabaseAdmin();
  const { data: matches, error } = await admin
    .from("businesses")
    .select("id")
    .ilike("email_owner", email);

  if (error || !matches?.length) return;

  await admin.from("admin_users").upsert(
    matches.map((business) => ({
      business_id: business.id,
      clerk_user_id: user.id,
      role: "owner",
    })),
    { onConflict: "business_id,clerk_user_id" }
  );
}

// IDs de negocio a los que el usuario tiene acceso: los suyos directos +
// los locales hijos de los suyos (cadenas bajo un Pro base).
export async function getAccessibleBusinessIds(user: SessionUser) {
  await linkBusinessesForCurrentUser(user);

  const admin = supabaseAdmin();
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
