import Link from "next/link";
import Image from "next/image";
import { getSuperadmin } from "@/lib/superadmin";
import { supabaseAdmin } from "@/lib/supabase";
import NewClientForm from "@/components/NewClientForm";
import ClientStatusControls from "@/components/ClientStatusControls";
import LogoutButton from "@/components/LogoutButton";

export const dynamic = "force-dynamic";

const statusStyle: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  trial: "bg-amber-100 text-amber-700",
  cancelled: "bg-neutral-200 text-neutral-500",
};

type AccessLink = {
  label: string;
  href: string;
  hint: string;
  external?: boolean;
};

const accessGroups: { title: string; links: AccessLink[] }[] = [
  {
    title: "Demo vendible",
    links: [
      {
        label: "Demo guiada",
        href: "/demo",
        hint: "Recorrido vendible completo",
      },
      {
        label: "QR demo",
        href: "/r/demo-restaurante",
        hint: "Experiencia del cliente final",
      },
      {
        label: "Panel demo",
        href: "/demo/dashboard",
        hint: "Vista de dueño sin login",
      },
      {
        label: "Reseña simulada",
        href: "/demo/google-review",
        hint: "Paso externo controlado",
      },
      {
        label: "Descargar QR",
        href: "/api/qr?slug=demo-restaurante&download=1",
        hint: "PNG listo para imprimir",
      },
    ],
  },
  {
    title: "Operación diaria",
    links: [
      {
        label: "Clientes",
        href: "/superadmin",
        hint: "Alta, plan, estado y QR",
      },
      {
        label: "Nuevo cliente",
        href: "#nuevo-cliente",
        hint: "Formulario de alta",
      },
      {
        label: "Panel dueño",
        href: "/admin/dashboard",
        hint: "Vista real con RLS",
      },
      {
        label: "Configurar QR",
        href: "/admin/experience",
        hint: "Experiencia del cliente",
      },
      {
        label: "Login",
        href: "/admin/login",
        hint: "Acceso dueño/superadmin",
      },
      {
        label: "Cuenta y contraseña",
        href: "/admin/account",
        hint: "Seguridad, sesiones y recuperación",
      },
    ],
  },
  {
    title: "Sistema",
    links: [
      {
        label: "Cron semanal",
        href: "/api/cron/weekly-summaries",
        hint: "Endpoint protegido",
      },
      {
        label: "QR API",
        href: "/api/qr?slug=demo-restaurante",
        hint: "Render PNG demo",
      },
      {
        label: "Landing IAPacks",
        href: "https://iapacks.com/positivia/",
        hint: "Página comercial",
        external: true,
      },
      {
        label: "Vercel",
        href: "https://vercel.com/jsantospro/positivia",
        hint: "Proyecto deployment",
        external: true,
      },
    ],
  },
];

