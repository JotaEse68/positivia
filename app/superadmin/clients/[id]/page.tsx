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

  const { data: b } = await supabaseAdmin()
    .from("businesses")
    .select(
      "id, name, slug, plan, plan_status, logo_url, color_primary, google_review_link, whatsapp_owner, email_owner, parent_business_id"
    )
    .eq("slug", id)
    .maybeSingle();

  if (!b) notFound();

  const { data: ratingSettings } = await supabaseAdmin()
    .from("business_rating_settings")
    .select(
      "positive_redirect_title, positive_redirect_body, private_prompt_title, private_prompt_body, private_submit_label, private_thanks_title, private_thanks_body, recovery_hint, appreciation_note"
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

          {/* QR imprimible */}
          <section className="rounded-2xl border bg-white p-6 text-center">
            <h2 className="mb-4 text-lg font-semibold text-neutral-900">
              QR para imprimir
            </h2>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/qr?slug=${b.slug}`}
              alt={`QR de ${b.name}`}
              width={220}
              height={220}
              className="mx-auto rounded-lg border"
            />
            <p className="mt-3 break-all text-xs text-neutral-400">{landingUrl}</p>
            <a
              href={`/api/qr?slug=${b.slug}&download=1`}
              className="mt-4 inline-block rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
            >
              ⬇ Descargar PNG (alta resolución)
            </a>
            <a
              href={`/r/${b.slug}`}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block rounded-lg border px-4 py-2 text-sm font-medium text-neutral-700"
            >
              Abrir evaluación
            </a>
          </section>
        </div>
      </main>
    </div>
  );
}
