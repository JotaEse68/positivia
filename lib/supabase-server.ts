import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Cliente Supabase con sesión (cookies) para server components y route
// handlers del área admin. Usa la clave anónima → RLS aplica: el dueño solo
// ve/edita el feedback de sus negocios (y sus locales hijos).
export function createServerSupabase() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll llamado desde un server component sin permiso de escritura;
            // el refresco de sesión lo cubre el middleware.
          }
        },
      },
    }
  );
}
