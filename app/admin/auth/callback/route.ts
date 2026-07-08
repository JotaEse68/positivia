import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

// Callback del magic link: intercambia el código por una sesión y redirige al
// dashboard. Soporta tanto el flujo PKCE (?code=) como el de token hash.
export async function GET(req: NextRequest) {
  const { searchParams, origin } = req.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  const supabase = createServerSupabase();

  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
  } else if (tokenHash && type) {
    await supabase.auth.verifyOtp({
      type: type as "magiclink" | "email",
      token_hash: tokenHash,
    });
  }

  return NextResponse.redirect(`${origin}/admin/dashboard`);
}
