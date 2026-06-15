from __future__ import annotations

from app.models import ReportPayload

CLAIMS_ORDER = [
    "Short Term Hospitalization",
    "STR National Avg. for Hospitalization",
    "STR State National Avg. for Hospitalization",
    "STR ED Visit",
    "STR ED Visits National Avg.",
    "STR ED Visits State Avg.",
    "LT Hospitalization",
    "LT National Avg. for Hospitalization",
    "LT State National Avg. for Hospitalization",
    "ED Visit",
    "LT ED Visits National Avg.",
    "LT ED Visits State Avg.",
]


def medicare_url(ccn: str) -> str:
    return f"https://www.medicare.gov/care-compare/details/nursing-home/{ccn}"


def report_rows(payload: ReportPayload) -> list[tuple[str, str]]:
    facility = payload.facility
    manual = payload.manual
    name = manual.facility_name_override or facility.provider_name
    rows = [
        ("Name of Facility", name),
        ("Location", facility.location),
        ("EMR", manual.emr),
        ("Census Capacity", _display(facility.census_capacity)),
        ("Current Census", str(manual.current_census)),
        ("Type of Patient", manual.patient_type),
        ("Previous Coverage from Medelite", "Yes" if manual.previous_coverage else "No"),
        ("Previous Provider Performance from Medelite", manual.previous_performance),
        ("Medical Coverage", manual.medical_coverage),
        ("Overall Star Rating", _display(facility.overall_star_rating)),
        ("Health Inspection", _display(facility.health_inspection_rating)),
        ("Staffing", _display(facility.staffing_rating)),
        ("Quality of Resident Care", _display(facility.quality_of_resident_care_rating)),
    ]
    for label in CLAIMS_ORDER:
        rows.append((label, _display(facility.claims_metrics.get(label))))
    return rows


def _display(value: object | None) -> str:
    return "N/A" if value in (None, "") else str(value)
