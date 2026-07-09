"use client";

import Link from "next/link";
import { useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase-browser";

type Mode = "request" | "sent" | "update" | "done";

function errorMessage(err: unknown) {
  if (err instanceof Error) return err.message;
  return "No se pudo completar la operación.";
}

export default function PasswordResetForm({
  initialMode = "request",
}: {
  initialMode?: "request" | "update";
}) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function requestReset(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const supabase = createBrowserSupabase();
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/callback?next=/admin/reset-password?mode=update`,
      });
      if (error) throw error;
      setMode("sent");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function updatePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const supabase = createBrowserSupabase();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setMode("done");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const input =
    "mt-1 w-full rounded-lg border border-neutral-300 bg-white p-2.5 text-sm text-neutral-900 focus:border-green-500 focus:outline-none";

  if (mode === "sent") {
    return (
      <div className="rounded-2xl border bg-white p-6">
        <h2 className="text-lg font-semibold text-neutral-900">Email enviado</h2>
        <p className="mt-2 text-sm text-neutral-500">
          Abre el enlace de recuperación que te hemos enviado. Te devolverá a
          PositivIA para poner una contraseña nueva.
        </p>
      </div>
    );
  }

  if (mode === "done") {
    return (
      <div className="rounded-2xl border bg-white p-6">
        <h2 className="text-lg font-semibold text-neutral-900">Contraseña cambiada</h2>
        <p className="mt-2 text-sm text-neutral-500">
          Ya puedes entrar con tu nueva contraseña.
        </p>
        <Link
          href="/admin/dashboard"
          className="mt-5 inline-block rounded-lg bg-neutral-950 px-4 py-2 text-sm font-semibold text-white"
        >
          Ir al panel
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-white p-6">
      <h2 className="text-lg font-semibold text-neutral-900">
        {mode === "update" ? "Nueva contraseña" : "Recuperar contraseña"}
      </h2>
      <p className="mt-1 text-sm text-neutral-500">
        {mode === "update"
          ? "Escribe la contraseña nueva para tu cuenta."
          : "Te enviaremos un enlace seguro al email de acceso."}
      </p>

      {mode === "update" ? (
        <form onSubmit={updatePassword} className="mt-5 space-y-4">
          <label className="block text-sm text-neutral-600">
            Nueva contraseña
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              type="password"
              minLength={8}
              autoComplete="new-password"
              className={input}
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-neutral-950 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busy ? "Guardando..." : "Cambiar contraseña"}
          </button>
        </form>
      ) : (
        <form onSubmit={requestReset} className="mt-5 space-y-4">
          <label className="block text-sm text-neutral-600">
            Email de acceso
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              type="email"
              autoComplete="email"
              className={input}
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-neutral-950 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busy ? "Enviando..." : "Enviar enlace"}
          </button>
        </form>
      )}

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
