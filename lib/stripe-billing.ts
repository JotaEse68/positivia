export type BillingInvoice = {
  id: string;
  number: string | null;
  status: string | null;
  amountDue: number;
  currency: string;
  hostedInvoiceUrl: string | null;
  invoicePdf: string | null;
  created: number;
};

export type BillingSnapshot = {
  configured: boolean;
  customerFound: boolean;
  customerId: string | null;
  invoices: BillingInvoice[];
  error?: string;
};

type StripeCustomerList = {
  data?: Array<{ id: string }>;
};

type StripeInvoiceList = {
  data?: Array<{
    id: string;
    number: string | null;
    status: string | null;
    amount_due: number;
    currency: string;
    hosted_invoice_url: string | null;
    invoice_pdf: string | null;
    created: number;
  }>;
};

function stripeSecret() {
  return process.env.STRIPE_SECRET_KEY?.trim();
}

function stripeHeaders(secret: string) {
  return {
    Authorization: `Bearer ${secret}`,
  };
}

export function billingIsConfigured() {
  return Boolean(stripeSecret());
}

export async function findStripeCustomerByEmail(email: string) {
  const secret = stripeSecret();
  const cleanEmail = email.trim();
  if (!secret || !cleanEmail) return null;

  const res = await fetch(
    `https://api.stripe.com/v1/customers?email=${encodeURIComponent(cleanEmail)}&limit=1`,
    {
      headers: stripeHeaders(secret),
      cache: "no-store",
    },
  );

  if (!res.ok) return null;

  const json = (await res.json()) as StripeCustomerList;
  return json.data?.[0]?.id ?? null;
}

export async function getBillingSnapshot(email: string): Promise<BillingSnapshot> {
  const secret = stripeSecret();
  const cleanEmail = email.trim();

  if (!secret) {
    return {
      configured: false,
      customerFound: false,
      customerId: null,
      invoices: [],
    };
  }

  if (!cleanEmail) {
    return {
      configured: true,
      customerFound: false,
      customerId: null,
      invoices: [],
      error: "No hay email de cuenta para buscar facturas.",
    };
  }

  const customerId = await findStripeCustomerByEmail(cleanEmail);
  if (!customerId) {
    return {
      configured: true,
      customerFound: false,
      customerId: null,
      invoices: [],
    };
  }

  const res = await fetch(
    `https://api.stripe.com/v1/invoices?customer=${encodeURIComponent(customerId)}&limit=8`,
    {
      headers: stripeHeaders(secret),
      cache: "no-store",
    },
  );

  if (!res.ok) {
    return {
      configured: true,
      customerFound: true,
      customerId,
      invoices: [],
      error: "No se han podido cargar las facturas.",
    };
  }

  const json = (await res.json()) as StripeInvoiceList;

  return {
    configured: true,
    customerFound: true,
    customerId,
    invoices:
      json.data?.map((invoice) => ({
        id: invoice.id,
        number: invoice.number,
        status: invoice.status,
        amountDue: invoice.amount_due,
        currency: invoice.currency,
        hostedInvoiceUrl: invoice.hosted_invoice_url,
        invoicePdf: invoice.invoice_pdf,
        created: invoice.created,
      })) ?? [],
  };
}

export function getStripePriceForPlan(plan: "starter" | "pro") {
  if (plan === "pro") {
    return process.env.STRIPE_PRICE_PRO?.trim() || process.env.STRIPE_PRICE_ID?.trim();
  }

  return process.env.STRIPE_PRICE_STARTER?.trim() || process.env.STRIPE_PRICE_ID?.trim();
}

export function getStripeSecretForRequests() {
  return stripeSecret();
}
