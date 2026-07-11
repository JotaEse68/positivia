import Link from "next/link";
import { Fraunces } from "next/font/google";
import AdminStatsCard from "@/components/AdminStatsCard";
import { DEMO_SLUG, demoBusiness, demoFeedback, demoWeeklySummary } from "@/lib/demo";

export const dynamic = "force-dynamic";

const display = Fraunces({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-display",
});

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
    <main className={`${display.variable} min-h-screen bg-[#FFF9EA] text-[#102D2A]`}>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#27765B]">
              Demo interactiva
            </p>
            <h1
              className="mt-1 text-3xl font-bold"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {demoBusiness.name}
            </h1>
            <p className="mt-1 text-sm text-[#53655E]">
              Vista de dueño con datos de ejemplo, alertas y resumen semanal.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/r/${DEMO_SLUG}`}
              className="rounded-lg bg-[#102D2A] px-4 py-2 text-sm font-semibold text-white"
            >
              Probar QR
            </Link>
            <a
              href={`/api/qr?slug=${DEMO_SLUG}&download=1`}
              className="rounded-lg border border-[#102D2A]/15 bg-white px-4 py-2 text-sm font-semibold text-[#102D2A]"
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
              <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-[#53655E]">
                Plan Pro
              </span>
            </div>
            <div className="space-y-4">
              {complaints.map((item) => (
                <article key={item.id} className="rounded-2xl border border-[#102D2A]/10 bg-white p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-lg text-[#F6C64E]">
                        {"★".repeat(item.rating)}
                        <span className="text-[#102D2A]/15">
                          {"★".repeat(5 - item.rating)}
                        </span>
                      </p>
                      <p className="mt-1 text-xs text-[#8A6B3E]">
                        {formatDate(item.created_at)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {item.ai_urgency && (
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            item.ai_urgency === "high"
                              ? "bg-[#EF735C]/15 text-[#C04C3F]"
                              : "bg-[#F6C64E]/20 text-[#8A6B3E]"
                          }`}
                        >
                          {item.ai_urgency === "high" ? "Urgente" : "Media"}
                        </span>
                      )}
                      {item.reply_sent && (
                        <span className="rounded-full bg-[#DDF6DF] px-2.5 py-1 text-xs font-medium text-[#27765B]">
                          Gestionada
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="mt-3 text-[#243126]">{item.comment}</p>
                  {item.ai_summary_theme && (
                    <p className="mt-2 text-xs text-[#8A6B3E]">
                      Tema detectado: {item.ai_summary_theme}
                    </p>
                  )}
                  {item.suggested_reply && (
                    <div className="mt-4 rounded-xl bg-[#FFF9EA] p-4">
                      <p className="text-xs font-medium text-[#53655E]">
                        Respuesta sugerida
                      </p>
                      <p className="mt-1 text-sm text-[#243126]">
                        {item.suggested_reply}
                      </p>
                    </div>
                  )}
                </article>
              ))}
            </div>
          </div>

          <aside className="space-y-4">
            <section className="rounded-2xl border border-[#102D2A]/10 bg-white p-5">
              <h2 className="text-lg font-semibold">Resumen semanal</h2>
              <p className="mt-2 text-sm text-[#243126]">
                {demoWeeklySummary.summary_text}
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-[#DDF6DF] px-2.5 py-1 text-[#27765B]">
                  {demoWeeklySummary.positive_count} positivas
                </span>
                <span className="rounded-full bg-[#EF735C]/15 px-2.5 py-1 text-[#C04C3F]">
                  {demoWeeklySummary.negative_count} quejas
                </span>
                <span className="rounded-full bg-[#F6C64E]/20 px-2.5 py-1 text-[#8A6B3E]">
                  {demoWeeklySummary.top_theme}
                </span>
              </div>
            </section>

            <section className="rounded-2xl border border-[#102D2A]/10 bg-white p-5">
              <h2 className="text-lg font-semibold">Alertas</h2>
              <ol className="mt-3 space-y-3 text-sm">
                <li className="rounded-xl bg-[#FFF9EA] p-3">
                  WhatsApp enviado al dueño tras queja de 2 estrellas.
                </li>
                <li className="rounded-xl bg-[#FFF9EA] p-3">
                  Clasificación IA añadida: espera y temperatura.
                </li>
                <li className="rounded-xl bg-[#FFF9EA] p-3">
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
