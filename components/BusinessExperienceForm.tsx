"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { RatingCopy } from "@/lib/rating-copy";

type Business = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  banner_url?: string | null;
  color_primary: string | null;
  google_review_link: string | null;
  whatsapp_owner: string | null;
  email_owner: string | null;
};

export default function BusinessExperienceForm({
  business,
  ratingSettings,
  qrUrl,
}: {
  business: Business;
  ratingSettings: RatingCopy;
  qrUrl: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"qr" | "brand" | "growth">("qr");

  async function copyQrUrl() {
    try {
      await navigator.clipboard.writeText(qrUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    setError(null);

    try {
      const form = new FormData(e.currentTarget);
      form.set("business_id", business.id);
      const res = await fetch("/api/admin/experience", {
        method: "PATCH",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo guardar");
      setMessage(
        data.warning === "settings_schema_missing"
          ? "Datos básicos guardados. Los textos avanzados no se han podido guardar todavía."
          : "Experiencia QR guardada"
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setBusy(false);
    }
  }

  const input =
    "mt-1 w-full rounded-lg border border-neutral-300 bg-white p-2.5 text-sm text-neutral-900 shadow-sm focus:border-[#24A66D] focus:outline-none focus:ring-2 focus:ring-[#BFE7CF]";
  const label = "text-sm font-semibold text-neutral-700";
  const tabs = [
    { id: "qr", label: "Mi QR" },
    { id: "brand", label: "Mi marca" },
    { id: "growth", label: "Conseguir reseñas" },
  ] as const;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="sticky top-3 z-20 rounded-2xl border border-[#203126]/10 bg-white/95 p-3 shadow-xl shadow-[#203126]/10 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[#1F7A4E]">
              Enlace de evaluación
            </p>
            <p className="max-w-[18rem] truncate text-sm font-semibold text-neutral-800 sm:max-w-md">
              {qrUrl}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href={qrUrl}
              target="_blank"
              className="rounded-lg bg-neutral-950 px-4 py-2 text-sm font-black text-white"
            >
              Abrir evaluación
            </a>
            <button
              type="button"
              onClick={copyQrUrl}
              className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-black text-neutral-800"
            >
              {copied ? "Copiado" : "Copiar enlace"}
            </button>
            <button
              type="submit"
              disabled={busy}
              className="rounded-lg bg-[#24A66D] px-4 py-2 text-sm font-black text-white disabled:opacity-60"
            >
              {busy ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>
      </div>

      <nav className="grid gap-2 rounded-2xl border bg-white p-2 shadow-sm sm:grid-cols-3">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-xl px-4 py-3 text-sm font-black transition-colors ${
              activeTab === tab.id
                ? "bg-[#203126] text-white"
                : "text-neutral-600 hover:bg-neutral-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      {(message || error) && (
        <div className="rounded-xl border bg-white px-4 py-3 shadow-sm">
          {message && <p className="text-sm font-bold text-[#1F7A4E]">{message}</p>}
          {error && <p className="text-sm font-bold text-red-600">{error}</p>}
        </div>
      )}

      {activeTab === "qr" && (
        <>
      <section className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="bg-gradient-to-br from-[#FFBE4D] via-[#FF7D66] to-[#24A66D] p-5 text-white">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-white/75">
            Control del QR
          </p>
          <h2 className="mt-2 text-2xl font-black leading-tight">
            Lo que verá el cliente antes de ir a Google
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/90">
            Aquí se configura el enlace de Google, el tono, los colores, las preguntas
            cuando algo sale mal y el detalle visible que quieras mostrar.
          </p>
        </div>

        <div className="grid gap-5 p-5 lg:grid-cols-[1fr_280px]">
          <div>
            <label className={label}>
              Enlace público del QR
              <input readOnly value={qrUrl} className={`${input} bg-neutral-50`} />
            </label>
            <div className="mt-3 flex flex-wrap gap-2">
              <a
                href={qrUrl}
                target="_blank"
                className="rounded-lg bg-neutral-950 px-4 py-2 text-sm font-bold text-white"
              >
                Abrir pantalla QR
              </a>
              <button
                type="button"
                onClick={copyQrUrl}
                className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-bold text-neutral-800"
              >
                {copied ? "Copiado" : "Copiar enlace"}
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-amber-100 bg-[#FFF8E7] p-4">
            <p className="text-sm font-black text-[#6B421B]">{business.name}</p>
            <p className="mt-1 text-xs font-medium text-[#8A6B3E]">/{business.slug}</p>
            {business.banner_url && (
              <Image
                src={business.banner_url}
                alt={`Banner de ${business.name}`}
                width={240}
                height={80}
                className="mt-3 h-20 w-full rounded-xl object-cover"
                unoptimized
              />
            )}
            {business.logo_url ? (
              <Image
                src={business.logo_url}
                alt={business.name}
                width={80}
                height={80}
                className="mt-3 h-20 w-20 rounded-2xl object-cover"
                unoptimized
              />
            ) : (
              <div className="mt-3 flex h-20 w-20 items-center justify-center rounded-2xl bg-white text-3xl font-black text-[#24A66D]">
                {business.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-neutral-950">Google y contacto</h2>
            <p className="mt-1 text-sm text-neutral-500">
              Las buenas experiencias van a Google. Las malas llegan al responsable.
            </p>
          </div>
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-[#24A66D] px-4 py-2 text-sm font-black text-white shadow-sm disabled:opacity-60"
          >
            {busy ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className={`${label} sm:col-span-2`}>
            Enlace de reseña de Google Business Profile
            <input
              name="google_review_link"
              type="url"
              defaultValue={business.google_review_link ?? ""}
              placeholder="https://g.page/r/..."
              className={input}
            />
          </label>
          <label className={label}>
            WhatsApp del encargado
            <input
              name="whatsapp_owner"
              defaultValue={business.whatsapp_owner ?? ""}
              placeholder="+34600000000"
              className={input}
            />
          </label>
          <label className={label}>
            Email que recibe avisos
            <input
              name="email_owner"
              type="email"
              defaultValue={business.email_owner ?? ""}
              placeholder="encargado@negocio.com"
              className={input}
            />
          </label>
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-black text-neutral-950">Kit para imprimir</h2>
        <p className="mt-1 text-sm text-neutral-500">
          PDFs listos para imprenta o Canva. Elige el formato según dónde irá el QR.
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <a href={`/api/qr-print?slug=${business.slug}&size=a4&layout=full`} className="rounded-lg bg-neutral-950 px-4 py-2 text-center text-sm font-black text-white">
            Cartel PDF A4
          </a>
          <a href={`/api/qr-print?slug=${business.slug}&size=a3&layout=full`} className="rounded-lg border px-4 py-2 text-center text-sm font-black text-neutral-800">
            Cartel PDF A3
          </a>
          <a href={`/api/qr-print?slug=${business.slug}&layout=ticket`} className="rounded-lg border px-4 py-2 text-center text-sm font-black text-neutral-800">
            Ticket 80 mm PDF
          </a>
          <a href={`/api/qr-print?slug=${business.slug}&layout=table`} className="rounded-lg border px-4 py-2 text-center text-sm font-black text-neutral-800">
            Servilletero 10x15 PDF
          </a>
          <a href={`/api/qr-print?slug=${business.slug}&size=a4&layout=qr`} className="rounded-lg border px-4 py-2 text-center text-sm font-black text-neutral-800">
            Solo QR PDF
          </a>
          <a href={`/api/qr?slug=${business.slug}&download=1`} className="rounded-lg border px-4 py-2 text-center text-sm font-black text-neutral-800">
            Solo QR PNG
          </a>
        </div>
      </section>
        </>
      )}

      {activeTab === "brand" && (
      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-black text-neutral-950">Marca y primera impresión</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className={label}>
            Color principal
            <input
              name="color_primary"
              type="color"
              defaultValue={business.color_primary ?? "#24A66D"}
              className="mt-1 h-11 w-full rounded-lg border border-neutral-300 bg-white p-1"
            />
          </label>
          <label className={label}>
            Logo redondo
            {business.logo_url && (
              <div className="mt-2 flex items-center gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-3">
                <Image
                  src={business.logo_url}
                  alt={business.name}
                  width={56}
                  height={56}
                  className="h-14 w-14 rounded-full bg-white object-contain p-1"
                  unoptimized
                />
                <label className="flex items-center gap-2 text-xs font-bold text-red-600">
                  <input name="remove_logo" value="1" type="checkbox" />
                  Quitar logo actual al guardar
                </label>
              </div>
            )}
            <input
              name="logo"
              type="file"
              accept="image/*"
              className="mt-1 w-full rounded-lg border border-neutral-300 bg-white p-2 text-sm"
            />
            <span className="mt-1 block text-xs leading-5 text-neutral-400">
              Canva: 800x800 px. Mejor PNG/WebP, centrado, con aire alrededor.
            </span>
          </label>
          <label className={`${label} sm:col-span-2`}>
            Banner horizontal de la empresa
            {business.banner_url && (
              <div className="mt-2 rounded-xl border border-neutral-200 bg-neutral-50 p-3">
                <Image
                  src={business.banner_url}
                  alt={`Banner de ${business.name}`}
                  width={640}
                  height={220}
                  className="h-28 w-full rounded-lg object-cover"
                  unoptimized
                />
                <label className="mt-2 flex items-center gap-2 text-xs font-bold text-red-600">
                  <input name="remove_banner" value="1" type="checkbox" />
                  Quitar banner actual al guardar
                </label>
              </div>
            )}
            <input
              name="banner"
              type="file"
              accept="image/*"
              className="mt-1 w-full rounded-lg border border-neutral-300 bg-white p-2 text-sm"
            />
            <span className="mt-1 block text-xs leading-5 text-neutral-400">
              Canva: 1600x700 px. Mantén texto/logos importantes en el centro,
              porque en móvil los bordes pueden recortarse.
            </span>
          </label>
          <label className={label}>
            Versión de colores
            <select name="visual_theme" defaultValue={ratingSettings.visual_theme} className={input}>
              <option value="sunrise">Amanecer: sol, coral y verde</option>
              <option value="hope">Esperanza: verde cálido y amarillo</option>
              <option value="coral">Coral: cercano y con energía</option>
            </select>
          </label>
          <label className={label}>
            Logo en pantalla
            <select name="logo_display" defaultValue={ratingSettings.logo_display} className={input}>
              <option value="large">Grande</option>
              <option value="compact">Compacto</option>
            </select>
          </label>
        </div>
      </section>
      )}

      {activeTab === "growth" && (
      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-black text-neutral-950">Cómo conseguir más reseñas</h2>
        <p className="mt-1 text-sm text-neutral-500">
          El QR funciona cuando se pide bien. Configura el motivo para escanear y
          deja claro qué pasa si algo salió mal.
        </p>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {[
            {
              title: "El camarero lo pide",
              body: "Frase de 3 segundos: '¿Nos ayudas con una valoración? Es tocar una estrella y listo.'",
            },
            {
              title: "Va donde el cliente mira",
              body: "Ticket, servilletero, mantel de papel, recepción o tarjeta de mesa. La pared suele fallar.",
            },
            {
              title: "Da un motivo honesto",
              body: "Sorteo de cena, café, chupito, upgrade o descuento. Pide opinión, no compres reseñas.",
            },
            {
              title: "Cero fricción",
              body: "Sin registro, sin app y sin login. Si fue mal, lo recibe el responsable en privado.",
            },
          ].map((item) => (
            <article key={item.title} className="rounded-2xl border border-[#E8DEC7] bg-[#FFF8E7] p-4">
              <h3 className="font-black text-[#5A3D25]">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#76543A]">{item.body}</p>
            </article>
          ))}
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className={`${label} sm:col-span-2`}>
            Detalle visible en la pantalla QR
            <textarea
              name="incentive_text"
              defaultValue={ratingSettings.incentive_text}
              rows={3}
              placeholder="Ejemplo: Este mes sorteamos una cena para dos entre quienes nos ayudan a mejorar con su opinión."
              className={input}
            />
          </label>
          <label className={`${label} flex items-center gap-2 sm:col-span-2`}>
            <input
              type="checkbox"
              name="reward_enabled"
              defaultChecked={ratingSettings.reward_enabled}
              className="h-4 w-4 rounded border-neutral-300"
            />
            Ofrecer recompensa por valorar (solo 4-5★)
          </label>
          <label className={`${label} sm:col-span-2`}>
            Texto de la recompensa
            <input
              name="reward_text"
              defaultValue={ratingSettings.reward_text}
              placeholder="Café gratis en tu próxima visita · CAFE10"
              className={input}
            />
          </label>
          <label className={label}>
            Opciones si algo falló
            <textarea
              name="issue_options"
              defaultValue={ratingSettings.issue_options}
              rows={6}
              className={input}
            />
          </label>
          <label className={label}>
            Mensaje de calma
            <textarea
              name="recovery_hint"
              defaultValue={ratingSettings.recovery_hint}
              rows={6}
              className={input}
            />
          </label>
          <label className={label}>
            Título si algo falló
            <input
              name="private_prompt_title"
              defaultValue={ratingSettings.private_prompt_title}
              className={input}
            />
          </label>
          <label className={label}>
            Texto antes de enviar en privado
            <textarea
              name="private_prompt_body"
              defaultValue={ratingSettings.private_prompt_body}
              rows={4}
              className={input}
            />
          </label>
          <label className={label}>
            Botón de envío privado
            <input
              name="private_submit_label"
              defaultValue={ratingSettings.private_submit_label}
              className={input}
            />
          </label>
          <label className={label}>
            Título tras enviar
            <input
              name="private_thanks_title"
              defaultValue={ratingSettings.private_thanks_title}
              className={input}
            />
          </label>
          <label className={`${label} sm:col-span-2`}>
            Cierre tras enviar la queja
            <textarea
              name="private_thanks_body"
              defaultValue={ratingSettings.private_thanks_body}
              rows={3}
              className={input}
            />
          </label>
          <label className={label}>
            Título si fue bien
            <input
              name="positive_redirect_title"
              defaultValue={ratingSettings.positive_redirect_title}
              className={input}
            />
          </label>
          <label className={label}>
            Texto antes de abrir Google
            <textarea
              name="positive_redirect_body"
              defaultValue={ratingSettings.positive_redirect_body}
              rows={3}
              className={input}
            />
          </label>
          <label className={`${label} sm:col-span-2`}>
            Nota inferior
            <input
              name="appreciation_note"
              defaultValue={ratingSettings.appreciation_note}
              className={input}
            />
          </label>
        </div>
      </section>
      )}
    </form>
  );
}
