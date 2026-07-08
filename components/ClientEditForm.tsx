"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Client = {
  id: string;
  name: string;
  slug: string;
  plan: "starter" | "pro";
  plan_status: "trial" | "active" | "cancelled";
  color_primary: string | null;
  google_review_link: string | null;
  whatsapp_owner: string | null;
  email_owner: string | null;
};

export default function ClientEditForm({ client }: { client: Client }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    setError(null);

    const form = new FormData(e.currentTarget);
    const payload = {
      id: client.id,
      name: String(form.get("name") ?? ""),
      slug: String(form.get("slug") ?? ""),
      color_primary: String(form.get("color_primary") ?? ""),
      google_review_link: String(form.get("google_review_link") ?? ""),
      whatsapp_owner: String(form.get("whatsapp_owner") ?? ""),
      email_owner: String(form.get("email_owner") ?? ""),
      plan: String(form.get("plan") ?? ""),
      plan_status: String(form.get("plan_status") ?? ""),
    };

    try {
      const res = await fetch("/api/superadmin/clients", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo guardar");
      setMessage("Cambios guardados");
      if (payload.slug && payload.slug !== client.slug) {
        router.push(`/superadmin/clients/${payload.slug}`);
      } else {
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setBusy(false);
    }
  }

  const input =
    "mt-1 w-full rounded-lg border border-neutral-300 bg-white p-2.5 text-sm text-neutral-900 focus:border-green-500 focus:outline-none";

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">Editar cliente</h2>
          <p className="text-sm text-neutral-500">
            Cambia teléfono, email, slug, estado y enlace de reseñas desde aquí.
          </p>
        </div>
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-neutral-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {busy ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="text-sm text-neutral-600">
          Nombre
          <input name="name" required defaultValue={client.name} className={input} />
        </label>
        <label className="text-sm text-neutral-600">
          Slug
          <input
            name="slug"
            required
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            defaultValue={client.slug}
            className={input}
          />
        </label>
        <label className="text-sm text-neutral-600">
          WhatsApp del dueño
          <input
            name="whatsapp_owner"
            defaultValue={client.whatsapp_owner ?? ""}
            placeholder="+34600000000"
            className={input}
          />
        </label>
        <label className="text-sm text-neutral-600">
          Email del dueño
          <input
            name="email_owner"
            type="email"
            defaultValue={client.email_owner ?? ""}
            className={input}
          />
        </label>
        <label className="text-sm text-neutral-600 sm:col-span-2">
          Link de reseña de Google
          <input
            name="google_review_link"
            type="url"
            defaultValue={client.google_review_link ?? ""}
            placeholder="https://g.page/r/..."
            className={input}
          />
        </label>
        <label className="text-sm text-neutral-600">
          Color de marca
          <input
            name="color_primary"
            type="color"
            defaultValue={client.color_primary ?? "#16a34a"}
            className="mt-1 h-10 w-full rounded-lg border border-neutral-300"
          />
        </label>
        <label className="text-sm text-neutral-600">
          Plan
          <select name="plan" defaultValue={client.plan} className={input}>
            <option value="starter">Starter</option>
            <option value="pro">Pro</option>
          </select>
        </label>
        <label className="text-sm text-neutral-600">
          Estado
          <select name="plan_status" defaultValue={client.plan_status} className={input}>
            <option value="trial">Prueba</option>
            <option value="active">Activo</option>
            <option value="cancelled">Cancelado</option>
          </select>
        </label>
      </div>

      {message && <p className="mt-4 text-sm font-medium text-green-700">{message}</p>}
      {error && <p className="mt-4 text-sm font-medium text-red-600">{error}</p>}
    </form>
  );
}
