import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { getDemoBusiness } from "@/lib/demo";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type PdfSize = "a4" | "a3";
type PdfLayout = "full" | "qr" | "ticket" | "table";

const PAGE: Record<PdfSize, { w: number; h: number; label: string }> = {
  a4: { w: 595.28, h: 841.89, label: "A4" },
  a3: { w: 841.89, h: 1190.55, label: "A3" },
};

function pdfText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .slice(0, 90);
}

function hexToRgb(hex: string | null | undefined) {
  const clean = /^#[0-9a-fA-F]{6}$/.test(hex ?? "") ? hex!.slice(1) : "24A66D";
  return {
    r: parseInt(clean.slice(0, 2), 16) / 255,
    g: parseInt(clean.slice(2, 4), 16) / 255,
    b: parseInt(clean.slice(4, 6), 16) / 255,
  };
}

function rect(x: number, y: number, w: number, h: number, color: string) {
  const { r, g, b } = hexToRgb(color);
  return `${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} rg ${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f\n`;
}

function text({
  value,
  x,
  y,
  size,
  color = "#203126",
}: {
  value: string;
  x: number;
  y: number;
  size: number;
  color?: string;
}) {
  const { r, g, b } = hexToRgb(color);
  return `${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} rg BT /F1 ${size.toFixed(2)} Tf ${x.toFixed(2)} ${y.toFixed(2)} Td (${pdfText(value)}) Tj ET\n`;
}

function qrCommands(target: string, x: number, y: number, size: number) {
  const qr = QRCode.create(target, { errorCorrectionLevel: "H" }) as unknown as {
    modules: { size: number; data: boolean[] };
  };
  const moduleSize = size / qr.modules.size;
  let out = rect(x, y, size, size, "#FFFFFF");
  out += "0.125 0.192 0.149 rg\n";

  for (let row = 0; row < qr.modules.size; row += 1) {
    for (let col = 0; col < qr.modules.size; col += 1) {
      if (!qr.modules.data[row * qr.modules.size + col]) continue;
      out += `${(x + col * moduleSize).toFixed(2)} ${(y + size - (row + 1) * moduleSize).toFixed(2)} ${moduleSize.toFixed(2)} ${moduleSize.toFixed(2)} re f\n`;
    }
  }

  return out;
}

