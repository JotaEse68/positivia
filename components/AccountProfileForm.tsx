"use client";

import { useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase-browser";

export default function AccountProfileForm({
  initialName,
  email,
}: {
  initialName: string;
  email: string;
}) {
  const [name, setName] = useState(initialName);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function saveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    setError(null);

    const supabase = createBrowserSupabase();
    const { error } = await supabase.auth.updateUser({
      data: { full_name: name.trim() },
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage("Perfil guardado");
    }
    setBusy(false);
  }

  return (
    <form onSubmit={saveProfile} className="rounded-2xl border bg-white p-6 shadow-sm">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-green-700">
          Perfil
        </p>
        <h2 className="mt-1 text-lg font-semibold text-neutral-900">
          Datos de acceso
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          Esto identifica al usuario dentro del panel. Los datos del comercio se
          gestionan en la ficha del negocio.
        </p>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium text-neutral-600">
          Nombre visible
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre o responsable"
            className="mt-1 w-full rounded-lg border border-neutral-300 bg-white p-2.5 text-sm text-neutral-900 focus:border-green-500 focus:outline-none"
          />
        </label>
        <label className="text-sm font-medium text-neutral-600">
          Email de acceso
          <input
            value={email}
            readOnly
            className="mt-1 w-full rounded-lg border border-neutral-200 bg-neutral-50 p-2.5 text-sm text-neutral-500"
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={busy}
        className="mt-5 rounded-lg bg-neutral-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {busy ? "Guardando..." : "Guardar perfil"}
      </button>

      {message && <p className="mt-3 text-sm font-medium text-green-700">{message}</p>}
      {error && <p className="mt-3 text-sm font-medium text-red-600">{error}</p>}
    </form>
  );
}
