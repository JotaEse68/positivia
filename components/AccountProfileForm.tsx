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
    <form onSubmit={saveProfile} className="rounded-2xl border border-[#102D2A]/10 bg-white p-6 shadow-sm">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#27765B]">
          Perfil
        </p>
        <h2 className="mt-1 text-lg font-semibold text-[#102D2A]">
          Datos de acceso
        </h2>
        <p className="mt-1 text-sm text-[#53655E]">
          Esto identifica al usuario dentro del panel. Los datos del comercio se
          gestionan en la ficha del negocio.
        </p>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium text-[#53655E]">
          Nombre visible
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre o responsable"
            className="mt-1 w-full rounded-lg border border-[#102D2A]/20 bg-white p-2.5 text-sm text-[#102D2A] focus:border-[#27765B] focus:outline-none"
          />
        </label>
        <label className="text-sm font-medium text-[#53655E]">
          Email de acceso
          <input
            value={email}
            readOnly
            className="mt-1 w-full rounded-lg border border-[#102D2A]/10 bg-[#FFF9EA] p-2.5 text-sm text-[#53655E]"
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={busy}
        className="mt-5 rounded-lg bg-[#102D2A] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {busy ? "Guardando..." : "Guardar perfil"}
      </button>

      {message && <p className="mt-3 text-sm font-medium text-[#27765B]">{message}</p>}
      {error && <p className="mt-3 text-sm font-medium text-red-600">{error}</p>}
    </form>
  );
}
