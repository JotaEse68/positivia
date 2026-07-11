import Link from "next/link";
import Image from "next/image";
import { createServerSupabase } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase";
import { isSuperadminUser } from "@/lib/superadmin";

export const dynamic = "force-dynamic";

type Business = {
  id: string;
  name: string;
  slug: string | null;
  logo_url: string | null;
};

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

export default async function QrPage({
  searchParams,
}: {
  searchParams: Promise<{ b?: string }>;
}) {
  const query = await searchParams;
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-[#53655E]">Necesitas iniciar sesión.</p>
      </main>
    );
  }

  const isSuperadmin = isSuperadminUser(user);
  const db = isSuperadmin ? supabaseAdmin() : supabase;

  if (!isSuperadmin) await linkBusinessesForCurrentUser(user);

  const { data: businesses } = await db
    .from("businesses")
    .select("id, name, slug, logo_url")
    .order("created_at", { ascending: true });

  const list = (businesses ?? []) as Business[];

  if (list.length === 0) {
    return (
      <main className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-xl font-black text-[#102D2A]">No hay negocio vinculado</h1>
        <p className="mt-2 text-[#53655E]">
          Tu cuenta todavía no está vinculada a ningún negocio.
        </p>
      </main>
    );
  }

  const selected = list.find((b) => b.id === query.b) ?? list[0];

  if (!selected.slug) {
    return (
      <main className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-xl font-black text-[#102D2A]">Falta reclamar tu dirección</h1>
        <p className="mt-2 text-[#53655E]">
          Completa el asistente de alta para tener tu QR listo.
        </p>
        <Link href="/admin/onboarding" className="mt-5 inline-block text-[#27765B] underline">
          Ir al asistente
        </Link>
      </main>
    );
  }

  const slug = selected.slug;
  const qrLabel = `/api/qr?slug=${slug}`;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-[#27765B]">Mi QR</p>
      <h1
        className="mt-1 text-2xl font-black text-[#102D2A]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {selected.name}
      </h1>
      <p className="mt-2 text-sm text-[#53655E]">
        Descarga el QR o el kit listo para imprimir, sin pasar por ninguna otra pantalla.
      </p>

      {list.length > 1 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {list.map((b) => (
            <Link
              key={b.id}
              href={`/admin/qr?b=${b.id}`}
              className={`rounded-full border px-3 py-1.5 text-sm ${
                b.id === selected.id
                  ? "border-[#27765B] bg-[#DDF6DF] text-[#27765B]"
                  : "border-[#102D2A]/10 bg-white text-[#53655E] hover:bg-[#FFF9EA]"
              }`}
            >
              {b.name}
            </Link>
          ))}
        </div>
      )}

      <section className="mt-6 grid gap-6 rounded-[24px] border border-[#102D2A]/10 bg-white p-6 sm:grid-cols-[220px_1fr]">
        <div className="flex flex-col items-center gap-3">
          <div className="overflow-hidden rounded-2xl border border-[#102D2A]/10 bg-[#FFF9EA] p-3">
            <Image
              src={qrLabel}
              alt={`QR de ${selected.name}`}
              width={180}
              height={180}
              unoptimized
            />
          </div>
          <a
            href={`/r/${slug}`}
            target="_blank"
            className="text-xs font-bold text-[#27765B] underline"
          >
            /r/{slug}
          </a>
        </div>

        <div>
          <h2 className="text-sm font-black uppercase tracking-[0.1em] text-[#8A6B3E]">
            Kit para imprimir
          </h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <a
              href={`${qrLabel}&download=1`}
              className="rounded-lg bg-[#102D2A] px-4 py-2 text-center text-sm font-black text-white"
            >
              Solo QR (PNG)
            </a>
            <a
              href={`/api/qr-card?slug=${slug}`}
              className="rounded-lg border border-[#102D2A]/15 bg-white px-4 py-2 text-center text-sm font-black text-[#102D2A]"
            >
              Tarjeta de mesa
            </a>
            <a
              href={`/api/qr-print?slug=${slug}&size=a4&layout=full`}
              className="rounded-lg border border-[#102D2A]/15 bg-white px-4 py-2 text-center text-sm font-black text-[#102D2A]"
            >
              Cartel A4
            </a>
            <a
              href={`/api/qr-print?slug=${slug}&size=a3&layout=full`}
              className="rounded-lg border border-[#102D2A]/15 bg-white px-4 py-2 text-center text-sm font-black text-[#102D2A]"
            >
              Cartel A3
            </a>
            <a
              href={`/api/qr-print?slug=${slug}&layout=ticket`}
              className="rounded-lg border border-[#102D2A]/15 bg-white px-4 py-2 text-center text-sm font-black text-[#102D2A]"
            >
              Ticket 80mm
            </a>
            <a
              href={`/api/qr-print?slug=${slug}&layout=table`}
              className="rounded-lg border border-[#102D2A]/15 bg-white px-4 py-2 text-center text-sm font-black text-[#102D2A]"
            >
              Servilletero
            </a>
          </div>
          <p className="mt-4 text-xs text-[#8A6B3E]">
            ¿Quieres cambiar colores, logo o el enlace de Google? Eso se ajusta en{" "}
            <Link href={`/admin/experience?b=${selected.id}`} className="underline">
              Configurar QR
            </Link>
            .
          </p>
        </div>
      </section>
    </main>
  );
}
