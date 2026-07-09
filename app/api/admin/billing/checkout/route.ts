import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { getStripePriceForPlan, getStripeSecretForRequests } from "@/lib/stripe-billing";

export const dynamic = "force-dynamic";

type Business = {
  id: string;
  name: string;
  plan: "starter" | "pro";
};

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

  const form = await req.formData();
  const requestedPlan = String(form.get("plan") ?? "pro");
  const businessId = String(form.get("businessId") ?? "");
  const plan = requestedPlan === "starter" ? "starter" : "pro";
  const secret = getStripeSecretForRequests();
  const price = getStripePriceForPlan(plan);

  if (!secret || !price) {
    return NextResponse.redirect(accountUrl(req, "setup-needed"), 303);
  }

  let query = supabase.from("businesses").select("id, name, plan").limit(1);
  if (businessId) query = query.eq("id", businessId);

  const { data } = await query;
  const business = data?.[0] as Business | undefined;

  if (!business) {
    return NextResponse.redirect(accountUrl(req, "business-not-found"), 303);
  }

  const base = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || req.nextUrl.origin;
  const body = new URLSearchParams({
    mode: "subscription",
    "line_items[0][price]": price,
    "line_items[0][quantity]": "1",
    customer_email: user.email,
    client_reference_id: business.id,
    success_url: `${base}/admin/account?billing=checkout-success`,
    cancel_url: `${base}/admin/account?billing=checkout-cancelled`,
    allow_promotion_codes: "true",
    "metadata[business_id]": business.id,
    "metadata[business_name]": business.name,
    "metadata[plan]": plan,
  });

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
  });

  if (!res.ok) {
    return NextResponse.redirect(accountUrl(req, "checkout-error"), 303);
  }

  const session = (await res.json()) as { url?: string };
  if (!session.url) {
    return NextResponse.redirect(accountUrl(req, "checkout-error"), 303);
  }

  return NextResponse.redirect(session.url, 303);
}
