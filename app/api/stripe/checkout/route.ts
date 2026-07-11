import { NextRequest, NextResponse } from "next/server";
import { getStripePriceForPlan, getStripeSecretForRequests } from "@/lib/stripe-billing";

export const dynamic = "force-dynamic";

// La landing de venta vive en positivia.net (WordPress), otro origen: el
// botón de precio hace fetch() a este endpoint desde ahi, asi que necesita
// CORS explicito o el navegador bloquea la respuesta.
const ALLOWED_ORIGIN = "https://positivia.net";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

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
    return NextResponse.json(
      { error: "billing no configurado" },
      { status: 503, headers: corsHeaders() }
    );
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
    return NextResponse.json(
      { error: "No se pudo crear el checkout" },
      { status: 502, headers: corsHeaders() }
    );
  }

  const session = (await res.json()) as { url?: string };
  if (!session.url) {
    return NextResponse.json(
      { error: "No se pudo crear el checkout" },
      { status: 502, headers: corsHeaders() }
    );
  }

  return NextResponse.json({ url: session.url }, { headers: corsHeaders() });
}
