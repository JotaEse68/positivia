import type { Metadata } from "next";
import Image from "next/image";
import { getDemoBusiness } from "@/lib/demo";
import { supabaseAnon } from "@/lib/supabase";
import RatingStars from "@/components/RatingStars";

// La landing es el destino del QR: se abre desde móvil y tiene que
// cargar rápido. Server component, sin JS innecesario.
export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

async function getBusiness(slug: string) {
  const demo = getDemoBusiness(slug);
  if (demo) return demo;

  const supabase = supabaseAnon();
  const { data } = await supabase
    .from("businesses")
    .select("id, slug, name, logo_url, color_primary, google_review_link, plan_status")
    .eq("slug", slug)
    .maybeSingle();
  return data;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const business = await getBusiness(slug);
  return {
    title: business ? `${business.name} — Tu opinión` : "PositivIA",
    robots: { index: false },
  };
}

export default async function RatingPage({ params }: Props) {
  const { slug } = await params;
  const business = await getBusiness(slug);

  if (!business || business.plan_status === "cancelled") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-50 p-6">
        <div className="text-center">
          <p className="text-2xl font-semibold text-neutral-700">
            Página no disponible
          </p>
          <p className="mt-2 text-neutral-500">
            Este enlace de valoración no está activo.
          </p>
        </div>
      </main>
    );
  }

  const brand = business.color_primary ?? "#16a34a";

  return (
    <main
      className="min-h-screen bg-[#F8F5EE] px-4 py-5 text-[#132F2B]"
      style={{ ["--brand" as string]: brand }}
    >
      <div className="mx-auto flex min-h-[calc(100vh-40px)] w-full max-w-md flex-col">
        <section className="relative flex flex-1 flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl shadow-neutral-900/10">
          <div
            className="absolute inset-x-0 top-0 h-40"
            style={{
              background:
                "linear-gradient(135deg, var(--brand), #12312F 76%)",
            }}
          />
          <div className="relative px-5 pt-6 text-white">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {business.logo_url ? (
                  <Image
                    src={business.logo_url}
                    alt={business.name}
                    width={58}
                    height={58}
                    className="h-14 w-14 rounded-2xl border border-white/20 object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/15 text-2xl font-bold backdrop-blur">
                    {business.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/65">
                    Tu opinión
                  </p>
                  <h1 className="text-2xl font-bold leading-tight">{business.name}</h1>
                </div>
              </div>
              <span className="rounded-full border border-white/20 px-3 py-1 text-xs text-white/80">
                30s
              </span>
            </div>

            <div className="mt-7">
              <p className="text-3xl font-bold leading-tight">
                ¿Cómo ha ido hoy?
              </p>
              <p className="mt-2 max-w-xs text-sm leading-6 text-white/75">
                Toca una estrella. Si algo no ha ido bien, lo lee directamente
                el responsable del negocio.
              </p>
            </div>
          </div>

          <div className="relative mx-4 mt-8 rounded-3xl border border-neutral-100 bg-white p-5 shadow-xl shadow-neutral-900/10">
            <div className="rounded-2xl bg-[#F8F5EE] px-4 py-3 text-center">
              <p className="text-sm font-medium text-neutral-700">
                Valora tu experiencia
              </p>
              <p className="mt-1 text-xs text-neutral-500">
                Sin registro, sin descargar apps.
              </p>
            </div>

            <RatingStars slug={business.slug} />
          </div>

          <div className="mt-auto px-5 pb-5 pt-6">
            <div className="grid grid-cols-2 gap-2 text-xs text-neutral-500">
              <div className="rounded-2xl bg-neutral-50 p-3">
                <p className="font-semibold text-neutral-800">4-5 estrellas</p>
                <p className="mt-1">Te ayuda a dejar una reseña pública.</p>
              </div>
              <div className="rounded-2xl bg-neutral-50 p-3">
                <p className="font-semibold text-neutral-800">1-3 estrellas</p>
                <p className="mt-1">Abre un mensaje privado al negocio.</p>
              </div>
            </div>
            <p className="mt-5 text-center text-xs text-neutral-400">
              Protegido por PositivIA
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
