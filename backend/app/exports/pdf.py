from __future__ import annotations

from io import BytesIO

from reportlab.lib import colors
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from app.exports.shared import SOURCE_NOTICE, medicare_url, report_rows
from app.models import ReportPayload


def build_pdf(payload: ReportPayload) -> bytes:
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=LETTER,
        rightMargin=0.65 * inch,
        leftMargin=0.65 * inch,
        topMargin=0.55 * inch,
        bottomMargin=0.55 * inch,
    )
    styles = getSampleStyleSheet()
    brand = ParagraphStyle(
        "Brand",
        parent=styles["Normal"],
        alignment=1,
        fontName="Helvetica-Bold",
        fontSize=14,
        leading=18,
        textColor=colors.HexColor("#111827"),
    )
    title = ParagraphStyle(
        "SnapshotTitle",
        parent=brand,
        fontSize=12,
        leading=16,
        textColor=colors.HexColor("#374151"),
    )
    state = ParagraphStyle("State", parent=brand, fontSize=11, leading=14)
    link_style = ParagraphStyle(
        "FooterLink",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#1d4ed8"),
    )

    rows = [
        [Paragraph(f"<b>{label}</b>", styles["Normal"]), value]
        for label, value in report_rows(payload)
    ]
    table = Table(rows, colWidths=[2.85 * inch, 4.15 * inch], repeatRows=0)
    table.setStyle(
        TableStyle(
            [
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#9ca3af")),
                ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#f3f4f6")),
                ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("LEADING", (0, 0), (-1, -1), 12),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
    url = medicare_url(payload.facility.ccn)
    story = [
        Paragraph("INFINITE — Managed by MEDELITE", brand),
        Paragraph("FACILITY ASSESSMENT SNAPSHOT", title),
        Paragraph(payload.facility.state or "", state),
        Spacer(1, 0.22 * inch),
        table,
        Spacer(1, 0.2 * inch),
        Paragraph(f'<a href="{url}">Medicare Care Compare source profile</a>', link_style),
        Paragraph(SOURCE_NOTICE, link_style),
    ]
    doc.build(story)
    return buffer.getvalue()
