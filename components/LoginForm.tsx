"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase-browser";

function getErrorMessage(err: unknown) {
  if (err instanceof Error) return err.message;
  return "No se pudo iniciar sesión.";
}

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/admin/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState<null | "password" | "magic">(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loginWithPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy("password");
    setMessage(null);
    setError(null);

    const supabase = createBrowserSupabase();
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setError(error.message);
      setBusy(null);
      return;
    }

    router.push(redirect);
    router.refresh();
  }

  async function sendMagicLink() {
    setBusy("magic");
    setMessage(null);
    setError(null);

    try {
      const supabase = createBrowserSupabase();
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirect)}`,
        },
      });
      if (error) throw error;
      setMessage("Te hemos enviado un enlace de acceso al email.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  const input =
    "mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-900 p-3 text-white focus:border-green-400 focus:outline-none";

  return (
    <div className="rounded-2xl border border-white/10 bg-neutral-950 p-6 shadow-2xl shadow-black/30">
      <form onSubmit={loginWithPassword} className="space-y-4">
        <label className="block text-sm text-neutral-300">
          Email
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            type="email"
            autoComplete="email"
            className={input}
          />
        </label>
        <label className="block text-sm text-neutral-300">
          Contraseña
          <span className="relative mt-1 block">
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              className={`${input} pr-16`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-semibold text-neutral-400 hover:bg-neutral-800"
              aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
            >
              {showPassword ? "Ocultar" : "👁 Ver"}
            </button>
          </span>
        </label>
        <button
          type="submit"
          disabled={busy !== null}
          className="w-full rounded-lg bg-green-500 px-4 py-3 font-semibold text-neutral-950 disabled:opacity-60"
        >
          {busy === "password" ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <div className="mt-4 grid gap-2">
        <button
          type="button"
          onClick={sendMagicLink}
          disabled={busy !== null || !email.trim()}
          className="w-full rounded-lg border border-neutral-700 px-4 py-3 text-sm font-semibold text-neutral-200 hover:bg-neutral-900 disabled:opacity-50"
        >
          {busy === "magic" ? "Enviando..." : "Enviar enlace mágico"}
        </button>
        <Link
          href="/admin/reset-password"
          className="text-center text-sm text-green-400 underline"
        >
          Cambiar contraseña por email
        </Link>
      </div>

      {message && (
        <p className="mt-4 rounded-lg bg-green-500/10 p-3 text-sm text-green-300">
          {message}
        </p>
      )}
      {error && (
        <p className="mt-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
