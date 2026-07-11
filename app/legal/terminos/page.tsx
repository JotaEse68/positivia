import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Términos y condiciones — PositivIA",
  robots: { index: true },
};

export default function TerminosPage() {
  return (
    <main className="min-h-screen bg-[#FFF9EA] px-4 py-10 text-[#102D2A]">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="text-sm font-bold text-[#27765B] underline">
          ← Volver
        </Link>

        <h1 className="mt-4 text-3xl font-black tracking-tight">
          Términos y condiciones
        </h1>
        <p className="mt-2 text-sm text-[#53655E]">
          Última actualización: [PENDIENTE REVISIÓN LEGAL — fecha]
        </p>

        <div className="mt-8 space-y-6 text-sm leading-6 text-[#243126]">
          <section>
            <h2 className="text-lg font-black">1. Quiénes somos</h2>
            <p className="mt-2">
              PositivIA es un servicio de [PENDIENTE REVISIÓN LEGAL — razón social,
              NIF, domicilio] que ofrece a negocios locales una herramienta de gestión
              de reputación mediante un enlace/QR de valoración.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-black">2. El servicio</h2>
            <p className="mt-2">
              PositivIA permite a un negocio recoger valoraciones de sus clientes
              finales: si la experiencia fue positiva, se invita a publicar en Google;
              si no lo fue, el comentario llega en privado al negocio para que pueda
              resolverlo antes de una reseña pública. Ninguna respuesta de IA se envía
              al cliente final sin aprobación humana del negocio.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-black">3. Planes y facturación</h2>
            <p className="mt-2">
              El acceso a PositivIA se contrata mediante un plan de suscripción
              mensual. Los precios vigentes se muestran en el momento de la
              contratación. [PENDIENTE REVISIÓN LEGAL — condiciones de cancelación,
              renovación y reembolsos].
            </p>
          </section>

          <section>
            <h2 className="text-lg font-black">4. Responsabilidades del negocio</h2>
            <p className="mt-2">
              El negocio que contrata PositivIA es responsable del contenido que
              publica (nombre, logo, enlace de Google, mensajes) y de dar respuesta
              adecuada a las valoraciones privadas que reciba de sus clientes finales.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-black">5. Protección de datos</h2>
            <p className="mt-2">
              El tratamiento de datos personales se describe en nuestra{" "}
              <Link href="/legal/privacidad" className="font-bold text-[#27765B] underline">
                política de privacidad
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="text-lg font-black">6. Limitación de responsabilidad</h2>
            <p className="mt-2">
              [PENDIENTE REVISIÓN LEGAL — límites de responsabilidad, disponibilidad
              del servicio, fuerza mayor].
            </p>
          </section>

          <section>
            <h2 className="text-lg font-black">7. Contacto</h2>
            <p className="mt-2">
              Para cualquier consulta sobre estos términos, escribe a
              [PENDIENTE REVISIÓN LEGAL — email de contacto].
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
