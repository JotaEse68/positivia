"use client";

import { useState } from "react";
import ComplaintForm from "@/components/ComplaintForm";
import type { RatingCopy } from "@/lib/rating-copy";

type Props = {
  slug: string;
  googleReviewLink: string | null;
  copy: RatingCopy;
};

// Bifurcación core del producto:
//   4-5★ → se registra el feedback y se redirige a la reseña de Google.
//   1-3★ → formulario privado; nunca llega a ser público.
export default function RatingStars({ slug, googleReviewLink, copy }: Props) {
  const [rating, setRating] = useState<number | null>(null);
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState(false);

  function playDing(value: number) {
    try {
      const AudioContext =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof window.AudioContext })
          .webkitAudioContext;
      if (!AudioContext) return;

      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = value >= 4 ? 880 : 520;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.045, ctx.currentTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch {
      // El sonido es un detalle agradable; si el navegador lo bloquea, seguimos.
    }
  }

  async function handleSelect(value: number) {
    if (rating !== null) return;
    setError(false);
    playDing(value);

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
      <div className="mt-6 rounded-3xl bg-[#EAF9EF] p-5 text-center">
        <div className="pv-sparkle mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-white text-2xl shadow-sm">
          ✨
        </div>
        <p className="text-lg font-black text-[#1F7A4E]">
          {copy.positive_redirect_title}
        </p>
        <p className="mt-1 text-sm text-[#337257]">
          {copy.positive_redirect_body}
        </p>
      </div>
    );
  }

  if (redirecting) {
    return (
      <div className="mt-6 rounded-3xl bg-[#EAF9EF] p-5 text-center">
        <div className="pv-sparkle mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-white text-2xl shadow-sm">
          ✨
        </div>
        <p className="animate-pulse text-lg font-black text-[#1F7A4E]">
          {copy.positive_redirect_title}
        </p>
        <p className="mt-1 text-sm text-[#337257]">
          {copy.positive_redirect_body}
        </p>
      </div>
    );
  }

  if (rating !== null && rating <= 3) {
    return (
      <ComplaintForm
        slug={slug}
        rating={rating}
        googleReviewLink={googleReviewLink}
        copy={copy}
      />
    );
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
            className="group flex aspect-square items-center justify-center rounded-3xl border border-[#FFE1A6] bg-white text-4xl shadow-sm shadow-[#C76A37]/5 transition-all hover:-translate-y-1 hover:border-[#FFC447] hover:bg-[#FFF6D8] active:scale-95"
          >
            <span className="text-[#D7D0C5] transition-colors group-hover:text-[#FFC447]">
              ★
            </span>
          </button>
        ))}
      </div>
      <div className="mt-3 flex justify-between px-1 text-xs font-bold text-[#8A6B3E]">
        <span>Algo falló</span>
        <span>Me encantó</span>
      </div>
      {error && (
        <p className="mt-4 rounded-2xl bg-[#FFF0ED] p-3 text-sm font-bold text-[#C04C3F]">
          No hemos podido enviarlo. Prueba otra vez en un momento.
        </p>
      )}
    </div>
  );
}
