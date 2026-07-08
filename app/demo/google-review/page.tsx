import Link from "next/link";
import { DEMO_SLUG, demoBusiness } from "@/lib/demo";

export default function DemoGoogleReviewPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-950 p-6 text-white">
      <section className="w-full max-w-md rounded-2xl border border-white/10 bg-white p-6 text-neutral-950">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-green-700">
          Simulación externa
        </p>
        <h1 className="mt-2 text-2xl font-bold">Reseña pública para {demoBusiness.name}</h1>
        <p className="mt-3 text-neutral-600">
          En un cliente real este paso abre el enlace de reseñas configurado para su
          ficha de Google. La demo lo mantiene dentro de PositivIA para poder enseñar
          el recorrido sin publicar nada.
        </p>
        <div className="mt-5 rounded-xl bg-amber-50 p-4 text-3xl text-amber-500">
          ★★★★★
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href="/demo/dashboard"
            className="rounded-lg bg-neutral-950 px-4 py-2 text-sm font-semibold text-white"
          >
            Ver panel
          </Link>
          <Link
            href={`/r/${DEMO_SLUG}`}
            className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-700"
          >
            Repetir QR
          </Link>
        </div>
      </section>
    </main>
  );
}
