import { createBrowserClient } from "@supabase/ssr";

// Cliente Supabase para componentes cliente del área admin (login por magic
// link, acciones del dashboard). RLS aplica igual que en servidor.
export function createBrowserSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
