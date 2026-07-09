import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { findStripeCustomerByEmail, getStripeSecretForRequests } from "@/lib/stripe-billing";

export const dynamic = "force-dynamic";

function accountUrl(req: NextRequest, billing: string) {
  return new URL(`/admin/account?billing=${billing}`, req.nextUrl.origin);
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.redirect(accountUrl(req, "login-required"), 303);
  }

  const secret = getStripeSecretForRequests();
  if (!secret) {
    return NextResponse.redirect(accountUrl(req, "setup-needed"), 303);
  }

  const customerId = await findStripeCustomerByEmail(user.email);
  if (!customerId) {
    return NextResponse.redirect(accountUrl(req, "no-customer"), 303);
  }

  const base = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || req.nextUrl.origin;
  const body = new URLSearchParams({
    customer: customerId,
    return_url: `${base}/admin/account?billing=portal-return`,
  });

  const res = await fetch("https://api.stripe.com/v1/billing_portal/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
  });

  if (!res.ok) {
    return NextResponse.redirect(accountUrl(req, "portal-error"), 303);
  }

  const session = (await res.json()) as { url?: string };
  if (!session.url) {
    return NextResponse.redirect(accountUrl(req, "portal-error"), 303);
  }

  return NextResponse.redirect(session.url, 303);
}
