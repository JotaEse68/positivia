import { createServerSupabase } from "@/lib/supabase-server";

export function isSuperadminUser(user: { email?: string | null } | null | undefined) {
  const superEmail = process.env.SUPERADMIN_EMAIL?.trim().toLowerCase();
  const email = user?.email?.trim().toLowerCase();
  return Boolean(superEmail && email && email === superEmail);
}

export async function getSuperadmin() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isSuperadminUser(user)) return null;

  return user;
}
