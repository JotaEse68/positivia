import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/cron";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isAuthorizedCronRequest(req)) {
    return NextResponse.json({ error: "no_autorizado" }, { status: 401 });
  }

  const supabase = supabaseAdmin();
  const { data: businesses, error } = await supabase
    .from("businesses")
    .select("id, name")
    .eq("plan", "pro")
    .eq("plan_status", "active");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const secret = process.env.CRON_SECRET;
  const results = [];

  for (const business of businesses ?? []) {
    try {
      const res = await fetch(`${req.nextUrl.origin}/api/ai-summary`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(secret ? { Authorization: `Bearer ${secret}` } : {}),
        },
        body: JSON.stringify({ businessId: business.id }),
      });
      const data = await res.json().catch(() => ({}));
      results.push({
        businessId: business.id,
        name: business.name,
        ok: res.ok,
        status: res.status,
        data,
      });
    } catch (err) {
      results.push({
        businessId: business.id,
        name: business.name,
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return NextResponse.json({ ok: true, processed: results.length, results });
}
