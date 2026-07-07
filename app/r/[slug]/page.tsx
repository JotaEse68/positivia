import type { Metadata } from "next";
import Image from "next/image";
import { supabaseAnon } from "@/lib/supabase";
import RatingStars from "@/components/RatingStars";

// La landing es el destino del QR: se abre desde móvil y tiene que
// cargar rápido. Server component, sin JS innecesario.
export const revalidate = 60;

type Props = { params: { slug: string } };

async function getBusiness(slug: string) {
  const supabase = supabaseAnon();
  const { data } = await supabase
    .from("businesses")
    .select("id, slug, name, logo_url, color_primary, google_review_link, plan_status")
    .eq("slug", slug)
    .maybeSingle();
  return data;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const business = await getBusiness(params.slug);
  return {
    title: business ? `${business.name} — Tu opinión` : "PositivIA",
    robots: { index: false },
  };
}

export default async function RatingPage({ params }: Props) {
  const business = await getBusiness(params.slug);

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
      className="flex min-h-screen flex-col items-center justify-center bg-white p-6"
      style={{ ["--brand" as string]: brand }}
    >
      <div className="w-full max-w-sm text-center">
        {business.logo_url ? (
          <Image
            src={business.logo_url}
            alt={business.name}
            width={96}
            height={96}
            className="mx-auto mb-4 h-24 w-24 rounded-full object-cover"
            unoptimized
          />
        ) : (
          <div
            className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full text-3xl font-bold text-white"
            style={{ backgroundColor: "var(--brand)" }}
          >
            {business.name.charAt(0).toUpperCase()}
          </div>
        )}

        <h1 className="text-2xl font-bold text-neutral-900">{business.name}</h1>
        <p className="mt-2 text-lg text-neutral-600">
          ¿Qué tal ha sido tu experiencia?
        </p>

        <RatingStars slug={business.slug} />

        <p className="mt-10 text-xs text-neutral-400">
          Protegido por PositivIA
        </p>
      </div>
    </main>
  );
}
