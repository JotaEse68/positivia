"use client";

import { useState } from "react";
import Link from "next/link";
import { useSignIn } from "@clerk/nextjs";

type Step = "email" | "code" | "done";

function errorMessage(err: unknown) {
  const clerkError = err as { errors?: { longMessage?: string; message?: string }[] };
  return (
    clerkError.errors?.[0]?.longMessage ??
    clerkError.errors?.[0]?.message ??
    "No se pudo completar la operación."
  );
}

export default function PasswordResetForm() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function requestCode(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isLoaded || !signIn) return;
    setBusy(true);
    setError(null);
    try {
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: email.trim(),
      });
      setStep("code");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function resetPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isLoaded || !signIn) return;
    setBusy(true);
    setError(null);
    try {
      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code: code.trim(),
        password,
      });

      if (result.status === "complete" && result.createdSessionId) {
        await setActive({ session: result.createdSessionId });
        setStep("done");
        return;
      }

      if (result.status === "needs_second_factor") {
        setError("Tu cuenta pide un segundo factor. Completa el acceso desde /admin/login.");
        return;
      }

      setError("No se pudo completar el cambio. Revisa el código e inténtalo de nuevo.");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const input =
    "mt-1 w-full rounded-lg border border-neutral-300 bg-white p-2.5 text-sm text-neutral-900 focus:border-green-500 focus:outline-none";

  if (step === "done") {
    return (
      <div className="rounded-2xl border bg-white p-6">
        <h2 className="text-lg font-semibold text-neutral-900">Contraseña cambiada</h2>
        <p className="mt-2 text-sm text-neutral-500">
          Ya puedes volver al panel con tu sesión actual.
        </p>
        <Link
          href="/superadmin"
          className="mt-5 inline-block rounded-lg bg-neutral-950 px-4 py-2 text-sm font-semibold text-white"
        >
          Ir al superadmin
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-white p-6">
      <h2 className="text-lg font-semibold text-neutral-900">
        Cambiar contraseña por email
      </h2>
      <p className="mt-1 text-sm text-neutral-500">
        Usa este flujo si no recuerdas la contraseña actual. Recibirás un código
        en el correo de acceso.
      </p>

      {step === "email" ? (
        <form onSubmit={requestCode} className="mt-5 space-y-4">
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
            disabled={busy || !isLoaded}
            className="w-full rounded-lg bg-neutral-950 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busy ? "Enviando código..." : "Enviar código"}
          </button>
        </form>
      ) : (
        <form onSubmit={resetPassword} className="mt-5 space-y-4">
          <label className="block text-sm text-neutral-600">
            Código recibido por email
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              inputMode="numeric"
              autoComplete="one-time-code"
              className={input}
            />
          </label>
          <label className="block text-sm text-neutral-600">
            Nueva contraseña
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              type="password"
              autoComplete="new-password"
              minLength={8}
              className={input}
            />
          </label>
          <button
            type="submit"
            disabled={busy || !isLoaded}
            className="w-full rounded-lg bg-neutral-950 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busy ? "Cambiando..." : "Cambiar contraseña"}
          </button>
          <button
            type="button"
            onClick={() => setStep("email")}
            className="w-full rounded-lg border px-4 py-2.5 text-sm font-medium text-neutral-700"
          >
            Usar otro email
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
