import { createServerSupabase } from "@/lib/supabase-server";

// Devuelve el usuario si es el superadmin (email coincide con SUPERADMIN_EMAIL),
// o null en caso contrario. El SUPERADMIN_EMAIL nunca se expone en el cliente.
export async function getSuperadmin() {
  const superEmail = process.env.SUPERADMIN_EMAIL?.trim().toLowerCase();
  if (!superEmail) return null;

  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email || user.email.trim().toLowerCase() !== superEmail) {
    return null;
  }
  return user;
}
