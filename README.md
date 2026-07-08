# PositivIA

**La IA que protege tu reputación antes de que sea tarde.**

SaaS multi-tenant de gestión de reputación online para restaurantes y negocios
locales. Un cliente = una fila en base de datos, nunca un deploy aparte.

## Cómo funciona

1. El cliente final escanea un **QR** (mesa, ticket, packaging) al terminar su visita.
2. Puntúa de **1 a 5 estrellas** en una página sin fricción (sin registro).
3. **4-5★** → redirección inmediata a la reseña de Google del negocio.
4. **1-3★** → **nunca llega a Google**: se abre un formulario privado y el dueño
   recibe la queja por WhatsApp/email en segundos.

La bifurcación en tiempo real según el rating es el producto: un QR estático
manda a todo el mundo al mismo sitio; PositivIA decide.

## Planes

| Plan | Precio | Incluye |
|---|---|---|
| **Starter** | 29€/mes | 1 local, QR ilimitados, filtrado por rating, alerta por email, panel básico |
| **Pro** | 49€/mes | + WhatsApp instantáneo, resumen semanal con IA, respuesta sugerida por IA, clasificación de urgencia, branding propio |
| **Local adicional** | +19-29€/mes | + comparativa entre locales y detección de patrones cruzados |

---

## Dar de alta un cliente nuevo (sin tocar código)

Todo se hace desde el **panel superadmin**, protegido por el email definido en
`SUPERADMIN_EMAIL`.

1. Entra en **`/admin/login`** e inicia sesión con el email superadmin
   (recibirás un enlace mágico por correo — no hay contraseña).
2. Ve a **`/superadmin`** → **+ Nuevo cliente**.
3. Rellena: nombre, *slug* (la URL, ej. `bar-pepe`), color de marca, logo
   (opcional, se sube solo), link de reseña de Google, WhatsApp y/o email del
   dueño, y el plan. Si es un local de una cadena, selecciónalo en "Local de…".
4. Al guardar, el cliente queda creado en estado **prueba**. Cámbialo a
   **activo** cuando empiece a pagar (desplegable de estado en la lista).

### Generar el QR para imprimir

1. En `/superadmin`, abre la ficha del cliente (**Ver QR**).
2. Pulsa **⬇ Descargar PNG (alta resolución)** — 1024px, listo para imprimir en
   ticket, mesa o packaging.
3. El QR apunta a `https://[tu-dominio]/r/[slug]`. No caduca: si cambias datos
   del negocio, el mismo QR sigue funcionando.

### Dar acceso al dueño a su panel

El dueño accede a **`/admin/login`** con su email. Verá su dashboard con los
KPIs (reseñas públicas generadas vs quejas interceptadas), la lista de quejas
con la respuesta sugerida por IA (Pro) y los resúmenes semanales.

> Para que el dueño vea sus datos hay que vincular su usuario al negocio en la
> tabla `admin_users` (`business_id` + `auth_user_id`). El alta de ese vínculo
> se hace tras su primer login.

---

## Desarrollo

```bash
npm install
cp .env.example .env.local   # rellena las variables
npm run dev                  # http://localhost:3000
```

Variables de entorno: ver **`.env.example`**. Mínimo para arrancar: las 3 de
Supabase + `SUPERADMIN_EMAIL`. Las de Twilio/Resend/Anthropic degradan limpio
si faltan (el sistema no rompe, solo desactiva ese canal/feature).

### Base de datos

El esquema completo está en **`supabase/schema.sql`** (tablas + RLS). Ejecútalo
una vez en el SQL Editor de Supabase. El bucket público `logos` para los logos
de los negocios se crea aparte (ver comentarios del panel superadmin).

## Stack

Next.js 14 (App Router) · TypeScript · Supabase (Postgres + Auth + RLS) ·
Tailwind CSS · Anthropic (Claude Haiku) · Twilio / Resend · Vercel.

## Arquitectura

```
app/
  r/[slug]           landing pública de valoración (destino del QR)
  admin/             panel del dueño (auth magic link, guard por middleware)
  superadmin/        gestión global de clientes (gate por SUPERADMIN_EMAIL)
  api/
    feedback         recibe rating y decide el routing
    notify           alerta al dueño (WhatsApp → email)
    ai-*             clasificación, respuesta sugerida y resumen (Pro)
    complaint/*      acciones del dueño sobre sus quejas (RLS)
    superadmin/*     alta y gestión de clientes (solo superadmin)
    qr               genera el PNG del QR
lib/                 wrappers de Supabase, Anthropic, WhatsApp, email
```

**Seguridad:** RLS aísla los datos entre negocios; el dueño solo ve/edita el
feedback de los suyos. Ninguna respuesta de IA se envía automáticamente sin
aprobación humana. Las claves secretas viven solo en el servidor.
