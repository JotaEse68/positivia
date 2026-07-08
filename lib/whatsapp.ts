// Wrapper de WhatsApp vía Twilio. Configurable por variables de entorno.
// Si faltan credenciales, la función devuelve { sent: false } sin lanzar,
// para que /api/notify pueda caer al fallback de email limpiamente.

type SendResult = { sent: boolean; error?: string };

export function whatsappConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_FROM_NUMBER
  );
}

// Normaliza a formato E.164 con canal whatsapp: (Twilio lo exige así).
function toWhatsAppAddr(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith("whatsapp:")) return trimmed;
  return `whatsapp:${trimmed}`;
}

export async function sendWhatsApp(to: string, body: string): Promise<SendResult> {
  if (!whatsappConfigured()) {
    return { sent: false, error: "whatsapp_not_configured" };
  }
  if (!to) {
    return { sent: false, error: "missing_recipient" };
  }

  const sid = process.env.TWILIO_ACCOUNT_SID!;
  const token = process.env.TWILIO_AUTH_TOKEN!;
  const from = process.env.TWILIO_FROM_NUMBER!;

  const params = new URLSearchParams({
    To: toWhatsAppAddr(to),
    From: toWhatsAppAddr(from),
    Body: body,
  });

  try {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization:
            "Basic " + Buffer.from(`${sid}:${token}`).toString("base64"),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      }
    );

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return { sent: false, error: `twilio_${res.status}: ${detail.slice(0, 200)}` };
    }
    return { sent: true };
  } catch (err) {
    return { sent: false, error: String(err) };
  }
}
