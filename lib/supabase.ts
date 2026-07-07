import { createClient } from "@supabase/supabase-js";

// Cliente anónimo: solo lecturas públicas permitidas por RLS
// (p. ej. datos mínimos del negocio para la landing /r/[slug]).
export function supabaseAnon() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
}

// Cliente con service role: bypassa RLS. SOLO en código de servidor
// (API routes, server components del superadmin). Nunca en el cliente.
export function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
