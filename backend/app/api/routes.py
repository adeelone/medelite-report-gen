from fastapi import APIRouter, Depends, Query, Response

from app.core.config import Settings, get_settings
from app.exports.docx import build_docx
from app.exports.pdf import build_pdf
from app.models import FacilityData, ReportPayload
from app.providers.cms import CMSProvider

router = APIRouter(prefix="/api")


def get_cms_provider(settings: Settings = Depends(get_settings)) -> CMSProvider:
    return CMSProvider(settings)


@router.get("/lookup", response_model=FacilityData)
async def lookup(
    ccn: str = Query(pattern=r"^\d{6}$"),
    provider: CMSProvider = Depends(get_cms_provider),
) -> FacilityData:
    return await provider.lookup_facility(ccn)


@router.post("/export/pdf")
async def export_pdf(payload: ReportPayload) -> Response:
    return Response(
        content=build_pdf(payload),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="facility-assessment-{payload.facility.ccn}.pdf"'
        },
    )


@router.post("/export/docx")
async def export_docx(payload: ReportPayload) -> Response:
    return Response(
        content=build_docx(payload),
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={
            "Content-Disposition": f'attachment; filename="facility-assessment-{payload.facility.ccn}.docx"'
        },
    )
