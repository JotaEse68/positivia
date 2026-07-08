"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Parent = { id: string; name: string };

export default function NewClientForm({ parents }: { parents: Parent[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ slug: string } | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/superadmin/clients", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      setCreated({ slug: data.slug });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  if (created) {
    return (
      <div className="rounded-2xl border bg-white p-6 text-center">
        <p className="text-lg font-semibold text-neutral-900">
          Cliente creado ✓
        </p>
        <p className="mt-1 text-sm text-neutral-500">
          El QR ya está disponible en la ficha del cliente.
        </p>
        <div className="mt-4 flex justify-center gap-2">
          <a
            href={`/superadmin/clients/${created.slug}`}
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
          >
            Ver ficha y QR
          </a>
          <button
            onClick={() => setCreated(null)}
            className="rounded-lg border px-4 py-2 text-sm text-neutral-700"
          >
            Crear otro
          </button>
        </div>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-xl bg-green-500 px-5 py-3 font-semibold text-white hover:bg-green-600"
      >
        + Nuevo cliente
      </button>
    );
  }

  const input =
    "mt-1 w-full rounded-lg border border-neutral-300 p-2.5 text-sm focus:border-green-500 focus:outline-none";

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border bg-white p-6">
      <h2 className="text-lg font-semibold text-neutral-900">Nuevo cliente</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm text-neutral-600">Nombre del negocio *</label>
          <input name="name" required className={input} placeholder="Bar Pepe" />
        </div>
        <div>
          <label className="text-sm text-neutral-600">Slug (URL) *</label>
          <input
            name="slug"
            required
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            className={input}
            placeholder="bar-pepe"
          />
        </div>
        <div>
          <label className="text-sm text-neutral-600">Color de marca</label>
          <input name="color_primary" type="color" defaultValue="#16a34a" className="mt-1 h-10 w-full rounded-lg border" />
        </div>
        <div>
          <label className="text-sm text-neutral-600">Logo (opcional)</label>
          <input name="logo" type="file" accept="image/*" className="mt-1 w-full text-sm" />
        </div>
        <div className="sm:col-span-2">
          <label className="text-sm text-neutral-600">Link de reseña de Google</label>
          <input name="google_review_link" type="url" className={input} placeholder="https://g.page/r/..." />
        </div>
        <div>
          <label className="text-sm text-neutral-600">WhatsApp del dueño</label>
          <input name="whatsapp_owner" className={input} placeholder="+34600000000" />
        </div>
        <div>
          <label className="text-sm text-neutral-600">Email del dueño</label>
          <input name="email_owner" type="email" className={input} placeholder="dueño@negocio.com" />
        </div>
        <div>
          <label className="text-sm text-neutral-600">Plan</label>
          <select name="plan" className={input} defaultValue="starter">
            <option value="starter">Starter (29€)</option>
            <option value="pro">Pro (49€)</option>
          </select>
        </div>
        <div>
          <label className="text-sm text-neutral-600">Local de (opcional)</label>
          <select name="parent_business_id" className={input} defaultValue="">
            <option value="">— Negocio independiente —</option>
            {parents.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

      <div className="mt-5 flex gap-2">
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-green-500 px-4 py-2 font-medium text-white hover:bg-green-600 disabled:opacity-60"
        >
          {busy ? "Creando…" : "Crear cliente"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg border px-4 py-2 text-neutral-700"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
