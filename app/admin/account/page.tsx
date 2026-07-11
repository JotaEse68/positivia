import Link from "next/link";
import AccountProfileForm from "@/components/AccountProfileForm";
import PasswordResetForm from "@/components/PasswordResetForm";
import { createServerSupabase } from "@/lib/supabase-server";
import { getBillingSnapshot } from "@/lib/stripe-billing";

export const dynamic = "force-dynamic";

type Business = {
  id: string;
  name: string;
  slug: string;
  plan: "starter" | "pro";
  plan_status: "trial" | "active" | "cancelled";
};

const statusCopy: Record<string, { title: string; body: string; tone: string }> = {
  "checkout-success": {
    title: "Pago iniciado",
    body: "Stripe ha recibido la solicitud. En cuanto el pago quede confirmado, tu plan se mantendra activo.",
    tone: "border-green-200 bg-green-50 text-green-900",
  },
  "checkout-cancelled": {
    title: "Pago cancelado",
    body: "No se ha hecho ningun cargo. Puedes retomarlo cuando quieras.",
    tone: "border-amber-200 bg-amber-50 text-amber-900",
  },
  "setup-needed": {
    title: "Pagos pendientes de conectar",
    body: "La zona de facturacion ya esta preparada. Falta configurar Stripe en Vercel con STRIPE_SECRET_KEY y los price ids.",
    tone: "border-amber-200 bg-amber-50 text-amber-900",
  },
  "no-customer": {
    title: "Aun no hay cliente de pago",
    body: "Primero hace falta crear o completar el pago para que Stripe genere el portal de facturas y cancelacion.",
    tone: "border-amber-200 bg-amber-50 text-amber-900",
  },
  "portal-return": {
    title: "Gestion revisada",
    body: "Has vuelto del portal de facturacion. Los cambios pueden tardar unos segundos en reflejarse.",
    tone: "border-green-200 bg-green-50 text-green-900",
  },
  "checkout-error": {
    title: "No se pudo abrir el pago",
    body: "Revisa la configuracion de Stripe o vuelve a intentarlo en unos minutos.",
    tone: "border-red-200 bg-red-50 text-red-900",
  },
  "portal-error": {
    title: "No se pudo abrir facturacion",
    body: "Stripe no ha devuelto el portal de cliente. Revisa la cuenta o la configuracion del portal.",
    tone: "border-red-200 bg-red-50 text-red-900",
  },
};

function planLabel(plan: Business["plan"]) {
  return plan === "pro" ? "Pro" : "Starter";
}

function statusLabel(status: Business["plan_status"]) {
  if (status === "active") return "Activo";
  if (status === "cancelled") return "Cancelado";
  return "Prueba";
}

function priceLabel(plan: Business["plan"]) {
  return plan === "pro" ? "49 €/mes" : "29 €/mes";
}

function formatInvoiceAmount(amount: number, currency: string) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

