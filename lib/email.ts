// Wrapper de email vía Resend. Fallback cuando no hay WhatsApp configurado
// o cuando el negocio no tiene whatsapp_owner.

type SendResult = { sent: boolean; error?: string };

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

// Remitente por defecto. Se puede sobreescribir con RESEND_FROM.
const FROM = process.env.RESEND_FROM ?? "PositivIA <alertas@positivia.app>";

export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<SendResult> {
  if (!emailConfigured()) {
    return { sent: false, error: "email_not_configured" };
  }
  if (!to) {
    return { sent: false, error: "missing_recipient" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM, to, subject, html }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return { sent: false, error: `resend_${res.status}: ${detail.slice(0, 200)}` };
    }
    return { sent: true };
  } catch (err) {
    return { sent: false, error: String(err) };
  }
}
