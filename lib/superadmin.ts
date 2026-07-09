import { createServerSupabase } from "@/lib/supabase-server";

export async function getSuperadmin() {
  const superEmail = process.env.SUPERADMIN_EMAIL?.trim().toLowerCase();
  if (!superEmail) return null;

  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const email = user?.email?.trim().toLowerCase();
  if (!email || email !== superEmail) return null;

  return user;
}
