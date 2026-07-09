import Link from "next/link";
import { Fraunces, Schibsted_Grotesk } from "next/font/google";

const display = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
});
const body = Schibsted_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
});

const C = {
  ink: "#102D2A",
  moss: "#27765B",
  sun: "#F6C64E",
  coral: "#EF735C",
  mint: "#DDF6DF",
  paper: "#FFF9EA",
  blush: "#FFE1D5",
};

const primaryCards = [
  {
    title: "Superadmin",
    text: "Crear negocios, entrar a sus paneles, revisar quejas y descargar kits.",
    href: "/superadmin",
    cta: "Abrir control central",
    accent: C.sun,
  },
  {
    title: "Panel cliente",
    text: "Ver reseñas privadas, ajustar marca, premios, mensajes y QR.",
    href: "/admin/dashboard",
    cta: "Entrar como cliente",
    accent: C.moss,
  },
  {
    title: "Demo vendible",
    text: "Restaurante, hotel y servicios sin tocar datos reales.",
    href: "/demo",
    cta: "Enseñar la demo",
    accent: C.coral,
  },
  {
    title: "QR demo",
    text: "Abrir la experiencia exacta que verá un cliente final.",
    href: "/r/demo-restaurante",
    cta: "Probar QR público",
    accent: "#77CFA4",
  },
];

const quickLinks = [
  { label: "Configurar QR", href: "/admin/experience" },
  { label: "Cuenta y contraseña", href: "/admin/account" },
  { label: "Demo panel", href: "/demo/dashboard" },
  { label: "Landing comercial", href: "https://iapacks.com/positivia/" },
];

export default function Home() {
  return (
    <main
      className={`${display.variable} ${body.variable} min-h-screen overflow-hidden bg-[#FFF9EA] text-[#102D2A]`}
      style={{ fontFamily: "var(--font-body)" }}
    >
      <section className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        <div className="absolute inset-x-0 top-0 h-3 bg-[linear-gradient(90deg,#F6C64E,#EF735C,#77CFA4,#27765B)]" />

        <header className="flex flex-col gap-4 rounded-[28px] border border-[#102D2A]/10 bg-white/70 p-4 shadow-[0_20px_80px_rgba(25,55,42,0.08)] backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#102D2A] text-lg font-black text-[#F6C64E]">
              P
            </span>
            <span>
              <span className="block text-xl font-black tracking-tight">PositivIA</span>
              <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-[#27765B]">
                Centro de mando
              </span>
            </span>
          </Link>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/superadmin"
              className="rounded-full bg-[#102D2A] px-4 py-2 text-sm font-bold text-white transition hover:-translate-y-0.5"
            >
              Superadmin
            </Link>
            <Link
              href="/admin/dashboard"
              className="rounded-full border border-[#102D2A]/15 bg-white px-4 py-2 text-sm font-bold transition hover:-translate-y-0.5"
            >
              Cliente
            </Link>
          </div>
        </header>

        <div className="grid flex-1 gap-7 py-7 lg:grid-cols-[0.9fr_1.1fr] lg:items-stretch">
          <section className="flex min-h-[420px] flex-col justify-between rounded-[36px] bg-[#102D2A] p-6 text-white shadow-[0_30px_100px_rgba(16,45,42,0.24)] sm:p-8 lg:p-10">
            <div>
              <p className="inline-flex rounded-full bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#F6C64E]">
                Ya no es landing
              </p>
              <h1
                className="mt-6 max-w-xl text-4xl font-semibold leading-[0.98] tracking-tight sm:text-5xl lg:text-6xl"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Entra, enseña, configura o prueba.
              </h1>
              <p className="mt-5 max-w-lg text-base leading-7 text-[#D7E8DD] sm:text-lg">
                La venta vive en IAPacks. Esta puerta es para trabajar: crear clientes,
                abrir el QR, enseñar la demo y llegar rápido a cada panel.
              </p>
            </div>

            <div className="mt-10 grid gap-3 rounded-[28px] bg-white/8 p-4">
              <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
                <span className="text-sm font-semibold text-[#D7E8DD]">Flujo recomendado</span>
                <span className="rounded-full bg-[#F6C64E] px-3 py-1 text-xs font-black text-[#33240A]">
                  4 pasos
                </span>
              </div>
              {["Crear cliente", "Subir logo y Google", "Imprimir QR", "Probar reseña"].map(
                (step, index) => (
                  <div key={step} className="flex items-center gap-3 text-sm text-white">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/10 font-black text-[#F6C64E]">
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </div>
                ),
              )}
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2">
            {primaryCards.map((card) => (
              <Link
                key={card.title}
                href={card.href}
                className="group flex min-h-[210px] flex-col justify-between rounded-[28px] border border-[#102D2A]/10 bg-white p-5 shadow-[0_20px_70px_rgba(39,66,48,0.08)] transition hover:-translate-y-1 hover:shadow-[0_28px_80px_rgba(39,66,48,0.14)] sm:p-6"
              >
                <div>
                  <span
                    className="mb-5 block h-3 w-16 rounded-full"
                    style={{ backgroundColor: card.accent }}
                  />
                  <h2 className="text-2xl font-black tracking-tight">{card.title}</h2>
                  <p className="mt-3 max-w-sm text-sm leading-6 text-[#53655E]">{card.text}</p>
                </div>
                <span className="mt-6 inline-flex items-center justify-between gap-3 rounded-2xl bg-[#F6F0DF] px-4 py-3 text-sm font-black text-[#102D2A]">
                  {card.cta}
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-white transition group-hover:translate-x-1">
                    →
                  </span>
                </span>
              </Link>
            ))}
          </section>
        </div>

        <section className="grid gap-4 pb-4 lg:grid-cols-[1fr_1.6fr]">
          <div className="rounded-[28px] border border-[#102D2A]/10 bg-[#DDF6DF] p-5">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-[#27765B]">
              Cliente final
            </p>
            <p className="mt-2 text-2xl font-black">Sin cuenta. Sin descarga. Sin lío.</p>
            <p className="mt-2 text-sm leading-6 text-[#3D5D4C]">
              El que deja la reseña solo toca una estrella. Si está contento, Google.
              Si algo falló, lo escucha el negocio antes.
            </p>
          </div>

          <div className="rounded-[28px] border border-[#102D2A]/10 bg-white p-5">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-[#EF735C]">
              Atajos útiles
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {quickLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-2xl border border-[#102D2A]/10 bg-[#FFF9EA] px-4 py-3 text-sm font-bold transition hover:border-[#27765B] hover:bg-white"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
