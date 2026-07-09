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
      <div className="mt-6 rounded-3xl bg-[#EAF9EF] p-5 text-center">
        <div className="pv-sparkle mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-white text-2xl shadow-sm">
          ✨
        </div>
        <p className="text-lg font-black text-[#1F7A4E]">
          Gracias, de verdad
        </p>
        <p className="mt-2 text-sm leading-6 text-[#337257]">
          Esto no se publica. Llega directo al negocio para que pueda cuidarlo
          mejor.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 text-left">
      <h2 className="text-center text-xl font-black text-[#322A20]">
        Cuéntanos qué podemos mejorar
      </h2>
      <p className="mt-2 text-center text-sm leading-6 text-[#6D5B49]">
        Tu mensaje es <strong>privado</strong>. No se publica en Google ni en
        ningún sitio.
      </p>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={4}
        autoFocus
        placeholder="Ejemplo: tardó mucho, faltó algo, no me sentí bien atendido..."
        className="mt-4 w-full rounded-3xl border border-[#FFD6B8] bg-[#FFF8E7] p-4 text-base text-[#322A20] placeholder:text-[#B59C7A] focus:border-[#FF9B6A] focus:bg-white focus:outline-none"
      />
      <button
        type="submit"
        disabled={status === "sending"}
        className="mt-4 w-full rounded-3xl bg-[#24A66D] py-3 text-lg font-black text-white shadow-lg shadow-[#24A66D]/20 transition-transform active:scale-[0.99] disabled:opacity-60"
      >
        {status === "sending" ? "Enviando..." : "Enviar en privado"}
      </button>
      {status === "error" && (
        <p className="mt-3 rounded-2xl bg-[#FFF0ED] p-3 text-center text-sm font-bold text-[#C04C3F]">
          No hemos podido enviarlo. Prueba otra vez en un momento.
        </p>
      )}
    </form>
  );
}
