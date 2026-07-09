"use client";

import { useState } from "react";

export default function TestNotificationButton({
  businessId,
}: {
  businessId: string;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function sendTest() {
    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/superadmin/test-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId }),
      });
      const data = await res.json();
      if (!res.ok || data.ok === false) {
        throw new Error(data.error || "No se pudo enviar la prueba");
      }
      setMessage(
        data.channel === "whatsapp"
          ? "Prueba enviada por WhatsApp."
          : "Prueba enviada por email."
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar la prueba");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={sendTest}
        disabled={busy}
        className="w-full rounded-lg bg-[#203126] px-4 py-2 text-sm font-black text-white disabled:opacity-60"
      >
        {busy ? "Enviando prueba..." : "Probar aviso al encargado"}
      </button>
      {message && <p className="mt-2 text-sm font-bold text-green-700">{message}</p>}
      {error && <p className="mt-2 text-sm font-bold text-red-600">{error}</p>}
    </div>
  );
}
