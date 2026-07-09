import Link from "next/link";
import { DEMO_SLUG } from "@/lib/demo";

const sectors = [
  {
    title: "Restaurante",
    pain: "Mesa contenta que se va sin dejar reseña y queja que acaba en Google.",
    promise: "El camarero pide el QR, las buenas van a Google y las malas llegan privadas.",
    accent: "bg-[#FFF8E7] text-[#6B421B]",
  },
  {
    title: "Hotel",
    pain: "Recepción se entera tarde de una mala experiencia durante la estancia.",
    promise: "El huésped avisa antes de publicar y el encargado puede recuperarlo.",
    accent: "bg-[#EAF9EF] text-[#1F7A4E]",
  },
  {
    title: "Servicios",
    pain: "Clientes satisfechos no escriben y los molestos sí hacen ruido.",
    promise: "Un enlace simple para pedir opinión después de cada trabajo.",
    accent: "bg-[#FFF0ED] text-[#9F3D34]",
  },
];

const flow = [
  {
    title: "1. El cliente escanea",
    body: "Sin app, sin cuenta, sin fricción. Toca una estrella.",
    href: `/r/${DEMO_SLUG}`,
    label: "Probar QR",
  },
  {
    title: "2. PositivIA separa el camino",
    body: "4-5 estrellas abren Google. 1-3 estrellas abren un mensaje privado.",
    href: "/demo/google-review",
    label: "Ver Google simulado",
  },
  {
    title: "3. El dueño lo gestiona",
    body: "Panel con quejas privadas, urgencia, respuesta sugerida y resumen semanal.",
    href: "/demo/dashboard",
    label: "Ver panel demo",
  },
];

export default function DemoPage() {
  return (
    <main className="min-h-screen bg-[#F6F7F3] text-[#203126]">
      <section className="mx-auto max-w-6xl px-4 py-8">
        <header className="overflow-hidden rounded-2xl border border-[#203126]/10 bg-white shadow-sm">
          <div className="bg-gradient-to-br from-[#FFBE4D] via-[#FF7D66] to-[#24A66D] p-7 text-white">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-white/75">
              Demo vendible
            </p>
            <div className="mt-3 flex flex-wrap items-end justify-between gap-5">
              <div>
                <h1 className="max-w-3xl text-4xl font-black leading-tight">
                  Enseña PositivIA en tres minutos sin tocar datos reales
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/90">
                  Usa esta pantalla para vender el recorrido completo: QR, filtro
                  inteligente, panel del dueño, PDFs y guion del equipo.
                </p>
              </div>
              <Link
                href={`/r/${DEMO_SLUG}`}
                className="rounded-xl bg-white px-5 py-3 text-sm font-black text-[#203126]"
              >
                Empezar demo
              </Link>
            </div>
          </div>
        </header>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          {sectors.map((sector) => (
            <article key={sector.title} className="rounded-2xl border bg-white p-5 shadow-sm">
              <span className={`rounded-full px-3 py-1 text-xs font-black ${sector.accent}`}>
                {sector.title}
              </span>
              <p className="mt-4 text-sm font-bold text-neutral-500">Problema</p>
              <p className="mt-1 text-sm leading-6 text-neutral-700">{sector.pain}</p>
              <p className="mt-4 text-sm font-bold text-neutral-500">Cómo lo cuentas</p>
              <p className="mt-1 text-sm leading-6 text-neutral-700">{sector.promise}</p>
            </article>
          ))}
        </section>

        <section className="mt-6 rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black text-neutral-950">Recorrido de venta</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {flow.map((step) => (
              <article key={step.title} className="rounded-2xl border border-neutral-200 p-4">
                <h3 className="font-black text-neutral-950">{step.title}</h3>
                <p className="mt-2 min-h-[72px] text-sm leading-6 text-neutral-600">
                  {step.body}
                </p>
                <Link
                  href={step.href}
                  className="mt-4 inline-flex rounded-lg bg-[#203126] px-4 py-2 text-sm font-black text-white"
                >
                  {step.label}
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-4">
          {[
            ["PDF A4", `/api/qr-print?slug=${DEMO_SLUG}&size=a4&layout=full`],
            ["PDF A3", `/api/qr-print?slug=${DEMO_SLUG}&size=a3&layout=full`],
            ["Ticket 80 mm", `/api/qr-print?slug=${DEMO_SLUG}&layout=ticket`],
            ["Servilletero", `/api/qr-print?slug=${DEMO_SLUG}&layout=table`],
          ].map(([label, href]) => (
            <a
              key={label}
              href={href}
              className="rounded-2xl border bg-white p-4 text-center text-sm font-black text-neutral-800 shadow-sm hover:bg-neutral-50"
            >
              Descargar {label}
            </a>
          ))}
        </section>
      </section>
    </main>
  );
}
