import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

// Cliente Supabase que se autentica con el token de Clerk (JWT template
// "supabase", que incluye role=authenticated). Supabase valida el token vía la
// integración third-party de Clerk, y RLS aplica usando el user id de Clerk
// (auth.jwt()->>'sub'). Así el dueño solo ve/edita los datos de sus negocios.
export function createServerSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      async accessToken() {
        const { getToken } = await auth();
        return (await getToken({ template: "supabase" })) ?? null;
      },
    }
  );
}
