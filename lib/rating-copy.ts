export type RatingCopy = {
  visual_theme: string;
  logo_display: string;
  incentive_text: string;
  issue_options: string;
  positive_redirect_title: string;
  positive_redirect_body: string;
  private_prompt_title: string;
  private_prompt_body: string;
  private_submit_label: string;
  private_thanks_title: string;
  private_thanks_body: string;
  recovery_hint: string;
  appreciation_note: string;
  reward_enabled: boolean;
  reward_text: string;
};

export const defaultRatingCopy: RatingCopy = {
  visual_theme: "sunrise",
  logo_display: "large",
  incentive_text: "",
  issue_options:
    "Producto o servicio\nAtención recibida\nTiempos de espera\nLimpieza / ambiente\nOtra cosa",
  positive_redirect_title: "¡Qué alegría leer eso!",
  positive_redirect_body:
    "Te abrimos Google por si quieres compartirlo. Gracias por apoyar al negocio.",
  private_prompt_title: "Danos una oportunidad para arreglarlo",
  private_prompt_body:
    "Cuéntanos qué ha pasado y lo enviaremos a la persona adecuada. No se publica en Google ni en ningún sitio.",
  private_submit_label: "Enviar para que lo solucionen",
  private_thanks_title: "Gracias por avisarnos",
  private_thanks_body:
    "Tu mensaje ya va camino de la persona adecuada. Prometemos revisarlo y trabajar para solucionarlo.",
  recovery_hint:
    "Si quieres hablar con un encargado, puedes dejar tu teléfono o email y te contactarán.",
  appreciation_note: "Hecho con PositivIA para escuchar mejor",
  reward_enabled: false,
  reward_text: "",
};

export function normalizeRatingCopy(copy?: Partial<RatingCopy> | null): RatingCopy {
  const visualTheme = copy?.visual_theme?.trim();
  const logoDisplay = copy?.logo_display?.trim();

  return {
    visual_theme:
      visualTheme === "sunrise" || visualTheme === "hope" || visualTheme === "coral"
        ? visualTheme
        : defaultRatingCopy.visual_theme,
    logo_display:
      logoDisplay === "large" || logoDisplay === "compact"
        ? logoDisplay
        : defaultRatingCopy.logo_display,
    incentive_text: copy?.incentive_text?.trim() || defaultRatingCopy.incentive_text,
    issue_options: copy?.issue_options?.trim() || defaultRatingCopy.issue_options,
    positive_redirect_title:
      copy?.positive_redirect_title?.trim() ||
      defaultRatingCopy.positive_redirect_title,
    positive_redirect_body:
      copy?.positive_redirect_body?.trim() || defaultRatingCopy.positive_redirect_body,
    private_prompt_title:
      copy?.private_prompt_title?.trim() || defaultRatingCopy.private_prompt_title,
    private_prompt_body:
      copy?.private_prompt_body?.trim() || defaultRatingCopy.private_prompt_body,
    private_submit_label:
      copy?.private_submit_label?.trim() || defaultRatingCopy.private_submit_label,
    private_thanks_title:
      copy?.private_thanks_title?.trim() || defaultRatingCopy.private_thanks_title,
    private_thanks_body:
      copy?.private_thanks_body?.trim() || defaultRatingCopy.private_thanks_body,
    recovery_hint: copy?.recovery_hint?.trim() || defaultRatingCopy.recovery_hint,
    appreciation_note:
      copy?.appreciation_note?.trim() || defaultRatingCopy.appreciation_note,
    reward_enabled: Boolean(copy?.reward_enabled) && Boolean(copy?.reward_text?.trim()),
    reward_text: copy?.reward_text?.trim() || defaultRatingCopy.reward_text,
  };
}
