import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import crypto from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase";
import { sendEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SIGNATURE_TOLERANCE_SECONDS = 300;

function verifyStripeSignature(rawBody: string, header: string | null, secret: string) {
  if (!header) return false;

  const parts = Object.fromEntries(
    header.split(",").map((part) => {
      const [key, value] = part.split("=");
      return [key, value];
    }),
  );

  const timestamp = parts.t;
  const signature = parts.v1;
  if (!timestamp || !signature) return false;

  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > SIGNATURE_TOLERANCE_SECONDS) return false;

  const signedPayload = `${timestamp}.${rawBody}`;
  const expected = crypto.createHmac("sha256", secret).update(signedPayload).digest("hex");

  const expectedBuf = Buffer.from(expected, "utf8");
  const signatureBuf = Buffer.from(signature, "utf8");
  if (expectedBuf.length !== signatureBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, signatureBuf);
}

type CheckoutSession = {
  customer_details?: { email?: string | null } | null;
  metadata?: { plan?: string } | null;
  customer?: string | null;
  subscription?: string | null;
};

async function sendOnboardingEmail(email: string) {
  const base = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://app.positivia.net";
  const { data } = await supabaseAdmin().auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo: `${base}/admin/onboarding` },
  });

  const actionLink = data?.properties?.action_link;
  if (!actionLink) return;

  await sendEmail(
    email,
    "Tu acceso a PositivIA",
    `<p>Tu pago se ha confirmado. Entra para configurar tu negocio:</p>` +
      `<p><a href="${actionLink}">Entrar a PositivIA</a></p>`,
  );
}

async function provisionBusiness(session: CheckoutSession) {
  const subscriptionId = session.subscription ?? null;
  if (!subscriptionId) return;

  const email = session.customer_details?.email?.trim() || null;
  const plan = session.metadata?.plan === "starter" ? "starter" : "pro";
  const customerId = session.customer ?? null;
  const admin = supabaseAdmin();

  const { data: existing } = await admin
    .from("businesses")
    .select("id")
    .eq("stripe_subscription_id", subscriptionId)
    .maybeSingle();

  if (existing) return;

  const { error } = await admin.from("businesses").insert({
    name: email || "Nuevo negocio",
    plan,
    plan_status: "active",
    email_owner: email,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscriptionId,
  });

  if (error || !email) return;

  after(() => sendOnboardingEmail(email));
}

async function cancelSubscription(subscriptionId: string | null | undefined) {
  if (!subscriptionId) return;
  await supabaseAdmin()
    .from("businesses")
    .update({ plan_status: "cancelled" })
    .eq("stripe_subscription_id", subscriptionId);
}

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  const rawBody = await req.text();
  const signatureHeader = req.headers.get("stripe-signature");

  if (!secret || !verifyStripeSignature(rawBody, signatureHeader, secret)) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  let event: { type: string; data: { object: unknown } };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    await provisionBusiness(event.data.object as CheckoutSession);
  } else if (event.type === "customer.subscription.deleted") {
    await cancelSubscription((event.data.object as { id?: string }).id);
  }

  return NextResponse.json({ received: true });
}
