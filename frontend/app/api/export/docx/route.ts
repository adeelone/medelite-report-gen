import {
  AlignmentType,
  Document,
  ExternalHyperlink,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import { BRAND_TEXT, SOURCE_NOTICE, medicareUrl, reportRows } from "@/lib/server/report";
import type { ReportPayload } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const payload = (await request.json()) as ReportPayload;
  const buffer = await buildDocx(payload);

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="facility-assessment-${payload.facility.ccn}.docx"`,
    },
  });
}

async function buildDocx(payload: ReportPayload): Promise<Buffer> {
  const rows = reportRows(payload).map(
    ([label, value]) =>
      new TableRow({
        children: [
          new TableCell({
            width: { size: 32, type: WidthType.PERCENTAGE },
            shading: { fill: "F3F4F6" },
            children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 18 })] })],
          }),
          new TableCell({
            width: { size: 68, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ children: [new TextRun({ text: value, size: 18 })] })],
          }),
        ],
      }),
  );

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          centered(BRAND_TEXT, 28, true),
          centered("FACILITY ASSESSMENT SNAPSHOT", 24, true),
          centered(payload.facility.state || "", 22, true),
          new Paragraph({ text: "" }),
          new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows }),
          new Paragraph({ text: "" }),
          new Paragraph({
            children: [
              new ExternalHyperlink({
                link: medicareUrl(payload.facility.ccn),
                children: [
                  new TextRun({
                    text: "Medicare Care Compare source profile",
                    style: "Hyperlink",
                  }),
                ],
              }),
            ],
          }),
          new Paragraph({
            children: [new TextRun({ text: SOURCE_NOTICE, size: 16, color: "687185" })],
          }),
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
}

function centered(text: string, size: number, bold: boolean) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text, size, bold })],
  });
}
