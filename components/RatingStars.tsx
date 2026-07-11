"use client";

import { useState } from "react";
import ComplaintForm from "@/components/ComplaintForm";
import type { RatingCopy } from "@/lib/rating-copy";

type Props = {
  slug: string;
  googleReviewLink: string | null;
  copy: RatingCopy;
};

type Phase = "idle" | "reward" | "redirecting" | "thanks";

// Bifurcación core del producto:
//   4-5★ → se registra el feedback y se redirige a la reseña de Google
//     (o se muestra la recompensa antes, si el dueño la activó).
//   1-3★ → formulario privado; nunca llega a ser público.
export default function RatingStars({ slug, googleReviewLink, copy }: Props) {
  const [rating, setRating] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
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

  // No espera respuesta: el registro nunca debe retrasar la recompensa
  // ni el redirect a Google.
  function registerFeedback(value: number) {
    const payload = JSON.stringify({ slug, rating: value });
    if (typeof navigator.sendBeacon === "function") {
      navigator.sendBeacon("/api/feedback", payload);
      return;
    }
    fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => {});
  }

  async function handleSelect(value: number) {
    if (rating !== null) return;
    setError(false);
    playDing(value);
    setRating(value);

    if (value < 4) return;

    if (copy.reward_enabled) {
      setPhase("reward");
      registerFeedback(value);
      return;
    }

    if (googleReviewLink) {
      // Redirect optimista: no esperamos al servidor para llevar al
      // cliente a Google, el registro va en paralelo.
      setPhase("redirecting");
      registerFeedback(value);
      window.location.assign(googleReviewLink);
      return;
    }

    // Sin recompensa y sin link de Google configurado: solo agradecemos,
    // el registro no debe fallar la experiencia del cliente.
    setPhase("redirecting");
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, rating: value }),
      });
    } catch {
      // Silencioso: igualmente mostramos las gracias.
    }
    setPhase("thanks");
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

  if (phase === "reward") {
    return (
      <div className="mt-6 rounded-3xl bg-[#EAF9EF] p-5 text-center">
        <div className="pv-sparkle mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-white text-2xl shadow-sm">
          🎁
        </div>
        <p className="text-lg font-black text-[#1F7A4E]">{copy.reward_text}</p>
        {googleReviewLink && (
          <a
            href={googleReviewLink}
            className="mt-4 inline-flex rounded-3xl bg-[#24A66D] px-5 py-3 text-sm font-black text-white shadow-sm shadow-[#24A66D]/20"
          >
            Dejar reseña en Google →
          </a>
        )}
      </div>
    );
  }

  if (phase === "redirecting" || phase === "thanks") {
    return (
      <div className="mt-6 rounded-3xl bg-[#EAF9EF] p-5 text-center">
        <div className="pv-sparkle mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-white text-2xl shadow-sm">
          ✨
        </div>
        <p
          className={`text-lg font-black text-[#1F7A4E] ${
            phase === "redirecting" ? "animate-pulse" : ""
          }`}
        >
          {copy.positive_redirect_title}
        </p>
        <p className="mt-1 text-sm text-[#337257]">{copy.positive_redirect_body}</p>
      </div>
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
