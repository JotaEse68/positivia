import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  const supabase = createServerSupabase();
  await supabase.auth.signOut();
  return NextResponse.redirect(`${req.nextUrl.origin}/admin/login`, { status: 303 });
}
