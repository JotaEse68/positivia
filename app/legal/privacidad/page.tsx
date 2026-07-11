import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de privacidad — PositivIA",
  robots: { index: true },
};

export default function PrivacidadPage() {
  return (
    <main className="min-h-screen bg-[#FFF9EA] px-4 py-10 text-[#102D2A]">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="text-sm font-bold text-[#27765B] underline">
          ← Volver
        </Link>

        <h1 className="mt-4 text-3xl font-black tracking-tight">Política de privacidad</h1>
        <p className="mt-2 text-sm text-[#53655E]">
          Última actualización: [PENDIENTE REVISIÓN LEGAL — fecha]
        </p>

        <div className="mt-8 space-y-6 text-sm leading-6 text-[#243126]">
          <section>
            <h2 className="text-lg font-black">1. Responsable del tratamiento</h2>
            <p className="mt-2">
              [PENDIENTE REVISIÓN LEGAL — razón social, NIF, domicilio y datos de
              contacto del responsable de PositivIA].
            </p>
          </section>

          <section>
            <h2 className="text-lg font-black">2. Qué datos tratamos</h2>
            <p className="mt-2">
              Según cómo uses PositivIA, podemos tratar: datos de cuenta del negocio
              (nombre, email, teléfono del dueño o administrador), y datos que el
              cliente final introduce voluntariamente al valorar una experiencia
              (comentario, categorías del incidente y, si lo facilita, un teléfono,
              WhatsApp o email de contacto para que el negocio pueda responderle).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-black">3. Finalidad</h2>
            <p className="mt-2">
              Gestionar la relación con el negocio cliente de PositivIA, permitir que
              recoja y gestione la valoración de sus propios clientes finales, y
              enviar alertas y resúmenes al negocio sobre esas valoraciones.
              Ninguna respuesta automática se envía al cliente final sin aprobación
              humana del negocio.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-black">4. Base legal</h2>
            <p className="mt-2">
              [PENDIENTE REVISIÓN LEGAL — ejecución de contrato con el negocio cliente;
              consentimiento del cliente final al enviar su valoración; interés
              legítimo en la prevención de reseñas negativas públicas sin posibilidad
              de respuesta previa].
            </p>
          </section>

          <section>
            <h2 className="text-lg font-black">5. Encargado y responsable</h2>
            <p className="mt-2">
              PositivIA actúa como <strong>encargado del tratamiento</strong> de los
              datos que el cliente final introduce en la página de valoración; el
              <strong> negocio</strong> (el comercio que usa PositivIA) es el
              <strong> responsable</strong> de esos datos frente a sus propios
              clientes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-black">6. Conservación</h2>
            <p className="mt-2">
              [PENDIENTE REVISIÓN LEGAL — plazo de conservación de valoraciones y
              datos de contacto].
            </p>
          </section>

          <section>
            <h2 className="text-lg font-black">7. Tus derechos (RGPD)</h2>
            <p className="mt-2">
              Puedes ejercer tus derechos de acceso, rectificación, supresión,
              oposición, limitación y portabilidad. Si tu valoración fue a través de
              un negocio concreto, dirígete primero a ese negocio (es el responsable
              de tus datos). Para cuestiones relativas a PositivIA como encargado,
              escribe a [PENDIENTE REVISIÓN LEGAL — email de contacto].
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