export default async function SuperadminPage() {
  const su = await getSuperadmin();

  // Gate: solo el superadmin (email = SUPERADMIN_EMAIL). No se filtra ninguna
  // pista de esta ruta al público.
  if (!su) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-950 p-6">
        <div className="text-center">
          <p className="text-2xl font-semibold text-white">Acceso restringido</p>
          <p className="mt-2 text-neutral-400">
            Esta área es solo para administración.
          </p>
          <Link href="/admin/login" className="mt-4 inline-block text-green-400 underline">
            Iniciar sesión
          </Link>
        </div>
      </main>
    );
  }

  // Operaciones globales con service role (bypassa RLS).
  const { data: businesses } = await supabaseAdmin()
    .from("businesses")
    .select("id, name, slug, plan, plan_status, parent_business_id, created_at")
    .order("created_at", { ascending: false });

  const list = businesses ?? [];
  const parents = list
    .filter((b) => !b.parent_business_id)
    .map((b) => ({ id: b.id, name: b.name }));
  const nameById = new Map(list.map((b) => [b.id, b.name]));
  const activeCount = list.filter((b) => b.plan_status === "active").length;
  const trialCount = list.filter((b) => b.plan_status === "trial").length;
  const cancelledCount = list.filter((b) => b.plan_status === "cancelled").length;

  return (
    <div className="min-h-screen bg-[#F6F7F3]">
      <header className="border-b border-[#203126]/10 bg-[#203126]">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <span className="flex items-center gap-2 text-lg font-bold text-white">
            <Image
              src="/brand/positivia-app-icon.png"
              alt="PositivIA"
              width={96}
              height={96}
              className="h-9 w-9 rounded-xl object-cover"
            />
            <span>Positiv<span className="text-green-400">IA</span></span>{" "}
            <span className="text-xs font-normal text-neutral-400">superadmin</span>
          </span>
          <LogoutButton />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <section className="mb-6 overflow-hidden rounded-2xl border border-[#203126]/10 bg-white shadow-sm">
          <div className="bg-gradient-to-br from-[#FFBE4D] via-[#FF7D66] to-[#24A66D] p-6 text-white">
            <Image
              src="/brand/positivia-logo-dark.png"
              alt="PositivIA"
              width={612}
              height={292}
              className="mb-5 h-auto w-full max-w-sm rounded-2xl shadow-[0_18px_50px_rgba(0,0,0,0.2)]"
            />
            <p className="text-xs font-black uppercase tracking-[0.18em] text-white/75">
              Cabina general
            </p>
            <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="text-3xl font-black leading-tight">
                  Crea, abre y controla cualquier cliente desde aquí
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-white/90">
                  Esta es tu mesa de mando: demo, altas, QR, panel del dueño,
                  quejas y ficha técnica en una sola pantalla.
                </p>
              </div>
              <a
                href="https://positivia.vercel.app/"
                target="_blank"
                rel="noreferrer"
                className="rounded-lg bg-white px-4 py-2 text-sm font-black text-[#203126] shadow-sm"
              >
                Abrir producción
              </a>
            </div>
          </div>
          <div className="grid gap-px bg-[#203126]/10 sm:grid-cols-4">
            <div className="bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-neutral-400">
                Total clientes
              </p>
              <p className="mt-1 text-3xl font-black text-neutral-950">{list.length}</p>
            </div>
            <div className="bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-neutral-400">
                Activos
              </p>
              <p className="mt-1 text-3xl font-black text-green-700">{activeCount}</p>
            </div>
            <div className="bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-neutral-400">
                Prueba
              </p>
              <p className="mt-1 text-3xl font-black text-amber-600">{trialCount}</p>
            </div>
            <div className="bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-neutral-400">
                Cancelados
              </p>
              <p className="mt-1 text-3xl font-black text-neutral-500">{cancelledCount}</p>
            </div>
          </div>
        </section>

        <section className="mb-8 rounded-2xl border border-[#203126]/10 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-green-700">
                Entradas rápidas
              </p>
              <h2 className="mt-1 text-xl font-black text-neutral-950">Demo, operación y sistema</h2>
              <p className="mt-1 max-w-2xl text-sm text-neutral-500">
                Para enseñar PositivIA y comprobar cada pieza sin buscar URLs.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {accessGroups.map((group) => (
              <div key={group.title} className="rounded-xl border border-neutral-200 p-4">
                <h3 className="text-sm font-black text-neutral-900">{group.title}</h3>
                <div className="mt-3 space-y-2">
                  {group.links.map((link) => {
                    const className =
                      "block rounded-lg border border-neutral-200 px-3 py-2 transition-colors hover:border-green-300 hover:bg-green-50";
                    const content = (
                      <>
                        <span className="block text-sm font-medium text-neutral-900">
                          {link.label}
                        </span>
                        <span className="block text-xs text-neutral-500">{link.hint}</span>
                      </>
                    );

                    return link.external ? (
                      <a
                        key={link.label}
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                        className={className}
                      >
                        {content}
                      </a>
                    ) : (
                      <Link key={link.label} href={link.href} className={className}>
                        {content}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-green-700">
              Clientes
            </p>
            <h2 className="mt-1 text-2xl font-black text-neutral-950">
              Paneles de cada comercio
            </h2>
            <p className="text-sm text-neutral-500">
              Desde cada fila puedes entrar a lo que vería el dueño o tocar la ficha interna.
            </p>
          </div>
          <Link
            href="#nuevo-cliente"
            className="rounded-lg bg-[#203126] px-4 py-2 text-sm font-black text-white"
          >
            Crear cliente
          </Link>
        </div>

        <div id="nuevo-cliente" className="mb-8 scroll-mt-6">
          <NewClientForm parents={parents} />
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#203126]/10 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-neutral-500">
              <tr>
                <th className="px-4 py-3 font-medium">Negocio</th>
                <th className="px-4 py-3 font-medium">Plan / Estado</th>
                <th className="px-4 py-3 font-medium">Entradas</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {list.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-neutral-400">
                    Aún no hay clientes. Crea el primero arriba.
                  </td>
                </tr>
              ) : (
                list.map((b) => (
                  <tr key={b.id}>
                    <td className="px-4 py-3">
                      <Link
                        href={`/superadmin/clients/${b.slug}`}
                        className="font-medium text-neutral-900 hover:underline"
                      >
                        {b.name}
                      </Link>
                      <div className="text-xs text-neutral-400">
                        /r/{b.slug}
                        {b.parent_business_id && (
                          <span className="ml-2 rounded bg-neutral-100 px-1.5 py-0.5">
                            local de {nameById.get(b.parent_business_id) ?? "—"}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyle[b.plan_status]}`}
                        >
                          {b.plan_status}
                        </span>
                        <ClientStatusControls
                          id={b.id}
                          plan={b.plan}
                          planStatus={b.plan_status}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/superadmin/clients/${b.slug}`}
                          className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-bold text-neutral-800 hover:border-green-300 hover:bg-green-50"
                        >
                          Ficha
                        </Link>
                        <Link
                          href={`/admin/experience?b=${b.id}`}
                          className="rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-bold text-green-800 hover:bg-green-100"
                        >
                          Configurar QR
                        </Link>
                        <Link
                          href={`/admin/dashboard?b=${b.id}`}
                          className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-bold text-neutral-800 hover:border-green-300 hover:bg-green-50"
                        >
                          Quejas
                        </Link>
                        <Link
                          href={`/r/${b.slug}`}
                          target="_blank"
                          className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-bold text-neutral-800 hover:border-amber-300 hover:bg-amber-50"
                        >
                          QR público
                        </Link>
                        <Link
                          href={`/api/qr?slug=${b.slug}&download=1`}
                          className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-bold text-neutral-800 hover:border-amber-300 hover:bg-amber-50"
                        >
                          Descargar QR
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
