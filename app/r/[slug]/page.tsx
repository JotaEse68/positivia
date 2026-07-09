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

  const brand = business.color_primary ?? "#23A96F";

  return (
    <main
      className="min-h-screen bg-[#FFF7DA] px-4 py-5 text-[#243126]"
      style={{ ["--brand" as string]: brand }}
    >
      <div className="mx-auto flex min-h-[calc(100vh-40px)] w-full max-w-md flex-col">
        <section className="relative flex flex-1 flex-col overflow-hidden rounded-[30px] bg-white shadow-2xl shadow-[#B86B35]/15">
          <div
            className="absolute inset-x-0 top-0 h-48"
            style={{
              background:
                "radial-gradient(circle at 22% 24%, #FFE07A 0 18%, transparent 36%), linear-gradient(135deg, #FFB84D 0%, #FF7D66 42%, var(--brand) 100%)",
            }}
          />
          <div className="pv-sparkle absolute right-7 top-32 z-10 flex h-16 w-16 items-center justify-center rounded-full bg-white text-3xl shadow-xl shadow-[#D95B48]/20">
            ✨
          </div>
          <div className="relative px-5 pt-6 text-white">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {business.logo_url ? (
                  <Image
                    src={business.logo_url}
                    alt={business.name}
                    width={58}
                    height={58}
                    className="h-14 w-14 rounded-2xl border border-white/35 object-cover shadow-sm"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/35 bg-white/20 text-2xl font-bold backdrop-blur">
                    {business.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/75">
                    Opinión rápida
                  </p>
                  <h1 className="text-2xl font-bold leading-tight">{business.name}</h1>
                </div>
              </div>
              <span className="rounded-full border border-white/30 bg-white/15 px-3 py-1 text-xs font-medium text-white">
                20s
              </span>
            </div>

            <div className="mt-8 pr-14">
              <p className="text-3xl font-black leading-tight">
                ¿Qué tal te ha cuidado el equipo?
              </p>
              <p className="mt-2 max-w-xs text-sm leading-6 text-white/85">
                Una estrella basta. Si algo falló, se lo cuentas en privado al
                responsable.
              </p>
            </div>
          </div>

          <div className="relative mx-4 mt-10 rounded-[28px] border border-[#FFE1A6] bg-white p-5 shadow-xl shadow-[#D95B48]/10">
            <div className="rounded-3xl bg-[#FFF4CF] px-4 py-3 text-center">
              <p className="text-sm font-bold text-[#623B16]">
                Toca una estrella
              </p>
              <p className="mt-1 text-xs text-[#8A6B3E]">
                Sin cuenta, sin descargar nada.
              </p>
            </div>

            <RatingStars slug={business.slug} />
          </div>

          <div className="mt-auto px-5 pb-5 pt-6">
            <div className="grid grid-cols-2 gap-2 text-xs text-[#75543B]">
              <div className="rounded-2xl bg-[#FFF8E7] p-3">
                <p className="font-bold text-[#4E351F]">4-5 estrellas</p>
                <p className="mt-1">Te lleva a apoyar al negocio en Google.</p>
              </div>
              <div className="rounded-2xl bg-[#FFF0ED] p-3">
                <p className="font-bold text-[#4E351F]">1-3 estrellas</p>
                <p className="mt-1">Abre un mensaje privado para mejorar.</p>
              </div>
            </div>
            <p className="mt-5 text-center text-xs font-medium text-[#A37A48]">
              Hecho con PositivIA para escuchar mejor
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
