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
      <p className="mt-8 text-lg font-medium text-neutral-700">
        ¡Gracias por tu valoración! 🎉
      </p>
    );
  }

  if (redirecting) {
    return (
      <p className="mt-8 animate-pulse text-lg font-medium text-neutral-700">
        Redirigiendo a Google…
      </p>
    );
  }

  if (rating !== null && rating <= 3) {
    return <ComplaintForm slug={slug} rating={rating} />;
  }

  return (
    <div className="mt-8">
      <div className="flex justify-center gap-2">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => handleSelect(value)}
            aria-label={`${value} estrellas`}
            className="flex h-14 w-14 items-center justify-center rounded-xl text-4xl transition-transform active:scale-90"
          >
            <span className="text-neutral-300 hover:text-yellow-400">★</span>
          </button>
        ))}
      </div>
      <div className="mt-1 flex justify-between px-2 text-xs text-neutral-400">
        <span>Mal</span>
        <span>Excelente</span>
      </div>
      {error && (
        <p className="mt-4 text-sm text-red-500">
          No se pudo enviar. Inténtalo de nuevo.
        </p>
      )}
    </div>
  );
}