function formatDate(timestamp: number) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(timestamp * 1000));
}

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ billing?: string }>;
}) {
  const query = await searchParams;
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const email = user?.email ?? "";
  const name =
    typeof user?.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : "";

  const { data: businesses } = await supabase
    .from("businesses")
    .select("id, name, slug, plan, plan_status")
    .order("created_at", { ascending: true });
  const business = (businesses?.[0] ?? null) as Business | null;
  const billing = await getBillingSnapshot(email);
  const notice = query.billing ? statusCopy[query.billing] : null;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#27765B]">
            Cuenta del cliente
          </p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-[#102D2A]">
            Cuenta, pagos y facturas
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#53655E]">
            Aqui el negocio controla su acceso y su suscripcion mensual:
            renovar, pagar, cancelar desde el portal y descargar facturas.
          </p>
        </div>
        <Link
          href="/admin/experience"
          className="inline-flex items-center justify-center rounded-xl bg-[#102D2A] px-4 py-2.5 text-sm font-bold text-white"
        >
          Configurar QR
        </Link>
      </div>

      {notice && (
        <section className={`mb-5 rounded-2xl border p-4 text-sm ${notice.tone}`}>
          <p className="font-black">{notice.title}</p>
          <p className="mt-1 leading-6">{notice.body}</p>
        </section>
      )}

      <section className="rounded-[28px] border border-[#102D2A]/10 bg-white p-5 shadow-sm md:p-7">
        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[24px] bg-[#102D2A] p-6 text-white">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#F6C64E]">
                  Suscripcion
                </p>
                <h2 className="mt-3 text-3xl font-black">
                  {business ? `Plan ${planLabel(business.plan)}` : "Sin negocio vinculado"}
                </h2>
                <p className="mt-2 text-sm leading-6 text-white/80">
                  {business
                    ? `${business.name} · ${statusLabel(business.plan_status)}`
                    : "Cuando el superadmin vincule tu cuenta, aqui veras tu plan."}
                </p>
              </div>
              {business && (
                <span className="rounded-full bg-white px-4 py-2 text-sm font-black text-[#102D2A]">
                  {priceLabel(business.plan)}
                </span>
              )}
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <form action="/api/admin/billing/checkout" method="post">
                <input type="hidden" name="businessId" value={business?.id ?? ""} />
                <input type="hidden" name="plan" value={business?.plan ?? "pro"} />
                <button
                  type="submit"
                  className="w-full rounded-2xl bg-[#F6C64E] px-4 py-3 text-sm font-black text-[#33240A] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!business}
                >
                  Pagar o renovar ahora
                </button>
              </form>

              <form action="/api/admin/billing/portal" method="post">
                <button
                  type="submit"
                  className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-black text-white transition hover:-translate-y-0.5"
                >
                  Facturas, tarjeta y cancelar
                </button>
              </form>
            </div>

            <p className="mt-4 text-xs leading-5 text-white/70">
              La cancelacion y el cambio de tarjeta se gestionan desde el portal
              seguro de facturacion. El QR deja de admitir nuevas reseñas si el
              plan queda cancelado.
            </p>
          </div>

          <div className="grid gap-3">
            <div className="rounded-2xl border border-[#102D2A]/10 bg-[#FFF9EA] p-5">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#8A6B3E]">
                Estado de cobro
              </p>
              <p className="mt-2 text-lg font-black text-[#102D2A]">
                {billing.configured
                  ? billing.customerFound
                    ? "Cliente de pago localizado"
                    : "Aun sin primer pago"
                  : "Stripe pendiente"}
              </p>
              <p className="mt-2 text-sm leading-6 text-[#53655E]">
                {billing.configured
                  ? billing.customerFound
                    ? "Ya podemos mostrar facturas y abrir el portal de gestion."
                    : "Cuando pague por primera vez, sus facturas apareceran aqui."
                  : "Faltan las variables de Stripe en Vercel para activar pagos reales."}
              </p>
            </div>

            <div className="rounded-2xl border border-[#102D2A]/10 bg-[#DDF6DF] p-5">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#27765B]">
                Negocio
              </p>
              <p className="mt-2 text-lg font-black text-[#102D2A]">
                {business?.name ?? "Sin negocio asignado"}
              </p>
              <p className="mt-2 text-sm leading-6 text-[#53655E]">
                {business
                  ? `QR publico: /r/${business.slug}`
                  : "El superadmin puede crear el negocio y vincularlo a este email."}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-[#102D2A]">Facturas</h2>
              <p className="mt-1 text-sm text-[#53655E]">
                Descarga justificantes de pago para contabilidad.
              </p>
            </div>
            {billing.customerId && (
              <span className="rounded-full bg-[#FFF9EA] px-3 py-1 text-xs font-semibold text-[#53655E]">
                Cliente Stripe {billing.customerId}
              </span>
            )}
          </div>

          {billing.error && (
            <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              {billing.error}
            </p>
          )}

          {billing.invoices.length > 0 ? (
            <div className="mt-4 overflow-hidden rounded-2xl border border-[#102D2A]/10">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#FFF9EA] text-xs uppercase tracking-[0.12em] text-[#53655E]">
                  <tr>
                    <th className="px-4 py-3">Factura</th>
                    <th className="px-4 py-3">Fecha</th>
                    <th className="px-4 py-3">Importe</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3 text-right">Descarga</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#102D2A]/10 bg-white">
                  {billing.invoices.map((invoice) => (
                    <tr key={invoice.id}>
                      <td className="px-4 py-3 font-semibold text-[#102D2A]">
                        {invoice.number ?? invoice.id}
                      </td>
                      <td className="px-4 py-3 text-[#53655E]">
                        {formatDate(invoice.created)}
                      </td>
                      <td className="px-4 py-3 text-[#53655E]">
                        {formatInvoiceAmount(invoice.amountDue, invoice.currency)}
                      </td>
                      <td className="px-4 py-3 text-[#53655E]">
                        {invoice.status ?? "Sin estado"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {invoice.invoicePdf ? (
                          <a
                            href={invoice.invoicePdf}
                            className="font-bold text-[#27765B] underline"
                          >
                            PDF
                          </a>
                        ) : invoice.hostedInvoiceUrl ? (
                          <a
                            href={invoice.hostedInvoiceUrl}
                            className="font-bold text-[#27765B] underline"
                          >
                            Ver
                          </a>
                        ) : (
                          <span className="text-[#8A6B3E]">No disponible</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-dashed border-[#102D2A]/15 bg-[#FFF9EA] p-6 text-sm leading-6 text-[#53655E]">
              Aun no hay facturas para esta cuenta. Cuando el cliente pague la
              primera mensualidad, apareceran aqui sus descargas.
            </div>
          )}
        </div>
      </section>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <AccountProfileForm initialName={name} email={email} />
          <PasswordResetForm />
        </div>

        <aside className="space-y-5">
          <section className="rounded-2xl border border-[#102D2A]/10 bg-white p-6">
            <h2 className="text-lg font-semibold text-[#102D2A]">Tu sesion</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-[#8A6B3E]">Email</dt>
                <dd className="font-medium text-[#102D2A]">{email || "Sin email"}</dd>
              </div>
              <div>
                <dt className="text-[#8A6B3E]">ID usuario</dt>
                <dd className="break-all font-mono text-xs text-[#53655E]">
                  {user?.id ?? "Sin sesion"}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-[#102D2A]/10 bg-[#DDF6DF] p-6">
            <h2 className="text-lg font-semibold text-[#102D2A]">
              Datos del comercio
            </h2>
            <p className="mt-2 text-sm text-[#27765B]">
              Logo, colores, WhatsApp, email del dueño, enlace de Google y
              mensajes del QR se editan desde el panel de experiencia.
            </p>
            <Link
              href="/admin/experience"
              className="mt-4 inline-block rounded-lg bg-[#102D2A] px-4 py-2 text-sm font-semibold text-white"
            >
              Configurar mi QR
            </Link>
          </section>
        </aside>
      </div>
    </main>
  );
}
