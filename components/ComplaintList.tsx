"use client";

import { useState } from "react";

type Complaint = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  ai_urgency: "low" | "medium" | "high" | null;
  ai_summary_theme: string | null;
  suggested_reply: string | null;
  reply_sent: boolean;
};

const urgencyStyle: Record<string, string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-neutral-100 text-neutral-600",
};
const urgencyLabel: Record<string, string> = {
  high: "Urgente",
  medium: "Media",
  low: "Baja",
};

function ComplaintCard({ initial, isPro }: { initial: Complaint; isPro: boolean }) {
  const [c, setC] = useState(initial);
  const [reply, setReply] = useState(initial.suggested_reply ?? "");
  const [busy, setBusy] = useState<null | "gen" | "save">(null);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setBusy("gen");
    setError(null);
    try {
      const res = await fetch("/api/ai-suggest-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedbackId: c.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "error");
      setReply(data.suggested_reply);
      setC({ ...c, suggested_reply: data.suggested_reply });
    } catch (e) {
      setError(e instanceof Error && e.message === "ai_not_configured"
        ? "IA no configurada"
        : "No se pudo generar");
    } finally {
      setBusy(null);
    }
  }

  async function resolve() {
    setBusy("save");
    setError(null);
    try {
      const res = await fetch("/api/complaint/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedbackId: c.id, reply }),
      });
      if (!res.ok) throw new Error();
      setC({ ...c, reply_sent: true, suggested_reply: reply });
    } catch {
      setError("No se pudo guardar");
    } finally {
      setBusy(null);
    }
  }

  const when = new Date(c.created_at).toLocaleString("es-ES", {
    dateStyle: "short",
    timeStyle: "short",
  });

  return (
    <div className="rounded-2xl border bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-lg text-amber-500">
            {"★".repeat(c.rating)}
            <span className="text-neutral-300">{"★".repeat(5 - c.rating)}</span>
          </span>
          <p className="mt-1 text-xs text-neutral-400">{when}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          {isPro && c.ai_urgency && (
            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${urgencyStyle[c.ai_urgency]}`}>
              {urgencyLabel[c.ai_urgency]}
            </span>
          )}
          {c.reply_sent && (
            <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
              Gestionada
            </span>
          )}
        </div>
      </div>

      <p className="mt-3 text-neutral-800">{c.comment || "(sin comentario)"}</p>
      {isPro && c.ai_summary_theme && (
        <p className="mt-1 text-xs text-neutral-400">Tema: {c.ai_summary_theme}</p>
      )}

      {isPro && (
        <div className="mt-4 border-t pt-4">
          {reply || busy === "gen" ? (
            <>
              <label className="text-xs font-medium text-neutral-500">
                Respuesta sugerida (revisa y edita antes de usarla)
              </label>
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                rows={4}
                className="mt-1 w-full rounded-xl border border-neutral-300 p-3 text-sm focus:border-green-500 focus:outline-none"
              />
            </>
          ) : (
            <button
              onClick={generate}
              disabled={busy !== null}
              className="rounded-lg border border-green-500 px-3 py-1.5 text-sm font-medium text-green-700 hover:bg-green-50 disabled:opacity-60"
            >
              ✨ Generar respuesta con IA
            </button>
          )}

          <div className="mt-3 flex items-center gap-2">
            {reply && (
              <>
                <button
                  onClick={generate}
                  disabled={busy !== null}
                  className="rounded-lg border px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-50 disabled:opacity-60"
                >
                  {busy === "gen" ? "Generando…" : "Regenerar"}
                </button>
                {!c.reply_sent && (
                  <button
                    onClick={resolve}
                    disabled={busy !== null}
                    className="rounded-lg bg-green-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-green-600 disabled:opacity-60"
                  >
                    {busy === "save" ? "Guardando…" : "Marcar como gestionada"}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {!isPro && !c.reply_sent && (
        <div className="mt-4 border-t pt-4">
          <button
            onClick={resolve}
            disabled={busy !== null}
            className="rounded-lg bg-green-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-green-600 disabled:opacity-60"
          >
            {busy === "save" ? "Guardando…" : "Marcar como gestionada"}
          </button>
        </div>
      )}

      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
    </div>
  );
}

export default function ComplaintList({
  complaints,
  isPro,
}: {
  complaints: Complaint[];
  isPro: boolean;
}) {
  if (complaints.length === 0) {
    return (
      <p className="rounded-2xl border bg-white p-6 text-center text-neutral-500">
        No hay quejas registradas. 🎉
      </p>
    );
  }
  return (
    <div className="space-y-4">
      {complaints.map((c) => (
        <ComplaintCard key={c.id} initial={c} isPro={isPro} />
      ))}
    </div>
  );
}
