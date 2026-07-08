"use client";

import { useState } from "react";
import ComplaintForm from "@/components/ComplaintForm";

type Props = { slug: string };

// Bifurcación core del producto:
//   4-5★ → se registra el feedback y se redirige a la reseña de Google.
//   1-3★ → formulario privado; nunca llega a ser público.
export default function RatingStars({ slug }: Props) {
  const [rating, setRating] = useState<number | null>(null);
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState(false);

  async function handleSelect(value: number) {
    if (rating !== null) return;
    setError(false);

    if (value >= 4) {
      setRating(value);
      setRedirecting(true);
      try {
        const res = await fetch("/api/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug, rating: value }),
        });
        const data = await res.json();
        if (res.ok && data.redirectUrl) {
          window.location.assign(data.redirectUrl);
          return;
        }
        // Sin link de Google configurado: agradecer y terminar.
        setRedirecting(false);
      } catch {
        setRedirecting(false);
        setRating(null);
        setError(true);
      }
    } else {
      // El feedback negativo se inserta al enviar el formulario,
      // no al tocar la estrella.
      setRating(value);
    }
  }

  if (rating !== null && rating >= 4 && !redirecting) {
    return (
      <div className="mt-6 rounded-2xl bg-green-50 p-4 text-center">
        <p className="text-lg font-semibold text-green-800">
          Gracias por tu valoración
        </p>
        <p className="mt-1 text-sm text-green-700">
          Tu opinión ayuda mucho al negocio.
        </p>
      </div>
    );
  }

  if (redirecting) {
    return (
      <div className="mt-6 rounded-2xl bg-green-50 p-4 text-center">
        <p className="animate-pulse text-lg font-semibold text-green-800">
          Abriendo la reseña...
        </p>
        <p className="mt-1 text-sm text-green-700">
          Te llevamos al siguiente paso.
        </p>
      </div>
    );
  }

  if (rating !== null && rating <= 3) {
    return <ComplaintForm slug={slug} rating={rating} />;
  }

  return (
    <div className="mt-5">
      <div className="grid grid-cols-5 gap-2">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => handleSelect(value)}
            aria-label={`${value} estrellas`}
            className="group flex aspect-square items-center justify-center rounded-2xl border border-neutral-200 bg-white text-4xl shadow-sm transition-all hover:-translate-y-0.5 hover:border-amber-300 hover:bg-amber-50 active:scale-95"
          >
            <span className="text-neutral-300 transition-colors group-hover:text-amber-400">
              ★
            </span>
          </button>
        ))}
      </div>
      <div className="mt-3 flex justify-between px-1 text-xs font-medium text-neutral-500">
        <span>No fue bien</span>
        <span>Excelente</span>
      </div>
      {error && (
        <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-600">
          No se pudo enviar. Inténtalo de nuevo.
        </p>
      )}
    </div>
  );
}
