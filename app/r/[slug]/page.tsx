import type { Metadata } from "next";
import Image from "next/image";
import { getDemoBusiness } from "@/lib/demo";
import { defaultRatingCopy, normalizeRatingCopy, type RatingCopy } from "@/lib/rating-copy";
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
  const fields =
    "id, slug, name, logo_url, banner_url, color_primary, google_review_link, plan_status";
  const fallbackFields =
    "id, slug, name, logo_url, color_primary, google_review_link, plan_status";
  const { data, error } = await supabase
    .from("businesses")
    .select(fields)
    .eq("slug", slug)
    .maybeSingle();

  if (error?.code === "42703") {
    const fallback = await supabase
      .from("businesses")
      .select(fallbackFields)
      .eq("slug", slug)
      .maybeSingle();
    return fallback.data;
  }

  return data;
}

async function getRatingCopy(businessId: string | undefined): Promise<RatingCopy> {
  if (!businessId) return defaultRatingCopy;

  const supabase = supabaseAnon();
  const fields =
    "visual_theme, logo_display, incentive_text, issue_options, positive_redirect_title, positive_redirect_body, private_prompt_title, private_prompt_body, private_submit_label, private_thanks_title, private_thanks_body, recovery_hint, appreciation_note";
  const fallbackFields =
    "visual_theme, logo_display, positive_redirect_title, positive_redirect_body, private_prompt_title, private_prompt_body, private_submit_label, private_thanks_title, private_thanks_body, recovery_hint, appreciation_note";

  const { data, error } = await supabase
    .from("business_rating_settings")
    .select(fields)
    .eq("business_id", businessId)
    .maybeSingle();

  if (error?.code === "42703") {
    const fallback = await supabase
      .from("business_rating_settings")
      .select(fallbackFields)
      .eq("business_id", businessId)
      .maybeSingle();

    return normalizeRatingCopy(fallback.data);
  }

  return normalizeRatingCopy(data);
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
  const bannerUrl =
    "banner_url" in business && typeof business.banner_url === "string"
      ? business.banner_url
      : null;
  const copy = normalizeRatingCopy(
    business.id === "demo-business" ? defaultRatingCopy : await getRatingCopy(business.id)
  );
  const themes: Record<string, string> = {
    sunrise:
      `radial-gradient(circle at 20% 18%, #FFE07A 0 16%, transparent 36%), linear-gradient(135deg, #FFBE4D 0%, #FF7D66 42%, ${brand} 100%)`,
    hope:
      `radial-gradient(circle at 18% 20%, #FFF1A8 0 18%, transparent 36%), linear-gradient(135deg, ${brand} 0%, #A8D96F 48%, #FFBE4D 100%)`,
    coral:
      `radial-gradient(circle at 18% 22%, #FFE7B8 0 18%, transparent 36%), linear-gradient(135deg, #FF8F70 0%, #FF6B6B 46%, ${brand} 100%)`,
  };
  const bannerBackground = themes[copy.visual_theme] ?? themes.sunrise;

  return (
    <main
      className="min-h-screen bg-[#FFF7DA] px-4 py-5 text-[#243126]"
      style={{ ["--brand" as string]: brand }}
    >
      <div className="mx-auto flex min-h-[calc(100vh-40px)] w-full max-w-md flex-col">
        <section className="relative flex flex-1 flex-col overflow-hidden rounded-[30px] bg-white shadow-2xl shadow-[#B86B35]/15">
          <div
            className="relative h-64 overflow-hidden"
            style={{
              background: bannerUrl
                ? `${bannerBackground}`
                : bannerBackground,
            }}
          >
            {bannerUrl && (
              <Image
                src={bannerUrl}
                alt={`Banner de ${business.name}`}
                fill
                className="object-cover"
                unoptimized
                priority
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-black/20" />
            <div className="absolute left-5 top-5 rounded-full border border-white/30 bg-white/15 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-white backdrop-blur">
              Opinión rápida
            </div>
            <span className="absolute right-5 top-5 rounded-full border border-white/35 bg-white/20 px-3 py-1 text-xs font-bold text-white backdrop-blur">
                20s
              </span>
          </div>

          <div className="relative -mt-16 px-5 text-center">
            <div className="mx-auto flex justify-center">
              {business.logo_url ? (
                <Image
                  src={business.logo_url}
                  alt={business.name}
                  width={128}
                  height={128}
                  className={`rounded-full border-[6px] border-white bg-white object-contain p-2 shadow-2xl shadow-[#B86B35]/20 ${
                    copy.logo_display === "large" ? "h-32 w-32" : "h-24 w-24"
                  }`}
                  unoptimized
                />
              ) : (
                <div
                  className={`flex items-center justify-center rounded-full border-[6px] border-white text-4xl font-black text-white shadow-2xl shadow-[#B86B35]/20 ${
                    copy.logo_display === "large" ? "h-32 w-32" : "h-24 w-24"
                  }`}
                  style={{ backgroundColor: brand }}
                >
                  {business.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div className="mt-4">
              <h1 className="text-xl font-black leading-tight text-[#322A20]">
                {business.name}
              </h1>
              <p className="mt-3 text-3xl font-black leading-tight text-[#322A20]">
                ¿Qué tal fue tu visita?
              </p>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#6D5B49]">
                Tu opinión llega a quien puede hacer algo con ella. Si fue bien,
                te abrimos Google; si algo falló, lo hablamos en privado.
              </p>
            </div>
            {copy.incentive_text && (
              <div className="mx-auto mt-4 max-w-sm rounded-2xl border border-[#FFD6B8] bg-[#FFF8E7] px-4 py-3 text-sm font-bold leading-5 text-[#76543A] shadow-sm">
                {copy.incentive_text}
              </div>
            )}
          </div>

          <div className="relative mx-4 mt-6 rounded-[28px] border border-[#FFE1A6] bg-white p-5 shadow-xl shadow-[#D95B48]/10">
            <div className="rounded-3xl bg-[#FFF4CF] px-4 py-3 text-center">
              <p className="text-sm font-bold text-[#623B16]">
                Elige cómo te fuiste
              </p>
              <p className="mt-1 text-xs text-[#8A6B3E]">
                Un toque basta. No tienes que registrarte ni descargar nada.
              </p>
            </div>

            <RatingStars
              slug={business.slug}
              googleReviewLink={business.google_review_link ?? null}
              copy={copy}
            />
          </div>

          <div className="mt-auto px-5 pb-5 pt-6">
            <div className="grid grid-cols-2 gap-2 text-xs text-[#75543B]">
              <div className="rounded-2xl bg-[#FFF8E7] p-3">
                <p className="font-bold text-[#4E351F]">Si saliste contento</p>
                <p className="mt-1">
                  Te abrimos Google para que tu apoyo ayude al negocio.
                </p>
              </div>
              <div className="rounded-2xl bg-[#FFF0ED] p-3">
                <p className="font-bold text-[#4E351F]">Si algo no estuvo bien</p>
                <p className="mt-1">
                  Lo cuentas en privado y llega al responsable para arreglarlo.
                </p>
              </div>
            </div>
            <p className="mt-5 text-center text-xs font-medium text-[#A37A48]">
              {copy.appreciation_note}
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
