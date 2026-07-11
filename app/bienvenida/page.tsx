import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pago recibido — PositivIA",
  robots: { index: false },
};

export default function BienvenidaPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FFF9EA] px-4 py-10 text-[#102D2A]">
      <div className="max-w-md rounded-[28px] border border-[#102D2A]/10 bg-white p-8 text-center shadow-[0_20px_70px_rgba(39,66,48,0.08)]">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#EAF9EF] text-3xl">
          ✓
        </div>
        <h1 className="text-2xl font-black tracking-tight">Pago recibido</h1>
        <p className="mt-3 text-sm leading-6 text-[#53655E]">
          Te hemos enviado un email con un enlace de acceso para entrar y configurar
          tu negocio. Revisa tu bandeja de entrada (y spam, por si acaso).
        </p>
      </div>
    </main>
  );
}
