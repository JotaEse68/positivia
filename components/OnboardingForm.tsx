"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Business = {
  id: string;
  name: string;
  slug: string | null;
  google_review_link: string | null;
  whatsapp_owner: string | null;
  email_owner: string | null;
  logo_url: string | null;
};

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

type SlugStatus = "idle" | "checking" | "available" | "taken" | "invalid";

const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export default function OnboardingForm({ business }: { business: Business }) {
  const router = useRouter();
  const [slug, setSlug] = useState(business.slug ?? slugify(business.name));
  const [slugStatus, setSlugStatus] = useState<SlugStatus>(
    business.slug ? "available" : "idle"
  );
  const [googleReviewLink, setGoogleReviewLink] = useState(
    business.google_review_link ?? ""
  );
  const [whatsapp, setWhatsapp] = useState(business.whatsapp_owner ?? "");
  const [email, setEmail] = useState(business.email_owner ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const candidate = slug.trim().toLowerCase();
    const unchanged = candidate === (business.slug ?? "");
    const delay = !candidate || !SLUG_RE.test(candidate) || unchanged ? 0 : 500;

    debounceRef.current = setTimeout(async () => {
      if (!candidate || !SLUG_RE.test(candidate)) {
        setSlugStatus("invalid");
        return;
      }
      if (unchanged) {
        setSlugStatus("available");
        return;
      }

      setSlugStatus("checking");
      try {
        const res = await fetch(
          `/api/admin/onboarding/slug-check?slug=${encodeURIComponent(candidate)}&business_id=${business.id}`
        );
        const data = await res.json();
        setSlugStatus(data.available ? "available" : data.reason === "formato" ? "invalid" : "taken");
      } catch {
        setSlugStatus("invalid");
      }
    }, delay);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [slug, business.slug, business.id]);

  const canSubmit = slugStatus === "available" && !busy;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setError(null);

    try {
      const form = new FormData(e.currentTarget);
      form.set("business_id", business.id);
      form.set("slug", slug.trim().toLowerCase());
      const res = await fetch("/api/admin/experience", {
        method: "PATCH",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo guardar");
      router.push("/admin/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar");
      setBusy(false);
    }
  }

  const input =
    "mt-1 w-full rounded-lg border border-[#102D2A]/15 bg-white p-3 text-sm text-[#102D2A] focus:border-[#27765B] focus:outline-none focus:ring-2 focus:ring-[#DDF6DF]";
  const label = "text-sm font-bold text-[#243126]";
  const step =
    "rounded-2xl border border-[#102D2A]/10 bg-white p-5 shadow-[0_10px_40px_rgba(39,66,48,0.06)]";

  const slugHint: Record<SlugStatus, { text: string; className: string }> = {
    idle: { text: "", className: "" },
    checking: { text: "Comprobando disponibilidad...", className: "text-[#8A6B3E]" },
    available: { text: "Disponible", className: "text-[#1F7A4E]" },
    taken: { text: "Ese slug ya está en uso", className: "text-red-600" },
    invalid: { text: "Usa minúsculas, números y guiones", className: "text-red-600" },
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <section className={step}>
        <p className="text-xs font-black uppercase tracking-[0.14em] text-[#27765B]">
          Paso 1
        </p>
        <h2 className="mt-1 text-lg font-black">Elige la dirección de tu QR</h2>
        <label className={`${label} mt-3 block`}>
          Slug
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
            className={input}
            placeholder="bar-pepe"
          />
        </label>
        {slugHint[slugStatus].text && (
          <p className={`mt-1 text-xs font-bold ${slugHint[slugStatus].className}`}>
            {slugHint[slugStatus].text}
          </p>
        )}
        <p className="mt-1 text-xs text-[#8A6B3E]">
          Tu enlace será app.positivia.net/r/{slug || "tu-negocio"}
        </p>
      </section>

      <section className={step}>
        <p className="text-xs font-black uppercase tracking-[0.14em] text-[#27765B]">
          Paso 2
        </p>
        <h2 className="mt-1 text-lg font-black">Tu enlace de reseña de Google</h2>
        <label className={`${label} mt-3 block`}>
          Enlace de Google Business Profile
          <input
            value={googleReviewLink}
            onChange={(e) => setGoogleReviewLink(e.target.value)}
            name="google_review_link"
            type="url"
            required
            placeholder="https://g.page/r/..."
            className={input}
          />
        </label>
      </section>

      <section className={step}>
        <p className="text-xs font-black uppercase tracking-[0.14em] text-[#27765B]">
          Paso 3
        </p>
        <h2 className="mt-1 text-lg font-black">Dónde recibir avisos</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <label className={label}>
            WhatsApp del encargado
            <input
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              name="whatsapp_owner"
              placeholder="+34600000000"
              className={input}
            />
          </label>
          <label className={label}>
            Email que recibe avisos
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              name="email_owner"
              type="email"
              placeholder="encargado@negocio.com"
              className={input}
            />
          </label>
        </div>
      </section>

      <section className={step}>
        <p className="text-xs font-black uppercase tracking-[0.14em] text-[#27765B]">
          Paso 4
        </p>
        <h2 className="mt-1 text-lg font-black">Tu logo</h2>
        <label className={`${label} mt-3 block`}>
          Logo redondo (opcional, se puede añadir después)
          <input name="logo" type="file" accept="image/*" className={`${input} p-2`} />
        </label>
      </section>

      {error && (
        <p className="rounded-2xl bg-red-50 p-3 text-center text-sm font-bold text-red-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full rounded-2xl bg-[#27765B] py-3 text-base font-black text-white shadow-lg shadow-[#27765B]/20 disabled:opacity-50"
      >
        {busy ? "Guardando..." : "Guardar y entrar al panel"}
      </button>
    </form>
  );
}
