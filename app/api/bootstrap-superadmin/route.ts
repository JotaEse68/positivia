import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-bootstrap-secret");
  if (!secret || secret !== process.env.BOOTSTRAP_SECRET) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const email =
    process.env.BOOTSTRAP_SUPERADMIN_EMAIL ||
    process.env.SUPERADMIN_EMAIL ||
    "";
  const password = process.env.BOOTSTRAP_SUPERADMIN_PASSWORD || "";

  if (!email || !password) {
    return NextResponse.json({ error: "missing_bootstrap_env" }, { status: 500 });
  }

  const admin = supabaseAdmin();
  const normalizedEmail = email.trim().toLowerCase();
  let page = 1;
  let userId: string | null = null;

  while (!userId) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 100 });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const match = data.users.find(
      (user) => user.email?.trim().toLowerCase() === normalizedEmail
    );
    if (match) {
      userId = match.id;
      break;
    }

    if (data.users.length < 100) break;
    page += 1;
  }

  if (userId) {
    const { error } = await admin.auth.admin.updateUserById(userId, {
      password,
      email_confirm: true,
      user_metadata: { full_name: "Superadmin PositivIA" },
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, action: "updated" });
  }

  const { error } = await admin.auth.admin.createUser({
    email: normalizedEmail,
    password,
    email_confirm: true,
    user_metadata: { full_name: "Superadmin PositivIA" },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, action: "created" });
}
