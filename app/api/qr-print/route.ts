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

function strokeRect(x: number, y: number, w: number, h: number, color: string, width = 1) {
  const { r, g, b } = hexToRgb(color);
  return `${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} RG ${width.toFixed(2)} w ${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re S\n`;
}

function line(x1: number, y1: number, x2: number, y2: number, color: string, width = 1) {
  const { r, g, b } = hexToRgb(color);
  return `${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} RG ${width.toFixed(2)} w ${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S\n`;
}

function fit(value: string, max = 44) {
  const clean = value.trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}.` : clean;
}

function text({
  value,
  x,
  y,
  size,
  color = "#203126",
  font = "F1",
}: {
  value: string;
  x: number;
  y: number;
  size: number;
  color?: string;
  font?: "F1" | "F2";
}) {
  const { r, g, b } = hexToRgb(color);
  return `${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} rg BT /${font} ${size.toFixed(2)} Tf ${x.toFixed(2)} ${y.toFixed(2)} Td (${pdfText(value)}) Tj ET\n`;
}

function textCenter({
  value,
  centerX,
  y,
  size,
  color = "#203126",
  font = "F1",
}: {
  value: string;
  centerX: number;
  y: number;
  size: number;
  color?: string;
  font?: "F1" | "F2";
}) {
  const clean = pdfText(value);
  const approx = clean.length * size * (font === "F2" ? 0.56 : 0.52);
  return text({ value: clean, x: centerX - approx / 2, y, size, color, font });
}

function starPath(cx: number, cy: number, outer: number, color = "#F6C64E") {
  const { r, g, b } = hexToRgb(color);
  const inner = outer * 0.45;
  const points = Array.from({ length: 10 }).map((_, i) => {
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    const radius = i % 2 === 0 ? outer : inner;
    return {
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius,
    };
  });

  return `${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} rg ${points
    .map((p, i) => `${p.x.toFixed(2)} ${p.y.toFixed(2)} ${i === 0 ? "m" : "l"}`)
    .join(" ")} h f\n`;
}

function stars(x: number, y: number, size: number, gap: number, color = "#F6C64E") {
  let out = "";
  for (let i = 0; i < 5; i += 1) {
    out += starPath(x + i * gap, y, size / 2, color);
  }
  return out;
}

function cutMarks(w: number, h: number, inset: number) {
  const len = 16;
  const c = "#B7B7B7";
  return [
    line(inset, h - inset, inset + len, h - inset, c, 0.6),
    line(inset, h - inset, inset, h - inset - len, c, 0.6),
    line(w - inset, h - inset, w - inset - len, h - inset, c, 0.6),
    line(w - inset, h - inset, w - inset, h - inset - len, c, 0.6),
    line(inset, inset, inset + len, inset, c, 0.6),
    line(inset, inset, inset, inset + len, c, 0.6),
    line(w - inset, inset, w - inset - len, inset, c, 0.6),
    line(w - inset, inset, w - inset, inset + len, c, 0.6),
  ].join("");
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
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width.toFixed(2)} ${height.toFixed(2)}] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
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
    const businessName = fit(business.name, 36);
    const margin = page.w * 0.08;
    const contentW = page.w - margin * 2;
    let content = "";

    if (layout === "qr") {
      const qrSize = Math.min(contentW, page.h - margin * 2 - 90);
      const x = (page.w - qrSize) / 2;
      const y = (page.h - qrSize) / 2 + 20;
      content += rect(0, 0, page.w, page.h, "#FFFFFF");
      content += cutMarks(page.w, page.h, margin * 0.48);
      content += strokeRect(x - 20, y - 20, qrSize + 40, qrSize + 40, "#E4E4E4", 1.2);
      content += qrCommands(target, x, y, qrSize);
      content += textCenter({
        value: businessName,
        centerX: page.w / 2,
        y: margin + 34,
        size: 24,
        color: "#203126",
        font: "F2",
      });
      content += textCenter({
        value: target.replace(/^https?:\/\//, ""),
        centerX: page.w / 2,
        y: margin,
        size: 10,
        color: "#8A6B3E",
      });
    } else if (layout === "ticket" || layout === "table") {
      const isTicket = layout === "ticket";
      const headerH = isTicket ? 92 : 116;
      const qrSize = Math.min(contentW * (isTicket ? 0.84 : 0.72), page.h * 0.45);
      const qrX = (page.w - qrSize) / 2;
      const qrY = isTicket ? 128 : 136;
      const cardX = margin * 0.62;
      const cardW = page.w - cardX * 2;

      content += rect(0, 0, page.w, page.h, isTicket ? "#FFFFFF" : "#FFF8E7");
      content += cutMarks(page.w, page.h, isTicket ? 10 : 16);
      content += rect(0, page.h - headerH, page.w, headerH, brand);
      content += rect(0, page.h - headerH - 16, page.w, 16, "#F6C64E");
      content += text({
        value: isTicket ? "TU OPINION NOS AYUDA" : "TU VISITA CUENTA",
        x: margin,
        y: page.h - 31,
        size: isTicket ? 12 : 16,
        color: "#FFFFFF",
        font: "F2",
      });
      content += text({
        value: businessName,
        x: margin,
        y: page.h - 64,
        size: isTicket ? 21 : 28,
        color: "#FFFFFF",
        font: "F2",
      });
      content += text({
        value: isTicket ? "Escanea antes de irte" : "Escanea y dinos como te fuiste",
        x: margin,
        y: page.h - (isTicket ? 86 : 94),
        size: isTicket ? 9.5 : 12,
        color: "#FFFFFF",
      });
      content += rect(cardX, qrY - 18, cardW, qrSize + 36, "#FFFFFF");
      content += strokeRect(cardX, qrY - 18, cardW, qrSize + 36, "#F0D89A", 1);
      content += qrCommands(target, qrX, qrY, qrSize);
      content += stars((page.w - (isTicket ? 82 : 108)) / 2, isTicket ? 91 : 91, isTicket ? 18 : 23, isTicket ? 17 : 22);
      content += textCenter({
        value: "Un toque y listo",
        centerX: page.w / 2,
        y: isTicket ? 69 : 66,
        size: isTicket ? 12 : 16,
        color: "#203126",
        font: "F2",
      });
      content += textCenter({
        value: "Si algo fallo, lo lee el responsable.",
        centerX: page.w / 2,
        y: isTicket ? 49 : 43,
        size: isTicket ? 8.2 : 10,
        color: "#337257",
      });
      content += textCenter({
        value: target.replace(/^https?:\/\//, ""),
        centerX: page.w / 2,
        y: 26,
        size: isTicket ? 7 : 8,
        color: "#8A6B3E",
      });
    } else {
      const isA3 = page.w > 700;
      const headerH = page.h * 0.25;
      const qrSize = Math.min(contentW * 0.68, page.h * 0.39);
      const qrX = (page.w - qrSize) / 2;
      const qrY = page.h * 0.25;
      const frame = margin * 0.54;

      content += rect(0, 0, page.w, page.h, "#FFF8E7");
      content += cutMarks(page.w, page.h, frame);
      content += rect(frame, frame, page.w - frame * 2, page.h - frame * 2, "#FFFFFF");
      content += strokeRect(frame, frame, page.w - frame * 2, page.h - frame * 2, "#F0D89A", 1.2);
      content += rect(margin, page.h - margin - headerH, contentW, headerH, brand);
      content += rect(margin, page.h - margin - headerH, contentW, 18, "#F6C64E");
      content += text({
        value: "TU OPINION NOS AYUDA A CUIDARTE MEJOR",
        x: margin + 28,
        y: page.h - margin - 58,
        size: isA3 ? 24 : 16,
        color: "#FFFFFF",
        font: "F2",
      });
      content += text({
        value: businessName,
        x: margin + 28,
        y: page.h - margin - 118,
        size: isA3 ? 48 : 33,
        color: "#FFFFFF",
        font: "F2",
      });
      content += text({
        value: "Escanea y cuentanos como te fuiste",
        x: margin + 28,
        y: page.h - margin - 166,
        size: isA3 ? 28 : 20,
        color: "#FFFFFF",
        font: "F2",
      });
      content += text({
        value: "Sin cuenta. Sin descargar nada. En menos de 20 segundos.",
        x: margin + 28,
        y: page.h - margin - 205,
        size: isA3 ? 17 : 12,
        color: "#FFFFFF",
      });

      content += rect(qrX - 28, qrY - 28, qrSize + 56, qrSize + 56, "#102D2A");
      content += rect(qrX - 16, qrY - 16, qrSize + 32, qrSize + 32, "#FFFFFF");
      content += qrCommands(target, qrX, qrY, qrSize);
      content += rect(margin * 1.35, margin * 1.35, page.w - margin * 2.7, isA3 ? 105 : 84, "#EAF9EF");
      content += stars(page.w / 2 - (isA3 ? 72 : 55), margin * 1.35 + (isA3 ? 127 : 104), isA3 ? 30 : 23, isA3 ? 34 : 27);
      content += textCenter({
        value: "Elige una estrella y listo",
        centerX: page.w / 2,
        y: margin * 1.35 + (isA3 ? 65 : 51),
        size: isA3 ? 25 : 18,
        color: "#1F7A4E",
        font: "F2",
      });
      content += textCenter({
        value: "Si algo fallo, lo recibe el responsable para poder arreglarlo.",
        centerX: page.w / 2,
        y: margin * 1.35 + (isA3 ? 34 : 27),
        size: isA3 ? 14 : 10,
        color: "#337257",
      });
      content += textCenter({
        value: target.replace(/^https?:\/\//, ""),
        centerX: page.w / 2,
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
