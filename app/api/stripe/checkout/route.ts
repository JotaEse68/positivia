import { NextRequest, NextResponse } from "next/server";
import { getStripePriceForPlan, getStripeSecretForRequests } from "@/lib/stripe-billing";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: { plan?: string };
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const plan = body.plan === "starter" ? "starter" : "pro";
  const secret = getStripeSecretForRequests();
  const price = getStripePriceForPlan(plan);

  if (!secret || !price) {
    return NextResponse.json({ error: "billing no configurado" }, { status: 503 });
  }

  const base = (process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "")) || req.nextUrl.origin;
  const params = new URLSearchParams({
    mode: "subscription",
    "line_items[0][price]": price,
    "line_items[0][quantity]": "1",
    "consent_collection[terms_of_service]": "required",
    allow_promotion_codes: "true",
    "metadata[plan]": plan,
    success_url: `${base}/bienvenida?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: "https://positivia.net/",
  });

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
    cache: "no-store",
  });

  if (!res.ok) {
    return NextResponse.json({ error: "No se pudo crear el checkout" }, { status: 502 });
  }

  const session = (await res.json()) as { url?: string };
  if (!session.url) {
    return NextResponse.json({ error: "No se pudo crear el checkout" }, { status: 502 });
  }

  return NextResponse.json({ url: session.url });
}
