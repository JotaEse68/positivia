type ChecklistBusiness = {
  id?: string;
  slug: string | null;
  google_review_link?: string | null;
  logo_url?: string | null;
  banner_url?: string | null;
  email_owner?: string | null;
  whatsapp_owner?: string | null;
};

export default function OnboardingChecklist({
  business,
  qrUrl,
}: {
  business: ChecklistBusiness;
  qrUrl?: string;
}) {
  const experienceHref = business.id
    ? `/admin/experience?b=${business.id}`
    : "/admin/onboarding";
  const url = qrUrl ?? (business.slug ? `/r/${business.slug}` : undefined);

  const items = [
    {
      label: "Completar el asistente de alta",
      done: Boolean(business.slug && business.google_review_link),
      href: "/admin/onboarding",
    },
    {
      label: "Añadir enlace de Google",
      done: Boolean(business.google_review_link),
      href: experienceHref,
    },
    {
      label: "Subir logo o banner",
      done: Boolean(business.logo_url || business.banner_url),
      href: experienceHref,
    },
    ...(url
      ? [
          {
            label: "Probar pantalla QR",
            done: false,
            href: url,
            external: true,
          },
        ]
      : []),
    ...(business.slug
      ? [
          {
            label: "Descargar cartel",
            done: false,
            href: `/api/qr-print?slug=${business.slug}&size=a4&layout=full`,
            external: true,
          },
        ]
      : []),
  ];

  return (
    <section className="rounded-2xl border border-[#203126]/10 bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-green-700">
        Puesta en marcha
      </p>
      <h2 className="mt-1 text-lg font-black text-neutral-950">
        Checklist antes de entregar al cliente
      </h2>
      <div className="mt-4 grid gap-2">
        {items.map((item) => {
          const content = (
            <>
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-black ${
                  item.done ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                }`}
              >
                {item.done ? "✓" : "•"}
              </span>
              <span className="text-sm font-bold text-neutral-800">{item.label}</span>
            </>
          );

          return item.external ? (
            <a
              key={item.label}
              href={item.href}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 rounded-xl border border-neutral-200 px-3 py-2 hover:bg-neutral-50"
            >
              {content}
            </a>
          ) : (
            <a
              key={item.label}
              href={item.href}
              className="flex items-center gap-3 rounded-xl border border-neutral-200 px-3 py-2 hover:bg-neutral-50"
            >
              {content}
            </a>
          );
        })}
      </div>
    </section>
  );
}
