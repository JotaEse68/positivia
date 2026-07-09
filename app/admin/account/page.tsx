import Link from "next/link";
import PasswordResetForm from "@/components/PasswordResetForm";
import { createServerSupabase } from "@/lib/supabase-server";

export default async function AccountPage() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const email = user?.email ?? "";

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-green-700">
          Cuenta
        </p>
        <h1 className="mt-1 text-2xl font-bold text-neutral-900">
          Acceso y contraseña
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-neutral-500">
          Supabase gestiona el login. El WhatsApp del negocio se cambia en la
          ficha del cliente, no en el teléfono de la cuenta.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <PasswordResetForm />

        <aside className="space-y-5">
          <section className="rounded-2xl border bg-white p-6">
            <h2 className="text-lg font-semibold text-neutral-900">Tu sesión</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-neutral-400">Email</dt>
                <dd className="font-medium text-neutral-900">{email || "Sin email"}</dd>
              </div>
              <div>
                <dt className="text-neutral-400">ID usuario</dt>
                <dd className="break-all font-mono text-xs text-neutral-700">
                  {user?.id ?? "Sin sesión"}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border bg-amber-50 p-6">
            <h2 className="text-lg font-semibold text-amber-950">
              El móvil no va aquí
            </h2>
            <p className="mt-2 text-sm text-amber-900">
              Si quieres cambiar el número donde llegan las alertas, entra en
              Superadmin, abre el cliente y edita el WhatsApp del dueño.
            </p>
            <Link
              href="/superadmin"
              className="mt-4 inline-block rounded-lg bg-amber-900 px-4 py-2 text-sm font-semibold text-white"
            >
              Ir a clientes
            </Link>
          </section>
        </aside>
      </div>
    </main>
  );
}
