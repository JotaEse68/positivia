import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const requestUrl = new URL(req.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/admin/dashboard";

  if (code) {
    const supabase = await createServerSupabase();
    await supabase.auth.exchangeCodeForSession(code);
    return NextResponse.redirect(new URL(next, requestUrl.origin));
  }

  return new NextResponse(
    `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>PositivIA</title>
  </head>
  <body style="font-family: system-ui, sans-serif; background:#050505; color:white; display:grid; min-height:100vh; place-items:center; margin:0;">
    <p>Preparando tu acceso...</p>
    <script>
      const hash = window.location.hash || "";
      const query = window.location.search || "";
      const targetPath = hash.includes("type=recovery")
        ? "/admin/reset-password?mode=update"
        : "/admin/login";
      const target = new URL(targetPath, window.location.origin);
      const current = new URLSearchParams(query);
      current.forEach((value, key) => target.searchParams.set(key, value));
      target.hash = hash.replace(/^#/, "");
      window.location.replace(target.toString());
    </script>
  </body>
</html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

export function POST() {
  return NextResponse.json({ error: "method_not_allowed" }, { status: 405 });
}
