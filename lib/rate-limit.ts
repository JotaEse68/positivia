import { NextRequest } from "next/server";

// Limitador en memoria por instancia: primera barrera contra abuso en
// endpoints públicos sin sesión. No es distribuido (cada instancia de
// Fluid Compute tiene su propio mapa), pero sí frena scripts/bots que
// machacan un mismo endpoint desde una IP mientras esa instancia vive.
const hits = new Map<string, number[]>();

export function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  recent.push(now);
  hits.set(key, recent);
  return recent.length > limit;
}

export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
