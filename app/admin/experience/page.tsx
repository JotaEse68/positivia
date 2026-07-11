import Link from "next/link";
import { headers } from "next/headers";
import BusinessExperienceForm from "@/components/BusinessExperienceForm";
import { normalizeRatingCopy } from "@/lib/rating-copy";
import { createServerSupabase } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase";
import { isSuperadminUser } from "@/lib/superadmin";
import { linkBusinessesForCurrentUser } from "@/lib/business-access";

export const dynamic = "force-dynamic";

type Business = {
  id: string;
  name: string;
  slug: string;
  plan: "starter" | "pro";
  parent_business_id: string | null;
  logo_url: string | null;
  banner_url?: string | null;
  color_primary: string | null;
  google_review_link: string | null;
  whatsapp_owner: string | null;
  email_owner: string | null;
};

type SupabaseClientLike = Awaited<ReturnType<typeof createServerSupabase>> | ReturnType<typeof supabaseAdmin>;

async function getRatingSettings(supabase: SupabaseClientLike, businessId: string) {
  const fields =
    "visual_theme, logo_display, incentive_text, issue_options, positive_redirect_title, positive_redirect_body, private_prompt_title, private_prompt_body, private_submit_label, private_thanks_title, private_thanks_body, recovery_hint, appreciation_note, reward_enabled, reward_text";

  const { data } = await supabase
    .from("business_rating_settings")
    .select(fields)
    .eq("business_id", businessId)
    .maybeSingle();

  return normalizeRatingCopy(data);
}

export default async function ExperiencePage({
  searchParams,
}: {
  searchParams: Promise<{ b?: string }>;
}) {
  const query = await searchParams;
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isSuperadmin = isSuperadminUser(user);
  const db = isSuperadmin ? supabaseAdmin() : supabase;

  if (user && !isSuperadmin) await linkBusinessesForCurrentUser(user);

  const businessFields =
    "id, name, slug, plan, parent_business_id, logo_url, banner_url, color_primary, google_review_link, whatsapp_owner, email_owner";
  const { data: businesses } = await db
    .from("businesses")
    .select(businessFields)
    .order("created_at", { ascending: true });

  const list = (businesses ?? []) as Business[];

  if (list.length === 0) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-black text-[#102D2A]">No hay negocio vinculado</h1>
        <p className="mt-2 text-[#53655E]">
          Entra con el email que está configurado como dueño del comercio para poder
          ajustar el QR, Google y los mensajes.
        </p>
      </main>
    );
  }

  const selected = list.find((business) => business.id === query.b) ?? list[0];
  const ratingSettings = await getRatingSettings(db, selected.id);
  const headersList = await headers();
  const host = headersList.get("host") ?? "app.positivia.net";
  const proto = headersList.get("x-forwarded-proto") ?? "https";
  const qrUrl = `${proto}://${host}/r/${selected.slug}`;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#1F7A4E]">
            {isSuperadmin ? "Superadmin / panel del cliente" : "Panel del cliente"}
          </p>
          <h1 className="mt-1 text-3xl font-black text-[#102D2A]">
            Experiencia QR y reseñas
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#53655E]">
            Esta es la sección que faltaba: lo que controla el dueño del comercio sin
            depender del superadmin.
          </p>
        </div>
        <Link
          href={isSuperadmin ? "/superadmin" : `/admin/dashboard?b=${selected.id}`}
          className="rounded-lg border border-[#102D2A]/15 bg-white px-4 py-2 text-sm font-bold text-[#243126]"
        >
          {isSuperadmin ? "Volver al centro" : "Ver quejas"}
        </Link>
        {isSuperadmin && (
          <Link
            href={`/admin/dashboard?b=${selected.id}`}
            className="rounded-lg bg-[#102D2A] px-4 py-2 text-sm font-bold text-white"
          >
            Ver quejas
          </Link>
        )}
      </div>

      {list.length > 1 && (
        <div className="mb-5 flex flex-wrap gap-2">
          {list.map((business) => (
            <Link
              key={business.id}
              href={`/admin/experience?b=${business.id}`}
              className={`rounded-full border px-3 py-1.5 text-sm font-bold ${
                business.id === selected.id
                  ? "border-[#24A66D] bg-[#EAF9EF] text-[#1F7A4E]"
                  : "border-[#102D2A]/10 bg-white text-[#53655E] hover:bg-[#FFF9EA]"
              }`}
            >
              {business.name}
            </Link>
          ))}
        </div>
      )}

      <BusinessExperienceForm
        business={selected}
        ratingSettings={ratingSettings}
        qrUrl={qrUrl}
      />
    </main>
  );
}