function buildPdf(content: string, width: number, height: number) {
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width.toFixed(2)} ${height.toFixed(2)}] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${Buffer.byteLength(content, "utf8")} >>\nstream\n${content}endstream`,
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((obj, index) => {
    offsets[index + 1] = Buffer.byteLength(pdf, "utf8");
    pdf += `${index + 1} 0 obj\n${obj}\nendobj\n`;
  });
  const xref = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;

  return Buffer.from(pdf, "utf8");
}

export async function GET(req: NextRequest) {
  try {
    const slug = req.nextUrl.searchParams.get("slug");
    const size = (req.nextUrl.searchParams.get("size") || "a4").toLowerCase() as PdfSize;
    const layout = (req.nextUrl.searchParams.get("layout") || "full").toLowerCase() as PdfLayout;

    if (!slug) {
      return NextResponse.json({ error: "slug requerido" }, { status: 400 });
    }
    const page =
      layout === "ticket"
        ? { w: 226.77, h: 420.94, label: "ticket-80mm" }
        : layout === "table"
          ? { w: 283.46, h: 425.2, label: "10x15" }
          : PAGE[size] ?? PAGE.a4;

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
    const margin = page.w * 0.08;
    const contentW = page.w - margin * 2;
    let content = "";

    if (layout === "qr") {
      const qrSize = Math.min(contentW, page.h - margin * 2 - 90);
      const x = (page.w - qrSize) / 2;
      const y = (page.h - qrSize) / 2 + 20;
      content += rect(0, 0, page.w, page.h, "#FFFFFF");
      content += qrCommands(target, x, y, qrSize);
      content += text({
        value: business.name,
        x: margin,
        y: margin + 34,
        size: 22,
        color: "#203126",
      });
      content += text({
        value: target.replace(/^https?:\/\//, ""),
        x: margin,
        y: margin,
        size: 10,
        color: "#8A6B3E",
      });
    } else if (layout === "ticket" || layout === "table") {
      const isTicket = layout === "ticket";
      const headerH = isTicket ? 80 : 104;
      const qrSize = Math.min(contentW * (isTicket ? 0.82 : 0.74), page.h * 0.48);
      const qrX = (page.w - qrSize) / 2;
      const qrY = isTicket ? 130 : 132;

      content += rect(0, 0, page.w, page.h, "#FFFFFF");
      content += rect(0, page.h - headerH, page.w, headerH, brand);
      content += text({
        value: isTicket ? "Tu opinion nos ayuda" : "Escanea y cuentanos como fue",
        x: margin,
        y: page.h - 34,
        size: isTicket ? 15 : 18,
        color: "#FFFFFF",
      });
      content += text({
        value: business.name,
        x: margin,
        y: page.h - 62,
        size: isTicket ? 22 : 27,
        color: "#FFFFFF",
      });
      content += qrCommands(target, qrX, qrY, qrSize);
      content += text({
        value: "Un toque. Sin registro.",
        x: margin,
        y: isTicket ? 86 : 82,
        size: isTicket ? 12 : 15,
        color: "#203126",
      });
      content += text({
        value: "Si algo fallo, llega privado al responsable.",
        x: margin,
        y: isTicket ? 62 : 56,
        size: isTicket ? 8.5 : 10,
        color: "#337257",
      });
      content += text({
        value: target.replace(/^https?:\/\//, ""),
        x: margin,
        y: 26,
        size: isTicket ? 7 : 8,
        color: "#8A6B3E",
      });
    } else {
      const headerH = page.h * 0.24;
      const qrSize = Math.min(contentW * 0.72, page.h * 0.43);
      const qrX = (page.w - qrSize) / 2;
      const qrY = page.h * 0.22;

      content += rect(0, 0, page.w, page.h, "#FFF8E7");
      content += rect(margin * 0.55, margin * 0.55, page.w - margin * 1.1, page.h - margin * 1.1, "#FFFFFF");
      content += rect(margin, page.h - margin - headerH, contentW, headerH, brand);
      content += text({
        value: "TU OPINION NOS AYUDA",
        x: margin + 28,
        y: page.h - margin - 58,
        size: page.w > 700 ? 26 : 18,
        color: "#FFFFFF",
      });
      content += text({
        value: business.name,
        x: margin + 28,
        y: page.h - margin - 118,
        size: page.w > 700 ? 46 : 32,
        color: "#FFFFFF",
      });
      content += text({
        value: "Escanea y dinos como fue tu visita",
        x: margin + 28,
        y: page.h - margin - 166,
        size: page.w > 700 ? 28 : 20,
        color: "#FFFFFF",
      });
      content += text({
        value: "Sin registrarte. En menos de 20 segundos.",
        x: margin + 28,
        y: page.h - margin - 205,
        size: page.w > 700 ? 18 : 13,
        color: "#FFFFFF",
      });

      content += rect(qrX - 18, qrY - 18, qrSize + 36, qrSize + 36, "#203126");
      content += qrCommands(target, qrX, qrY, qrSize);
      content += rect(margin * 1.55, margin * 1.55, page.w - margin * 3.1, 72, "#EAF9EF");
      content += text({
        value: "Elige como te fuiste",
        x: margin * 1.9,
        y: margin * 1.55 + 43,
        size: page.w > 700 ? 24 : 18,
        color: "#1F7A4E",
      });
      content += text({
        value: "Si algo fallo, llega privado al responsable.",
        x: margin * 1.9,
        y: margin * 1.55 + 18,
        size: page.w > 700 ? 16 : 11,
        color: "#337257",
      });
      content += text({
        value: target.replace(/^https?:\/\//, ""),
        x: margin,
        y: margin * 0.85,
        size: 10,
        color: "#8A6B3E",
      });
    }

    const pdf = buildPdf(content, page.w, page.h);

    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Cache-Control": "public, max-age=3600",
        "Content-Disposition": `attachment; filename="${layout === "qr" ? "qr" : layout === "ticket" ? "ticket" : layout === "table" ? "servilletero" : "cartel"}-${business.slug}-${page.label}.pdf"`,
      },
    });
  } catch (err) {
    console.error("[qr-print] error:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
