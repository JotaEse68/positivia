"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  id: string;
  plan: "starter" | "pro";
  planStatus: "trial" | "active" | "cancelled";
};

// Controles inline para cambiar plan y estado de un cliente (solo superadmin).
export default function ClientStatusControls({ id, plan, planStatus }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function update(patch: { plan?: string; plan_status?: string }) {
    setBusy(true);
    try {
      await fetch("/api/superadmin/clients", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...patch }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const sel =
    "rounded-lg border px-2 py-1 text-xs disabled:opacity-50 focus:outline-none";

  return (
    <div className="flex items-center gap-2">
      <select
        value={plan}
        disabled={busy}
        onChange={(e) => update({ plan: e.target.value })}
        className={sel}
      >
        <option value="starter">Starter</option>
        <option value="pro">Pro</option>
      </select>
      <select
        value={planStatus}
        disabled={busy}
        onChange={(e) => update({ plan_status: e.target.value })}
        className={sel}
      >
        <option value="trial">Prueba</option>
        <option value="active">Activo</option>
        <option value="cancelled">Cancelado</option>
      </select>
    </div>
  );
}
