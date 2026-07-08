"use client";

import { useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase-browser";

// Login sin contraseña: magic link por email (Supabase Auth).
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    const supabase = createBrowserSupabase();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/admin/auth/callback`,
      },
    });
    setStatus(error ? "error" : "sent");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-950 p-6">
      <div className="w-full max-w-sm">
        <h1 className="text-center text-3xl font-bold text-white">
          Positiv<span className="text-green-400">IA</span>
        </h1>
        <p className="mt-2 text-center text-neutral-400">Panel del negocio</p>

        {status === "sent" ? (
          <div className="mt-8 rounded-xl bg-neutral-900 p-6 text-center">
            <p className="text-lg font-medium text-white">Revisa tu email 📧</p>
            <p className="mt-2 text-sm text-neutral-400">
              Te hemos enviado un enlace de acceso a <strong>{email}</strong>.
              Ábrelo desde este mismo dispositivo.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8">
            <label className="block text-sm text-neutral-300">Tu email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="dueño@minegocio.com"
              className="mt-2 w-full rounded-xl border border-neutral-700 bg-neutral-900 p-3 text-white placeholder-neutral-500 focus:border-green-400 focus:outline-none"
            />
            <button
              type="submit"
              disabled={status === "sending"}
              className="mt-4 w-full rounded-xl bg-green-500 py-3 font-semibold text-neutral-950 transition-opacity disabled:opacity-60"
            >
              {status === "sending" ? "Enviando…" : "Enviar enlace de acceso"}
            </button>
            {status === "error" && (
              <p className="mt-3 text-center text-sm text-red-400">
                No se pudo enviar. Revisa el email e inténtalo de nuevo.
              </p>
            )}
          </form>
        )}
      </div>
    </main>
  );
}
