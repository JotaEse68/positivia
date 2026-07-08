import { NextRequest } from "next/server";

export function isAuthorizedCronRequest(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";

  const header = req.headers.get("authorization") ?? "";
  return header === `Bearer ${secret}`;
}
