import Link from "next/link";
import AdminStatsCard from "@/components/AdminStatsCard";
import { DEMO_SLUG, demoBusiness, demoFeedback, demoWeeklySummary } from "@/lib/demo";

export const dynamic = "force-dynamic";

function formatDate(value: string) {
  return new Date(value).toLocaleString("es-ES", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export default function DemoDashboardPage() {
  const publicCount = demoFeedback.filter((f) => f.status === "public_redirected").length;
  const complaints = demoFeedback.filter((f) => f.status === "private_captured");
  const pending = complaints.filter((f) => !f.reply_sent).length;

  return (
    <main className="min-h-screen bg-[#F6F3EC] text-[#12312F]">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-green-700">
              Demo interactiva
            </p>
            <h1 className="mt-1 text-3xl font-bold">{demoBusiness.name}</h1>
            <p className="mt-1 text-sm text-neutral-600">
              Vista de dueño con datos de ejemplo, alertas y resumen semanal.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/r/${DEMO_SLUG}`}
              className="rounded-lg bg-neutral-950 px-4 py-2 text-sm font-semibold text-white"
            >
              Probar QR
            </Link>
            <a
              href={`/api/qr?slug=${DEMO_SLUG}&download=1`}
              className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700"
            >
              Descargar QR demo
            </a>
          </div>
        </header>

        <section className="mt-6 grid gap-4 sm:grid-cols-3">
          <AdminStatsCard
            label="Reseñas públicas generadas"
            value={publicCount}
            hint="Clientes contentos enviados al paso externo"
            accent="green"
          />
          <AdminStatsCard
            label="Quejas privadas capturadas"
            value={complaints.length}
            hint="Feedback accionable para el dueño"
            accent="red"
          />
          <AdminStatsCard
            label="Pendientes de gestionar"
            value={pending}
            hint={pending > 0 ? "Requieren respuesta" : "Todo al día"}
          />
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Quejas privadas</h2>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-neutral-500">
                Plan Pro
              </span>
            </div>
            <div className="space-y-4">
              {complaints.map((item) => (
                <article key={item.id} className="rounded-2xl border bg-white p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-lg text-amber-500">
                        {"★".repeat(item.rating)}
                        <span className="text-neutral-300">
                          {"★".repeat(5 - item.rating)}
                        </span>
                      </p>
                      <p className="mt-1 text-xs text-neutral-400">
                        {formatDate(item.created_at)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {item.ai_urgency && (
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            item.ai_urgency === "high"
                              ? "bg-red-100 text-red-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {item.ai_urgency === "high" ? "Urgente" : "Media"}
                        </span>
                      )}
                      {item.reply_sent && (
                        <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                          Gestionada
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="mt-3 text-neutral-800">{item.comment}</p>
                  {item.ai_summary_theme && (
                    <p className="mt-2 text-xs text-neutral-400">
                      Tema detectado: {item.ai_summary_theme}
                    </p>
                  )}
                  {item.suggested_reply && (
                    <div className="mt-4 rounded-xl bg-neutral-50 p-4">
                      <p className="text-xs font-medium text-neutral-500">
                        Respuesta sugerida
                      </p>
                      <p className="mt-1 text-sm text-neutral-800">
                        {item.suggested_reply}
                      </p>
                    </div>
                  )}
                </article>
              ))}
            </div>
          </div>

          <aside className="space-y-4">
            <section className="rounded-2xl border bg-white p-5">
              <h2 className="text-lg font-semibold">Resumen semanal</h2>
              <p className="mt-2 text-sm text-neutral-700">
                {demoWeeklySummary.summary_text}
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-green-100 px-2.5 py-1 text-green-700">
                  {demoWeeklySummary.positive_count} positivas
                </span>
                <span className="rounded-full bg-red-100 px-2.5 py-1 text-red-700">
                  {demoWeeklySummary.negative_count} quejas
                </span>
                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-amber-700">
                  {demoWeeklySummary.top_theme}
                </span>
              </div>
            </section>

            <section className="rounded-2xl border bg-white p-5">
              <h2 className="text-lg font-semibold">Alertas</h2>
              <ol className="mt-3 space-y-3 text-sm">
                <li className="rounded-xl bg-neutral-50 p-3">
                  WhatsApp enviado al dueño tras queja de 2 estrellas.
                </li>
                <li className="rounded-xl bg-neutral-50 p-3">
                  Clasificación IA añadida: espera y temperatura.
                </li>
                <li className="rounded-xl bg-neutral-50 p-3">
                  Resumen semanal guardado y listo para envío.
                </li>
              </ol>
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}
