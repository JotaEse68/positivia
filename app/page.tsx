import Link from "next/link";
import { Fraunces, Schibsted_Grotesk } from "next/font/google";

const display = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display",
});
const body = Schibsted_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
});

// Paleta: tinta verde (confianza/hostelería), oro (estrellas), esmeralda
// (público/positivo), coral (interceptado/privado), papel cálido.
const C = {
  ink: "#0E2A2C",
  ink2: "#153F3C",
  paper: "#FAF7F0",
  emerald: "#17936B",
  gold: "#E7A93B",
  coral: "#E1674C",
};

function Stars({ n, color }: { n: number; color: string }) {
  return (
    <span aria-hidden className="tracking-[0.15em]">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} style={{ color: i < n ? color : "rgba(255,255,255,0.18)" }}>
          ★
        </span>
      ))}
    </span>
  );
}

export default function Home() {
  return (
    <div
      className={`${display.variable} ${body.variable} min-h-screen bg-[#FAF7F0] text-[#12312F]`}
      style={{ fontFamily: "var(--font-body)" }}
    >
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-black/5 bg-[#FAF7F0]/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <span className="text-xl font-bold tracking-tight">
            Positiv<span style={{ color: C.emerald }}>IA</span>
          </span>
          <Link
            href="/admin/login"
            className="rounded-full px-5 py-2 text-sm font-semibold text-white transition-transform active:scale-95"
            style={{ backgroundColor: C.ink }}
          >
            Entrar
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section
        className="relative overflow-hidden"
        style={{ backgroundColor: C.ink, color: C.paper }}
      >
        <div className="mx-auto grid max-w-6xl gap-12 px-5 py-16 md:grid-cols-2 md:items-center md:py-24">
          {/* Copy */}
          <div>
            <p
              className="pv-rise text-xs font-semibold uppercase tracking-[0.2em]"
              style={{ color: C.gold, animationDelay: "0.05s" }}
            >
              Reputación para negocios locales
            </p>
            <h1
              className="pv-rise mt-4 text-balance text-4xl leading-[1.05] sm:text-5xl md:text-[3.4rem]"
              style={{ fontFamily: "var(--font-display)", fontWeight: 600, animationDelay: "0.12s" }}
            >
              Las buenas experiencias van a Google.
              <br />
              <span style={{ fontStyle: "italic", color: C.gold }}>Las malas</span>, a
              ti — antes de ser públicas.
            </h1>
            <p
              className="pv-rise mt-5 max-w-md text-lg"
              style={{ color: "#B8CBC6", animationDelay: "0.2s" }}
            >
              El cliente contento casi nunca deja reseña; el enfadado sí. PositivIA
              corrige ese sesgo en el momento exacto: tras la visita, un QR decide.
            </p>
            <div
              className="pv-rise mt-8 flex flex-wrap items-center gap-3"
              style={{ animationDelay: "0.28s" }}
            >
              <Link
                href="/admin/login"
                className="rounded-full px-6 py-3 font-semibold transition-transform active:scale-95"
                style={{ backgroundColor: C.emerald, color: "#04140F" }}
              >
                Entrar al panel
              </Link>
              <Link
                href="/r/demo-restaurante"
                className="rounded-full px-6 py-3 font-semibold transition-transform active:scale-95"
                style={{ backgroundColor: C.gold, color: "#241605" }}
              >
                Probar QR demo
              </Link>
              <Link
                href="#como"
                className="rounded-full border px-6 py-3 font-semibold transition-colors hover:bg-white/5"
                style={{ borderColor: "rgba(255,255,255,0.2)", color: C.paper }}
              >
                Cómo funciona
              </Link>
            </div>
          </div>

          {/* Signature: la bifurcación */}
          <div className="pv-fade" style={{ animationDelay: "0.35s" }}>
            <div
              className="mx-auto max-w-sm rounded-3xl p-6"
              style={{ backgroundColor: C.ink2, boxShadow: "0 30px 60px -20px rgba(0,0,0,0.5)" }}
            >
              <p className="text-center text-sm" style={{ color: "#8FA8A3" }}>
                ¿Qué tal tu experiencia?
              </p>
              <div className="pv-float mt-3 text-center text-3xl">
                <Stars n={5} color={C.gold} />
              </div>

              {/* Fork */}
              <svg viewBox="0 0 240 60" className="mx-auto mt-4 h-12 w-full" aria-hidden>
                <path
                  d="M120 0 V20 M120 20 C120 40, 60 30, 56 52"
                  fill="none"
                  stroke={C.emerald}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <path
                  d="M120 20 C120 40, 180 30, 184 52"
                  fill="none"
                  stroke={C.coral}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>

              <div className="grid grid-cols-2 gap-3">
                <div
                  className="rounded-2xl p-4 text-center"
                  style={{ backgroundColor: "rgba(23,147,107,0.14)" }}
                >
                  <div className="mb-1"><Stars n={5} color={C.emerald} /></div>
                  <p className="text-xs font-semibold" style={{ color: "#7FE3C0" }}>
                    4–5 ★
                  </p>
                  <p className="mt-1 text-sm" style={{ color: C.paper }}>
                    Reseña pública en Google
                  </p>
                </div>
                <div
                  className="rounded-2xl p-4 text-center"
                  style={{ backgroundColor: "rgba(225,103,76,0.14)" }}
                >
                  <div className="mb-1"><Stars n={2} color={C.coral} /></div>
                  <p className="text-xs font-semibold" style={{ color: "#F3A594" }}>
                    1–3 ★
                  </p>
                  <p className="mt-1 text-sm" style={{ color: C.paper }}>
                    Aviso privado, solo para ti
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section id="como" className="mx-auto max-w-6xl px-5 py-20">
        <h2
          className="text-center text-3xl md:text-4xl"
          style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
        >
          Una decisión en tiempo real
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-center text-[#4A5C59]">
          Un QR estático manda a todo el mundo al mismo sitio, incluido el cliente
          enfadado. PositivIA elige según el rating.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            {
              t: "Escanea",
              d: "El cliente escanea el QR de la mesa, el ticket o el packaging al terminar. Sin apps, sin registro.",
            },
            {
              t: "Valora",
              d: "Elige de 1 a 5 estrellas en una página que carga al instante y lleva tu logo y tus colores.",
            },
            {
              t: "Se bifurca",
              d: "4–5★ va directo a tu reseña de Google. 1–3★ abre un mensaje privado y tú recibes el aviso al momento.",
            },
          ].map((s, i) => (
            <div key={s.t} className="rounded-3xl border border-black/5 bg-white p-7">
              <span
                className="text-sm font-semibold"
                style={{ color: C.emerald, fontFamily: "var(--font-display)" }}
              >
                0{i + 1}
              </span>
              <h3 className="mt-2 text-xl font-semibold">{s.t}</h3>
              <p className="mt-2 text-[#4A5C59]">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Planes */}
      <section style={{ backgroundColor: C.ink, color: C.paper }}>
        <div className="mx-auto max-w-6xl px-5 py-20">
          <h2
            className="text-center text-3xl md:text-4xl"
            style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
          >
            Planes
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                name: "Starter",
                price: "29€",
                feats: ["1 local", "QR ilimitados", "Filtrado por rating", "Alerta por email", "Panel con histórico"],
              },
              {
                name: "Pro",
                price: "49€",
                highlight: true,
                feats: [
                  "Todo Starter",
                  "Alertas por WhatsApp",
                  "Resumen semanal con IA",
                  "Respuesta sugerida por IA",
                  "Clasificación de urgencia",
                  "Tu logo y tus colores",
                ],
              },
              {
                name: "Local adicional",
                price: "+19–29€",
                feats: ["Todo Pro por local", "Comparativa entre locales", "Patrones cruzados", "Panel centralizado"],
              },
            ].map((p) => (
              <div
                key={p.name}
                className="rounded-3xl p-7"
                style={{
                  backgroundColor: p.highlight ? C.paper : C.ink2,
                  color: p.highlight ? C.ink : C.paper,
                  boxShadow: p.highlight ? "0 30px 60px -25px rgba(0,0,0,0.6)" : "none",
                }}
              >
                {p.highlight && (
                  <span
                    className="mb-3 inline-block rounded-full px-3 py-1 text-xs font-bold"
                    style={{ backgroundColor: C.emerald, color: "#04140F" }}
                  >
                    Más popular
                  </span>
                )}
                <h3 className="text-lg font-semibold">{p.name}</h3>
                <p className="mt-1">
                  <span
                    className="text-3xl font-bold"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {p.price}
                  </span>
                  <span className="text-sm opacity-70">/mes</span>
                </p>
                <ul className="mt-4 space-y-2 text-sm">
                  {p.feats.map((f) => (
                    <li key={f} className="flex gap-2">
                      <span style={{ color: C.emerald }}>✓</span>
                      <span className={p.highlight ? "text-[#3A4C49]" : "text-[#B8CBC6]"}>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Acceso */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="grid items-center gap-8 rounded-3xl border border-black/5 bg-white p-8 md:grid-cols-2 md:p-12">
          <div>
            <h2
              className="text-3xl md:text-4xl"
              style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
            >
              ¿Eres el dueño de un negocio?
            </h2>
            <p className="mt-3 max-w-md text-[#4A5C59]">
              Entra a tu panel para ver tus reseñas generadas, las quejas que
              interceptaste y los resúmenes de la semana.
            </p>
            <Link
              href="/admin/login"
              className="mt-6 inline-block rounded-full px-6 py-3 font-semibold text-white transition-transform active:scale-95"
              style={{ backgroundColor: C.ink }}
            >
              Entrar a mi panel
            </Link>
            <Link
              href="/demo/dashboard"
              className="ml-3 mt-6 inline-block rounded-full border px-6 py-3 font-semibold transition-transform active:scale-95"
              style={{ borderColor: C.ink, color: C.ink }}
            >
              Ver demo
            </Link>
          </div>
          <div
            className="rounded-2xl p-6 text-sm"
            style={{ backgroundColor: C.paper }}
          >
            <p className="font-semibold">¿Y los clientes?</p>
            <p className="mt-1 text-[#4A5C59]">
              No necesitan cuenta ni descargar nada. Solo escanean el QR de tu
              negocio y valoran. Cero fricción.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ backgroundColor: C.ink, color: "#8FA8A3" }}>
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-8 sm:flex-row">
          <span className="font-semibold" style={{ color: C.paper }}>
            Positiv<span style={{ color: C.emerald }}>IA</span>
          </span>
          <p className="text-sm">La IA que protege tu reputación antes de que sea tarde.</p>
        </div>
      </footer>
    </div>
  );
}
