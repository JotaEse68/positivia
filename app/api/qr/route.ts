import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { getDemoBusiness } from "@/lib/demo";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// Genera el PNG del QR de un negocio, apuntando a la landing pública
// /r/[slug]. Alta resolución (apto para imprimir en ticket). Valida que el
// slug exista para no generar QR de negocios inexistentes.
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
          .select("slug")
          .eq("slug", slug)
          .maybeSingle()
      ).data;

    if (!business) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    }

    const base =
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || req.nextUrl.origin;
    const target = `${base}/r/${slug}`;

    const png = await QRCode.toBuffer(target, {
      type: "png",
      width: 1024, // alta resolución para impresión
      margin: 2,
      errorCorrectionLevel: "H",
      color: { dark: "#000000", light: "#FFFFFF" },
    });

    return new NextResponse(new Uint8Array(png), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=3600",
        ...(download
          ? { "Content-Disposition": `attachment; filename="qr-${slug}.png"` }
          : {}),
      },
    });
  } catch (err) {
    console.error("[qr] error:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
