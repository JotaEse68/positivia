"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialMode !== "update") return;

    async function recoverSession() {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      if (!code) return;

      setBusy(true);
      setError(null);
      try {
        const supabase = createBrowserSupabase();
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) throw error;
        window.history.replaceState(null, "", "/admin/reset-password?mode=update");
      } catch (err) {
        setError(errorMessage(err));
      } finally {
        setBusy(false);
      }
    }

    void recoverSession();
  }, [initialMode]);

  async function requestReset(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const supabase = createBrowserSupabase();
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/admin/reset-password?mode=update`,
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
    "mt-1 w-full rounded-lg border border-[#102D2A]/20 bg-white p-2.5 text-sm text-[#102D2A] focus:border-[#27765B] focus:outline-none";

  if (mode === "sent") {
    return (
      <div className="rounded-2xl border border-[#102D2A]/10 bg-white p-6">
        <h2 className="text-lg font-semibold text-[#102D2A]">Email enviado</h2>
        <p className="mt-2 text-sm text-[#53655E]">
          Abre el enlace de recuperación que te hemos enviado. Te devolverá a
          PositivIA para poner una contraseña nueva.
        </p>
      </div>
    );
  }

  if (mode === "done") {
    return (
      <div className="rounded-2xl border border-[#102D2A]/10 bg-white p-6">
        <h2 className="text-lg font-semibold text-[#102D2A]">Contraseña cambiada</h2>
        <p className="mt-2 text-sm text-[#53655E]">
          Ya puedes entrar con tu nueva contraseña.
        </p>
        <Link
          href="/admin/dashboard"
          className="mt-5 inline-block rounded-lg bg-[#102D2A] px-4 py-2 text-sm font-semibold text-white"
        >
          Ir al panel
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#102D2A]/10 bg-white p-6">
      <h2 className="text-lg font-semibold text-[#102D2A]">
        {mode === "update" ? "Nueva contraseña" : "Recuperar contraseña"}
      </h2>
      <p className="mt-1 text-sm text-[#53655E]">
        {mode === "update"
          ? "Escribe la contraseña nueva para tu cuenta."
          : "Te enviaremos un enlace seguro al email de acceso."}
      </p>

      {mode === "update" ? (
        <form onSubmit={updatePassword} className="mt-5 space-y-4">
          <label className="block text-sm text-[#53655E]">
            Nueva contraseña
            <span className="relative mt-1 block">
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                type={showPassword ? "text" : "password"}
                minLength={8}
                autoComplete="new-password"
                className={`${input} pr-14`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-semibold text-[#53655E] hover:bg-[#FFF9EA]"
                aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
              >
                {showPassword ? "Ocultar" : "👁 Ver"}
              </button>
            </span>
          </label>
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-[#102D2A] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busy ? "Guardando..." : "Cambiar contraseña"}
          </button>
        </form>
      ) : (
        <form onSubmit={requestReset} className="mt-5 space-y-4">
          <label className="block text-sm text-[#53655E]">
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
            className="w-full rounded-lg bg-[#102D2A] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
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
