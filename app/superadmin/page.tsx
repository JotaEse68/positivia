import Link from "next/link";
import { getSuperadmin } from "@/lib/superadmin";
import { supabaseAdmin } from "@/lib/supabase";
import NewClientForm from "@/components/NewClientForm";
import ClientStatusControls from "@/components/ClientStatusControls";

export const dynamic = "force-dynamic";

const statusStyle: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  trial: "bg-amber-100 text-amber-700",
  cancelled: "bg-neutral-200 text-neutral-500",
};

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

  return (
    <div className="min-h-screen bg-neutral-100">
      <header className="border-b bg-neutral-950">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <span className="text-lg font-bold text-white">
            Positiv<span className="text-green-400">IA</span>{" "}
            <span className="text-xs font-normal text-neutral-400">superadmin</span>
          </span>
          <form action="/admin/auth/signout" method="post">
            <button className="rounded-lg border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300">
              Salir
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Clientes</h1>
            <p className="text-sm text-neutral-500">{list.length} negocios dados de alta</p>
          </div>
        </div>

        <div className="mb-8">
          <NewClientForm parents={parents} />
        </div>

        <div className="overflow-hidden rounded-2xl border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-neutral-500">
              <tr>
                <th className="px-4 py-3 font-medium">Negocio</th>
                <th className="px-4 py-3 font-medium">Plan / Estado</th>
                <th className="px-4 py-3 font-medium">QR</th>
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
                      <Link
                        href={`/superadmin/clients/${b.slug}`}
                        className="text-green-600 hover:underline"
                      >
                        Ver QR
                      </Link>
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
