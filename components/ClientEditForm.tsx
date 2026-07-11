"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { RatingCopy } from "@/lib/rating-copy";

type Client = {
  id: string;
  name: string;
  slug: string;
  plan: "starter" | "pro";
  plan_status: "trial" | "active" | "cancelled";
  logo_url?: string | null;
  banner_url?: string | null;
  color_primary: string | null;
  google_review_link: string | null;
  whatsapp_owner: string | null;
  email_owner: string | null;
};

export default function ClientEditForm({
  client,
  ratingSettings,
  qrUrl,
}: {
  client: Client;
  ratingSettings: RatingCopy;
  qrUrl: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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

    const form = new FormData(e.currentTarget);
    form.set("id", client.id);

    try {
      const res = await fetch("/api/superadmin/clients", {
        method: "PATCH",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo guardar");
      setMessage(
        data.warning === "rating_settings_table_missing"
          ? "Cambios básicos guardados. Los mensajes QR avanzados no se han podido guardar todavía."
          : "Cambios guardados"
      );
      const nextSlug = String(form.get("slug") ?? "");
      if (nextSlug && nextSlug !== client.slug) {
        router.push(`/superadmin/clients/${nextSlug}`);
      } else {
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setBusy(false);
    }
  }

  const input =
    "mt-1 w-full rounded-lg border border-neutral-300 bg-white p-2.5 text-sm text-neutral-900 focus:border-green-500 focus:outline-none";

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border bg-white p-6">
      <div className="sticky top-3 z-20 mb-5 rounded-2xl border border-[#203126]/10 bg-white/95 p-3 shadow-xl shadow-[#203126]/10 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-green-700">
              Evaluación pública
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
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">Editar cliente</h2>
          <p className="text-sm text-neutral-500">
            Cambia teléfono, email, slug, estado y enlace de reseñas desde aquí.
          </p>
        </div>
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-neutral-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {busy ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="text-sm text-neutral-600">
          Nombre
          <input name="name" required defaultValue={client.name} className={input} />
        </label>
        <label className="text-sm text-neutral-600">
          Slug
          <input
            name="slug"
            required
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            defaultValue={client.slug}
            className={input}
          />
        </label>
        <label className="text-sm text-neutral-600">
          WhatsApp del dueño
          <input
            name="whatsapp_owner"
            defaultValue={client.whatsapp_owner ?? ""}
            placeholder="+34600000000"
            className={input}
          />
        </label>
        <label className="text-sm text-neutral-600">
          Email del dueño
          <input
            name="email_owner"
            type="email"
            defaultValue={client.email_owner ?? ""}
            className={input}
          />
        </label>
        <label className="text-sm text-neutral-600 sm:col-span-2">
          Link de reseña de Google
          <input
            name="google_review_link"
            type="url"
            defaultValue={client.google_review_link ?? ""}
            placeholder="https://g.page/r/..."
            className={input}
          />
        </label>
        <label className="text-sm text-neutral-600">
          Color de marca
          <input
            name="color_primary"
            type="color"
            defaultValue={client.color_primary ?? "#16a34a"}
            className="mt-1 h-10 w-full rounded-lg border border-neutral-300"
          />
        </label>
        <label className="text-sm text-neutral-600 sm:col-span-2">
          Logo redondo
          {client.logo_url && (
            <div className="mt-2 flex items-center gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-3">
              <Image
                src={client.logo_url}
                alt={client.name}
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
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="mt-1 w-full rounded-lg border border-neutral-300 bg-white p-2.5 text-sm text-neutral-700"
          />
          <span className="mt-1 block text-xs leading-5 text-neutral-400">
            Canva: 800x800 px. Mejor PNG/WebP, centrado, con aire alrededor.
          </span>
        </label>
        <label className="text-sm text-neutral-600 sm:col-span-2">
          Banner horizontal de la empresa
          {client.banner_url && (
            <div className="mt-2 rounded-xl border border-neutral-200 bg-neutral-50 p-3">
              <Image
                src={client.banner_url}
                alt={`Banner de ${client.name}`}
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
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="mt-1 w-full rounded-lg border border-neutral-300 bg-white p-2.5 text-sm text-neutral-700"
          />
          <span className="mt-1 block text-xs leading-5 text-neutral-400">
            Canva: 1600x700 px. Deja lo importante en el centro para que se vea
            bien en móvil. Si no subes banner, se usa el color/degradado.
          </span>
        </label>
        <label className="text-sm text-neutral-600">
          Plan
          <select name="plan" defaultValue={client.plan} className={input}>
            <option value="starter">Starter</option>
            <option value="pro">Pro</option>
          </select>
        </label>
        <label className="text-sm text-neutral-600">
          Estado
          <select name="plan_status" defaultValue={client.plan_status} className={input}>
            <option value="trial">Prueba</option>
            <option value="active">Activo</option>
            <option value="cancelled">Cancelado</option>
          </select>
        </label>
      </div>

      <section className="mt-8 rounded-2xl border border-amber-100 bg-amber-50/60 p-5">
        <div>
          <h3 className="text-base font-semibold text-amber-950">
            Mensajes de la pantalla QR
          </h3>
          <p className="mt-1 text-sm text-amber-900">
            Ajusta el tono que ve el cliente final. Evita prometer premios a cambio
            de publicar reseñas en Google.
          </p>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="text-sm text-neutral-600">
            Estilo de color
            <select
              name="visual_theme"
              defaultValue={ratingSettings.visual_theme}
              className={input}
            >
              <option value="sunrise">Amanecer: amarillo, coral y verde</option>
              <option value="hope">Esperanza: verde cálido y sol</option>
              <option value="coral">Coral: más energía y cercanía</option>
            </select>
          </label>
          <label className="text-sm text-neutral-600">
            Logo en el banner
            <select
              name="logo_display"
              defaultValue={ratingSettings.logo_display}
              className={input}
            >
              <option value="large">Grande</option>
              <option value="compact">Compacto</option>
            </select>
          </label>
          <label className="text-sm text-neutral-600">
            Detalle visible / premio permitido
            <textarea
              name="incentive_text"
              defaultValue={ratingSettings.incentive_text}
              placeholder="Ejemplo: Cada mes sorteamos una cena entre quienes nos dejan su opinión. Sin obligación de publicar en Google."
              rows={3}
              className={input}
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-neutral-600">
            <input
              type="checkbox"
              name="reward_enabled"
              defaultChecked={ratingSettings.reward_enabled}
              className="h-4 w-4 rounded border-neutral-300"
            />
            Ofrecer recompensa por valorar (solo 4-5★)
          </label>
          <label className="text-sm text-neutral-600">
            Texto de la recompensa
            <input
              name="reward_text"
              defaultValue={ratingSettings.reward_text}
              placeholder="Café gratis en tu próxima visita · CAFE10"
              className={input}
            />
          </label>
          <label className="text-sm text-neutral-600">
            Opciones de problema
            <textarea
              name="issue_options"
              defaultValue={ratingSettings.issue_options}
              rows={5}
              className={input}
            />
          </label>
          <label className="text-sm text-neutral-600">
            Título si la experiencia fue buena
            <input
              name="positive_redirect_title"
              defaultValue={ratingSettings.positive_redirect_title}
              className={input}
            />
          </label>
          <label className="text-sm text-neutral-600">
            Texto antes de abrir Google
            <textarea
              name="positive_redirect_body"
              defaultValue={ratingSettings.positive_redirect_body}
              rows={3}
              className={input}
            />
          </label>
          <label className="text-sm text-neutral-600">
            Título si algo falló
            <input
              name="private_prompt_title"
              defaultValue={ratingSettings.private_prompt_title}
              className={input}
            />
          </label>
          <label className="text-sm text-neutral-600">
            Texto de seguridad antes de enviar
            <textarea
              name="private_prompt_body"
              defaultValue={ratingSettings.private_prompt_body}
              rows={3}
              className={input}
            />
          </label>
          <label className="text-sm text-neutral-600">
            Botón de envío privado
            <input
              name="private_submit_label"
              defaultValue={ratingSettings.private_submit_label}
              className={input}
            />
          </label>
          <label className="text-sm text-neutral-600">
            Ayuda / encargado
            <textarea
              name="recovery_hint"
              defaultValue={ratingSettings.recovery_hint}
              rows={3}
              className={input}
            />
          </label>
          <label className="text-sm text-neutral-600">
            Título tras enviar la queja
            <input
              name="private_thanks_title"
              defaultValue={ratingSettings.private_thanks_title}
              className={input}
            />
          </label>
          <label className="text-sm text-neutral-600">
            Cierre tras enviar la queja
            <textarea
              name="private_thanks_body"
              defaultValue={ratingSettings.private_thanks_body}
              rows={3}
              className={input}
            />
          </label>
          <label className="text-sm text-neutral-600 sm:col-span-2">
            Nota inferior
            <input
              name="appreciation_note"
              defaultValue={ratingSettings.appreciation_note}
              className={input}
            />
          </label>
        </div>
      </section>

      {message && <p className="mt-4 text-sm font-medium text-green-700">{message}</p>}
      {error && <p className="mt-4 text-sm font-medium text-red-600">{error}</p>}
      <div className="mt-6 border-t pt-5">
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-neutral-950 px-4 py-3 text-sm font-black text-white shadow-sm disabled:opacity-60"
        >
          {busy ? "Guardando..." : "Guardar todos los cambios"}
        </button>
      </div>
    </form>
  );
}
