import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "no_autorizado" }, { status: 401 });
  }

  const slug = (req.nextUrl.searchParams.get("slug") ?? "").trim().toLowerCase();
  const businessId = req.nextUrl.searchParams.get("business_id") ?? "";

  if (!SLUG_RE.test(slug)) {
    return NextResponse.json({ available: false, reason: "formato" });
  }

  let query = supabaseAdmin().from("businesses").select("id").eq("slug", slug);
  if (businessId) query = query.neq("id", businessId);

  const { data } = await query.maybeSingle();

  return NextResponse.json({ available: !data });
}
