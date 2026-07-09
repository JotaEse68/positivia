import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getSuperadmin } from "@/lib/superadmin";
import { normalizeRatingCopy } from "@/lib/rating-copy";
import { supabaseAdmin } from "@/lib/supabase";
import ClientEditForm from "@/components/ClientEditForm";
import LogoutButton from "@/components/LogoutButton";

export const dynamic = "force-dynamic";

// El parámetro [id] es el slug del negocio (URLs legibles).
export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const su = await getSuperadmin();
  if (!su) notFound();
  const { id } = await params;

  const businessFields =
    "id, name, slug, plan, plan_status, logo_url, banner_url, color_primary, google_review_link, whatsapp_owner, email_owner, parent_business_id";
  const fallbackBusinessFields =
    "id, name, slug, plan, plan_status, logo_url, color_primary, google_review_link, whatsapp_owner, email_owner, parent_business_id";
  const { data: initialBusiness, error: businessError } = await supabaseAdmin()
    .from("businesses")
    .select(businessFields)
    .eq("slug", id)
    .maybeSingle();

  const fallbackBusiness =
    businessError?.code === "42703"
      ? await supabaseAdmin()
          .from("businesses")
          .select(fallbackBusinessFields)
          .eq("slug", id)
          .maybeSingle()
      : null;

  const b = initialBusiness ?? fallbackBusiness?.data;

  if (!b) notFound();

  const { data: ratingSettings } = await supabaseAdmin()
    .from("business_rating_settings")
    .select(
      "visual_theme, logo_display, incentive_text, issue_options, positive_redirect_title, positive_redirect_body, private_prompt_title, private_prompt_body, private_submit_label, private_thanks_title, private_thanks_body, recovery_hint, appreciation_note"
    )
    .eq("business_id", b.id)
    .maybeSingle();

  const base = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "";
  const landingUrl = `${base}/r/${b.slug}`;

  return (
    <div className="min-h-screen bg-neutral-100">
      <header className="border-b bg-neutral-950">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Link href="/superadmin" className="text-sm text-neutral-300 hover:text-white">
            ← Todos los clientes
          </Link>
          <LogoutButton />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex items-center gap-4">
          {b.logo_url ? (
            <Image
              src={b.logo_url}
              alt={b.name}
              width={56}
              height={56}
              className="h-14 w-14 rounded-full object-cover"
              unoptimized
            />
          ) : (
            <div
              className="flex h-14 w-14 items-center justify-center rounded-full text-xl font-bold text-white"
              style={{ backgroundColor: b.color_primary ?? "#16a34a" }}
            >
              {b.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">{b.name}</h1>
            <p className="text-sm text-neutral-500">/r/{b.slug}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
          <ClientEditForm client={b} ratingSettings={normalizeRatingCopy(ratingSettings)} />

          <aside className="space-y-5">
            <section className="rounded-2xl border bg-white p-5 text-center">
              <h2 className="text-lg font-black text-neutral-900">
                QR listo para imprimir
              </h2>
              <p className="mt-1 text-sm text-neutral-500">
                Cartel vertical para mostrador, servilletero o recepción.
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/qr-card?slug=${b.slug}`}
                alt={`Cartel QR de ${b.name}`}
                width={260}
                height={367}
                className="mx-auto mt-4 rounded-xl border shadow-sm"
              />
              <p className="mt-3 break-all text-xs text-neutral-400">{landingUrl}</p>
              <div className="mt-4 grid gap-2">
                <a
                  href={`/api/qr-card?slug=${b.slug}&download=1`}
                  className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-bold text-white"
                >
                  Descargar cartel SVG
                </a>
                <a
                  href={`/api/qr?slug=${b.slug}&download=1`}
                  className="rounded-lg border px-4 py-2 text-sm font-bold text-neutral-700"
                >
                  Descargar solo QR PNG
                </a>
                <a
                  href={`/r/${b.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border px-4 py-2 text-sm font-bold text-neutral-700"
                >
                  Abrir evaluación
                </a>
              </div>
            </section>

            <section className="rounded-2xl border border-amber-100 bg-[#FFF8E7] p-5">
              <h2 className="text-lg font-black text-[#5A3D25]">
                Medidas útiles
              </h2>
              <div className="mt-3 space-y-3 text-sm leading-6 text-[#76543A]">
                <p>
                  <strong>Cartel:</strong> A5 vertical o 10x15 cm para mostrador.
                </p>
                <p>
                  <strong>Servilletero:</strong> QR mínimo 35 mm de ancho.
                </p>
                <p>
                  <strong>Ticket:</strong> QR mínimo 28 mm y frase de una línea.
                </p>
                <p>
                  <strong>Logo:</strong> 800x800 px. Horizontal: 1200x400 px.
                </p>
              </div>
            </section>
          </aside>
        </div>

        <section className="mt-8 rounded-2xl border bg-white p-6">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-green-700">
            Ayuda para conseguir más reseñas
          </p>
          <h2 className="mt-1 text-2xl font-black text-neutral-950">
            Un QR suelto en una pared no vende nada
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-600">
            Tienes razón en desconfiar: un QR mudo suele ser papel mojado. Por eso
            el sistema debe venir con ubicación, guion y un motivo claro para escanear.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {[
              {
                n: "01",
                title: "El camarero lo pide, no el cartel",
                body:
                  "Guion de 3 segundos: 'Si nos ayudas con una estrella ahora, nos haces un favor enorme. Es solo escanear y tocar.'",
              },
              {
                n: "02",
                title: "Va en el ticket, no escondido en la pared",
                body:
                  "Imprímelo en la cuenta, en manteles de papel, servilleteros y tarjetas de mesa. Tiene que estar donde el cliente ya mira.",
              },
              {
                n: "03",
                title: "Motivo tangible y configurable",
                body:
                  "Ejemplos: sorteo de cena para dos, noche de hotel, café, chupito, upgrade VIP o descuento para la próxima visita.",
              },
              {
                n: "04",
                title: "Un toque, cero fricción",
                body:
                  "Sin registro, sin app, sin login. Se responde con una estrella y, si algo fue mal, el mensaje llega privado.",
              },
            ].map((item) => (
              <article key={item.n} className="rounded-2xl border border-neutral-200 p-4">
                <span className="text-xs font-black text-amber-500">{item.n}</span>
                <h3 className="mt-2 text-base font-black text-neutral-950">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-neutral-600">{item.body}</p>
              </article>
            ))}
          </div>

          <div className="mt-6 rounded-2xl bg-[#EAF9EF] p-5">
            <h3 className="font-black text-[#1F7A4E]">
              Frases rápidas para el equipo
            </h3>
            <div className="mt-3 grid gap-3 text-sm leading-6 text-[#337257] md:grid-cols-3">
              <p>¿Nos ayudas con una valoración? Es tocar una estrella y listo.</p>
              <p>Si algo no estuvo bien, cuéntanoslo ahí y lo revisa el encargado.</p>
              <p>Con tu opinión entras en el sorteo de este mes y seguimos mejorando.</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
