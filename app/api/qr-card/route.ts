import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { getDemoBusiness } from "@/lib/demo";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

function xml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export async function GET(req: NextRequest) {
  try {
    const slug = req.nextUrl.searchParams.get("slug");
    const download = req.nextUrl.searchParams.get("download") === "1";
    if (!slug) {
      return NextResponse.json({ error: "slug requerido" }, { status: 400 });
    }

    const demo = getDemoBusiness(slug);
    const business =
      demo ??
      (
        await supabaseAdmin()
          .from("businesses")
          .select("name, slug, color_primary")
          .eq("slug", slug)
          .maybeSingle()
      ).data;

    if (!business) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    }

    const base =
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || req.nextUrl.origin;
    const target = `${base}/r/${business.slug}`;
    const brand = business.color_primary ?? "#24A66D";
    const qr = await QRCode.toDataURL(target, {
      width: 760,
      margin: 2,
      errorCorrectionLevel: "H",
      color: { dark: "#203126", light: "#FFFFFF" },
    });
    const name = xml(business.name);
    const url = xml(target.replace(/^https?:\/\//, ""));

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1240" height="1748" viewBox="0 0 1240 1748" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="1240" height="1748" rx="56" fill="#FFF8E7"/>
  <rect x="58" y="58" width="1124" height="1632" rx="44" fill="#FFFFFF" stroke="#F4D7A2" stroke-width="6"/>
  <rect x="96" y="96" width="1048" height="412" rx="36" fill="${xml(brand)}"/>
  <circle cx="1030" cy="180" r="110" fill="#FFE07A" opacity="0.7"/>
  <circle cx="165" cy="430" r="86" fill="#FF7D66" opacity="0.42"/>
  <text x="144" y="184" fill="#FFFFFF" font-size="34" font-family="Arial, sans-serif" font-weight="700" letter-spacing="6">TU OPINION NOS AYUDA</text>
  <text x="144" y="294" fill="#FFFFFF" font-size="76" font-family="Arial, sans-serif" font-weight="900">${name}</text>
  <text x="144" y="372" fill="#FFFFFF" font-size="42" font-family="Arial, sans-serif" font-weight="700">Escanea y dinos como fue tu visita</text>
  <text x="144" y="432" fill="#FFFFFF" font-size="28" font-family="Arial, sans-serif" opacity="0.92">Sin registrarte. En menos de 20 segundos.</text>
  <rect x="230" y="580" width="780" height="780" rx="42" fill="#FFFFFF" stroke="#203126" stroke-width="10"/>
  <image x="270" y="620" width="700" height="700" href="${qr}"/>
  <rect x="178" y="1420" width="884" height="128" rx="32" fill="#EAF9EF"/>
  <text x="620" y="1474" text-anchor="middle" fill="#1F7A4E" font-size="34" font-family="Arial, sans-serif" font-weight="900">Toca una estrella y listo</text>
  <text x="620" y="1522" text-anchor="middle" fill="#337257" font-size="26" font-family="Arial, sans-serif">Si algo fallo, llega privado al responsable.</text>
  <text x="620" y="1626" text-anchor="middle" fill="#8A6B3E" font-size="24" font-family="Arial, sans-serif">${url}</text>
</svg>`;

    return new NextResponse(svg, {
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
        ...(download
          ? { "Content-Disposition": `attachment; filename="qr-cartel-${business.slug}.svg"` }
          : {}),
      },
    });
  } catch (err) {
    console.error("[qr-card] error:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
