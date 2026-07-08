import Anthropic from "@anthropic-ai/sdk";

// Wrapper de llamadas a Claude. Se usa Haiku para clasificación y resumen
// (coste bajo por volumen). Todas las funciones degradan limpio si falta
// ANTHROPIC_API_KEY, para que las rutas puedan devolver un error controlado.

const MODEL = "claude-haiku-4-5";

export function anthropicConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

function client(): Anthropic {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

// Extrae el primer bloque de texto de la respuesta.
function firstText(msg: Anthropic.Message): string {
  for (const block of msg.content) {
    if (block.type === "text") return block.text;
  }
  return "";
}

export type Urgency = "low" | "medium" | "high";

// Clasifica la urgencia de una queja y detecta el tema principal.
// Usa structured outputs para garantizar JSON válido.
export async function classifyComplaint(
  comment: string
): Promise<{ urgency: Urgency; theme: string }> {
  const msg = await client().messages.create({
    model: MODEL,
    max_tokens: 256,
    system:
      "Eres el asistente de gestión de reputación de un negocio local. " +
      "Clasificas quejas de clientes por urgencia para que el dueño priorice. " +
      "Criterio de urgencia:\n" +
      "- high: riesgo de salud o seguridad (objeto extraño en la comida, " +
      "intoxicación, alergia no respetada, higiene grave, trato ofensivo grave).\n" +
      "- medium: problema real de servicio o producto (comida fría, sabor malo, " +
      "espera larga, error en el pedido, trato poco amable).\n" +
      "- low: molestia menor o subjetiva (precio, ruido, preferencias personales).\n" +
      "El 'theme' es una etiqueta corta (2-4 palabras) del tema, en español.",
    messages: [
      {
        role: "user",
        content: `Clasifica esta queja:\n\n"""${comment}"""`,
      },
    ],
    output_config: {
      format: {
        type: "json_schema",
        schema: {
          type: "object",
          properties: {
            urgency: { type: "string", enum: ["low", "medium", "high"] },
            theme: { type: "string" },
          },
          required: ["urgency", "theme"],
          additionalProperties: false,
        },
      },
    },
  });

  const parsed = JSON.parse(firstText(msg));
  return { urgency: parsed.urgency as Urgency, theme: String(parsed.theme).slice(0, 120) };
}

// Genera un borrador de respuesta empática a la queja, en el idioma del
// comentario original. NUNCA se envía sin aprobación humana del dueño.
export async function suggestReply(
  comment: string,
  businessName: string
): Promise<string> {
  const msg = await client().messages.create({
    model: MODEL,
    max_tokens: 512,
    system:
      `Eres el dueño de "${businessName}", un negocio local. Redactas un ` +
      "borrador de respuesta privada a la queja de un cliente. Tono: empático, " +
      "profesional, humano, breve (2-4 frases). Reconoce el problema, discúlpate " +
      "con sinceridad y ofrece una solución o invitación a volver. Responde en el " +
      "MISMO idioma que la queja. No inventes datos concretos (nombres, fechas, " +
      "compensaciones específicas) que no aparezcan en la queja. Devuelve solo el " +
      "texto de la respuesta, sin comillas ni encabezados.",
    messages: [
      {
        role: "user",
        content: `Queja del cliente:\n\n"""${comment}"""`,
      },
    ],
  });

  return firstText(msg).trim();
}

// Genera el resumen semanal en lenguaje natural a partir del feedback de los
// últimos 7 días. Devuelve el texto + el tema recurrente principal.
export async function summarizeWeek(input: {
  businessName: string;
  positive: number;
  negativeComments: string[];
}): Promise<{ summary: string; topTheme: string | null }> {
  const complaints = input.negativeComments.length
    ? input.negativeComments.map((c, i) => `${i + 1}. ${c}`).join("\n")
    : "(sin quejas esta semana)";

  const msg = await client().messages.create({
    model: MODEL,
    max_tokens: 512,
    system:
      "Eres el asistente de reputación de un negocio local. Redactas el resumen " +
      "semanal para el dueño. Sé concreto y accionable: no solo cuentes, detecta " +
      "PATRONES en las quejas (el tema que más se repite). Máximo 3 frases en el " +
      "'summary'. 'top_theme' es el patrón recurrente principal (etiqueta corta en " +
      "español) o null si no hay quejas. Responde en español.",
    messages: [
      {
        role: "user",
        content:
          `Negocio: ${input.businessName}\n` +
          `Reseñas positivas esta semana: ${input.positive}\n` +
          `Quejas privadas (${input.negativeComments.length}):\n${complaints}`,
      },
    ],
    output_config: {
      format: {
        type: "json_schema",
        schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            top_theme: { type: ["string", "null"] },
          },
          required: ["summary", "top_theme"],
          additionalProperties: false,
        },
      },
    },
  });

  const parsed = JSON.parse(firstText(msg));
  return {
    summary: String(parsed.summary).slice(0, 1000),
    topTheme: parsed.top_theme ? String(parsed.top_theme).slice(0, 120) : null,
  };
}
