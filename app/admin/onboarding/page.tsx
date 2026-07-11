import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase";
import { isSuperadminUser } from "@/lib/superadmin";
import OnboardingForm from "@/components/OnboardingForm";

export const dynamic = "force-dynamic";

async function linkBusinessesForCurrentUser(user: { id: string; email?: string | null }) {
  const email = user.email?.trim();
  if (!user?.id || !email) return;

  const admin = supabaseAdmin();
  const { data: matches } = await admin
    .from("businesses")
    .select("id")
    .ilike("email_owner", email);

  if (!matches?.length) return;

  await admin.from("admin_users").upsert(
    matches.map((business) => ({
      business_id: business.id,
      clerk_user_id: user.id,
      role: "owner",
    })),
    { onConflict: "business_id,clerk_user_id" }
  );
}

export default async function OnboardingPage() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-neutral-500">Necesitas iniciar sesión.</p>
      </main>
    );
  }

  const isSuperadmin = isSuperadminUser(user);
  const db = isSuperadmin ? supabaseAdmin() : supabase;

  if (!isSuperadmin) await linkBusinessesForCurrentUser(user);

  const { data: businesses } = await db
    .from("businesses")
    .select(
      "id, name, slug, google_review_link, whatsapp_owner, email_owner, logo_url"
    )
    .order("created_at", { ascending: true });

  const list = businesses ?? [];
  const business =
    list.find((b) => !b.slug || !b.google_review_link) ?? list[0];

  if (!business) {
    return (
      <main className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-xl font-black text-neutral-900">
          No hay negocio vinculado
        </h1>
        <p className="mt-2 text-neutral-500">
          Tu cuenta todavía no está vinculada a ningún negocio.
        </p>
        <Link href="/admin/dashboard" className="mt-5 inline-block text-green-600 underline">
          Ir al panel
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FFF9EA] px-4 py-10 text-[#102D2A]">
      <div className="mx-auto max-w-2xl">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-[#27765B]">
          Puesta en marcha
        </p>
        <h1 className="mt-1 text-3xl font-black tracking-tight">
          Configura tu negocio
        </h1>
        <p className="mt-2 text-sm leading-6 text-[#53655E]">
          Cuatro pasos y tu QR está listo para usarse.
        </p>

        <div className="mt-8">
          <OnboardingForm business={business} />
        </div>
      </div>
    </main>
  );
}
