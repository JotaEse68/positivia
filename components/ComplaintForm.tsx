"use client";

import { useState } from "react";

type Props = { slug: string; rating: number };

// Formulario privado para ratings 1-3. El mensaje deja claro al
// cliente que esto NO es una reseña pública: va directo al dueño.
export default function ComplaintForm({ slug, rating }: Props) {
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, rating, comment: comment.trim() || null }),
      });
      if (!res.ok) throw new Error();
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="mt-6 rounded-2xl bg-green-50 p-4 text-center">
        <p className="text-lg font-semibold text-green-800">
          Gracias por contárnoslo
        </p>
        <p className="mt-2 text-sm text-green-700">
          El responsable del negocio lo leerá directamente y tomará medidas.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 text-left">
      <h2 className="text-center text-xl font-semibold text-neutral-900">
        Cuéntanos qué pasó
      </h2>
      <p className="mt-2 text-center text-sm text-neutral-500">
        Este mensaje es <strong>privado</strong>: no se publica en ningún
        sitio. El dueño del negocio lo leerá directamente.
      </p>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={4}
        autoFocus
        placeholder="Escribe aquí lo que no ha ido bien…"
        className="mt-4 w-full rounded-2xl border border-neutral-300 bg-neutral-50 p-4 text-base text-neutral-900 focus:border-[var(--brand)] focus:bg-white focus:outline-none"
      />
      <button
        type="submit"
        disabled={status === "sending"}
        className="mt-4 w-full rounded-2xl py-3 text-lg font-semibold text-white shadow-lg shadow-neutral-900/10 transition-opacity disabled:opacity-60"
        style={{ backgroundColor: "var(--brand)" }}
      >
        {status === "sending" ? "Enviando…" : "Enviar"}
      </button>
      {status === "error" && (
        <p className="mt-3 rounded-xl bg-red-50 p-3 text-center text-sm font-medium text-red-600">
          No se pudo enviar. Inténtalo de nuevo.
        </p>
      )}
    </form>
  );
}
