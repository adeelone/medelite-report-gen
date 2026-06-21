import { PDFDocument, PDFName, PDFPage, PDFString, StandardFonts, rgb } from "pdf-lib";
import { medicareUrl, reportRows } from "@/lib/server/report";
import type { ReportPayload } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const payload = (await request.json()) as ReportPayload;
  const bytes = await buildPdf(payload);

  return new Response(bytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="facility-assessment-${payload.facility.ccn}.pdf"`,
    },
  });
}

async function buildPdf(payload: ReportPayload): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([612, 792]);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const blue = rgb(0.11, 0.31, 0.75);
  const dark = rgb(0.07, 0.09, 0.15);
  const gray = rgb(0.95, 0.96, 0.98);
  let y = 748;

  drawCentered(page, "INFINITE — Managed by MEDELITE", 14, y, bold, dark);
  y -= 20;
  drawCentered(page, "FACILITY ASSESSMENT SNAPSHOT", 12, y, bold, dark);
  y -= 18;
  drawCentered(page, payload.facility.state || "", 11, y, bold, dark);
  y -= 24;

  for (const [label, value] of reportRows(payload)) {
    page.drawRectangle({ x: 44, y: y - 12, width: 190, height: 18, color: gray });
    page.drawRectangle({ x: 44, y: y - 12, width: 524, height: 18, borderColor: rgb(0.68, 0.72, 0.78), borderWidth: 0.5 });
    page.drawText(label, { x: 50, y: y - 6, size: 8.2, font: bold, color: dark });
    page.drawText(truncate(value, 72), { x: 242, y: y - 6, size: 8.2, font: regular, color: dark });
    y -= 18;
  }

  const url = medicareUrl(payload.facility.ccn);
  y -= 10;
  page.drawText("Medicare Care Compare source profile", { x: 44, y, size: 9, font: regular, color: blue });
  addLink(pdf, page, url, 44, y - 2, 190, 12);
  return pdf.save();
}

function drawCentered(
  page: PDFPage,
  text: string,
  size: number,
  y: number,
  font: Awaited<ReturnType<PDFDocument["embedFont"]>>,
  color: ReturnType<typeof rgb>,
) {
  const width = font.widthOfTextAtSize(text, size);
  page.drawText(text, { x: (612 - width) / 2, y, size, font, color });
}

function addLink(
  pdf: PDFDocument,
  page: PDFPage,
  url: string,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const annotation = pdf.context.obj({
    Type: PDFName.of("Annot"),
    Subtype: PDFName.of("Link"),
    Rect: [x, y, x + width, y + height],
    Border: [0, 0, 0],
    A: {
      Type: PDFName.of("Action"),
      S: PDFName.of("URI"),
      URI: PDFString.of(url),
    },
  });
  page.node.addAnnot(pdf.context.register(annotation));
}

function truncate(value: string, maxLength: number): string {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
}
