export const DEMO_SLUG = "demo-restaurante";

export type DemoBusiness = {
  id: string;
  slug: string;
  name: string;
  logo_url: string | null;
  color_primary: string;
  google_review_link: string;
  plan_status: "active";
  plan: "pro";
};

export type DemoFeedback = {
  id: string;
  rating: number;
  comment: string | null;
  status: "public_redirected" | "private_captured";
  ai_urgency: "low" | "medium" | "high" | null;
  ai_summary_theme: string | null;
  suggested_reply: string | null;
  reply_sent: boolean;
  created_at: string;
};

export const demoBusiness: DemoBusiness = {
  id: "demo-business",
  slug: DEMO_SLUG,
  name: "Casa Demo",
  logo_url: null,
  color_primary: "#17936B",
  google_review_link: "/demo/google-review",
  plan_status: "active",
  plan: "pro",
};

export const demoFeedback: DemoFeedback[] = [
  {
    id: "demo-1",
    rating: 2,
    comment:
      "Tardaron mucho en traer la cuenta y la hamburguesa llegó fría. Me dio rabia porque el sitio me gusta.",
    status: "private_captured",
    ai_urgency: "medium",
    ai_summary_theme: "espera y temperatura",
    suggested_reply:
      "Gracias por avisarnos. Sentimos mucho la espera y que la comida no llegara como debía. Vamos a revisarlo con cocina y sala para que no vuelva a pasar; si nos das otra oportunidad, queremos cuidarla mejor.",
    reply_sent: false,
    created_at: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
  },
  {
    id: "demo-2",
    rating: 5,
    comment: null,
    status: "public_redirected",
    ai_urgency: null,
    ai_summary_theme: null,
    suggested_reply: null,
    reply_sent: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    id: "demo-3",
    rating: 1,
    comment: "El baño estaba bastante sucio a primera hora de la noche.",
    status: "private_captured",
    ai_urgency: "high",
    ai_summary_theme: "limpieza",
    suggested_reply:
      "Gracias por decírnoslo con claridad. Tienes razón: la limpieza no puede fallar. Vamos a reforzar las revisiones durante el servicio para que esto no se repita.",
    reply_sent: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
  },
  {
    id: "demo-4",
    rating: 4,
    comment: null,
    status: "public_redirected",
    ai_urgency: null,
    ai_summary_theme: null,
    suggested_reply: null,
    reply_sent: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
  },
];

export const demoWeeklySummary = {
  id: "demo-summary-1",
  week_start: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
  week_end: new Date().toISOString(),
  summary_text:
    "La semana va bien en volumen de reseñas, pero aparecen dos señales operativas: tiempos de espera y limpieza de baños durante el pico de servicio. Prioridad recomendada: revisión de turnos y checklist visible para sala.",
  top_theme: "operativa de sala",
  positive_count: 2,
  negative_count: 2,
};

export function isDemoSlug(slug: string | null | undefined): boolean {
  return slug === DEMO_SLUG || slug === "demo";
}

export function getDemoBusiness(slug: string): DemoBusiness | null {
  if (!isDemoSlug(slug)) return null;
  return demoBusiness;
}
