import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase";
import { isSuperadminUser } from "@/lib/superadmin";
import AdminStatsCard from "@/components/AdminStatsCard";
import ComplaintList from "@/components/ComplaintList";

export const dynamic = "force-dynamic";

type Business = {
  id: string;
  name: string;
  slug: string | null;
  plan: "starter" | "pro";
  parent_business_id: string | null;
  google_review_link: string | null;
};

async function linkBusinessesForCurrentUser(user: { id: string; email?: string | null }) {
  const email = user.email?.trim();
  if (!user?.id || !email) return;

  const admin = supabaseAdmin();
  const { data: matches, error } = await admin
    .from("businesses")
    .select("id")
    .ilike("email_owner", email);

  if (error || !matches?.length) return;

  await admin.from("admin_users").upsert(
    matches.map((business) => ({
      business_id: business.id,
      clerk_user_id: user.id,
      role: "owner",
    })),
    { onConflict: "business_id,clerk_user_id" }
  );
}

export default async function DashboardPage({
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

  // Negocios accesibles (RLS: los del dueño + sus locales hijos).
  const { data: businesses } = await db
    .from("businesses")
    .select("id, name, slug, plan, parent_business_id, google_review_link")
    .order("created_at", { ascending: true });

  const list = (businesses ?? []) as Business[];

  if (list.length === 0) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-neutral-900">Aún no tienes negocios</h1>
        <p className="mt-2 text-neutral-500">
          Tu cuenta todavía no está vinculada a ningún negocio. Si te acaban de
          invitar, revisa que hayas entrado con el mismo email configurado en tu
          ficha de cliente.
        </p>
        <Link href="/demo/dashboard" className="mt-5 inline-block text-green-600 underline">
          Ver demo del panel
        </Link>
      </main>
    );
  }

  const selected =
    list.find((b) => b.id === query.b) ?? list[0];

  if (!isSuperadmin && (!selected.slug || !selected.google_review_link)) {
    redirect("/admin/onboarding");
  }

  const isPro = selected.plan === "pro";

  // Feedback del negocio seleccionado (RLS-scoped).
  const { data: initialFeedback, error: feedbackError } = await db
    .from("feedback")
    .select(
      "id, rating, comment, status, ai_urgency, ai_summary_theme, suggested_reply, issue_categories, contact_info, reply_sent, created_at"
    )
    .eq("business_id", selected.id)
    .order("created_at", { ascending: false });
  let feedback = initialFeedback;

  if (feedbackError?.code === "42703") {
    const fallback = await db
      .from("feedback")
      .select(
        "id, rating, comment, status, ai_urgency, ai_summary_theme, suggested_reply, reply_sent, created_at"
      )
      .eq("business_id", selected.id)
      .order("created_at", { ascending: false });
    feedback =
      fallback.data?.map((row) => ({
        ...row,
        issue_categories: null,
        contact_info: null,
      })) ?? null;
  }

  const rows = feedback ?? [];
  const publicCount = rows.filter((f) => f.status === "public_redirected").length;
  const complaints = rows.filter((f) => f.status === "private_captured");
  const pending = complaints.filter((f) => !f.reply_sent).length;

  // Resúmenes semanales.
  const { data: summaries } = await db
    .from("weekly_summaries")
    .select("id, week_start, week_end, summary_text, top_theme, positive_count, negative_count")
    .eq("business_id", selected.id)
    .order("week_start", { ascending: false })
    .limit(8);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          {isSuperadmin && (
            <Link href="/superadmin" className="text-xs font-bold uppercase tracking-[0.14em] text-green-700">
              Superadmin
            </Link>
          )}
          <h1 className="text-2xl font-bold text-neutral-900">{selected.name}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/admin/experience?b=${selected.id}`}
            className="rounded-lg bg-neutral-950 px-3 py-1.5 text-sm font-semibold text-white"
          >
            Configurar QR
          </Link>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              isPro ? "bg-green-100 text-green-700" : "bg-neutral-200 text-neutral-600"
            }`}
          >
            Plan {isPro ? "Pro" : "Starter"}
          </span>
        </div>
      </div>

      {/* Selector de local (si el dueño gestiona varios) */}
      {list.length > 1 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {list.map((b) => (
            <Link
              key={b.id}
              href={`/admin/dashboard?b=${b.id}`}
              className={`rounded-full border px-3 py-1.5 text-sm ${
                b.id === selected.id
                  ? "border-green-500 bg-green-50 text-green-700"
                  : "bg-white text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              {b.name}
            </Link>
          ))}
        </div>
      )}

      {/* KPIs — el número que justifica el precio */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <AdminStatsCard
          label="Reseñas públicas generadas"
          value={publicCount}
          hint="Clientes contentos enviados a Google"
          accent="green"
        />
        <AdminStatsCard
          label="Quejas interceptadas"
          value={complaints.length}
          hint="Nunca llegaron a ser públicas"
          accent="red"
        />
        <AdminStatsCard
          label="Pendientes de gestionar"
          value={pending}
          hint={pending > 0 ? "Requieren tu atención" : "Todo al día"}
        />
      </div>

      {/* Resúmenes semanales (Pro) */}
      {isPro && summaries && summaries.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-neutral-900">Resúmenes semanales</h2>
          <div className="mt-3 space-y-3">
            {summaries.map((s) => (
              <div key={s.id} className="rounded-2xl border bg-white p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-neutral-500">
                    {new Date(s.week_start).toLocaleDateString("es-ES")} –{" "}
                    {new Date(s.week_end).toLocaleDateString("es-ES")}
                  </p>
                  {s.top_theme && (
                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
                      {s.top_theme}
                    </span>
                  )}
                </div>
                <p className="mt-2 text-neutral-800">{s.summary_text}</p>
                <p className="mt-2 text-xs text-neutral-400">
                  {s.positive_count} positivas · {s.negative_count} quejas
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Quejas */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold text-neutral-900">
          Quejas privadas ({complaints.length})
        </h2>
        <p className="mb-3 text-sm text-neutral-500">
          Feedback que interceptaste antes de que llegara a Google.
        </p>
        <ComplaintList complaints={complaints} isPro={isPro} />
      </section>
    </main>
  );
}
