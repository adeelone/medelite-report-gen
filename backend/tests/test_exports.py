from app.exports.shared import medicare_url, report_rows
from app.models import FacilityData, ManualInputs, ReportPayload


def test_report_rows_keep_snapshot_order_and_override_name():
    payload = ReportPayload(
        facility=FacilityData(
            ccn="686123",
            provider_name="Legal Name",
            provider_address="5280 SW 157th Ave",
            city="Miami",
            state="FL",
            zip_code="33185",
            location="5280 SW 157th Ave, Miami, FL 33185",
            census_capacity=120,
            overall_star_rating="1",
            health_inspection_rating="1",
            staffing_rating="2",
            quality_of_resident_care_rating="4",
        ),
        manual=ManualInputs(
            emr="PCC",
            current_census=112,
            patient_type="Long-term & Short-term",
            previous_coverage=True,
            previous_performance="About 30 patients/day",
            medical_coverage="Optometry, PCP, Podiatry",
            facility_name_override="Internal Facility Name",
        ),
    )

    rows = report_rows(payload)

    assert rows[0] == ("Name of Facility", "Internal Facility Name")
    assert [label for label, _ in rows] == [
        "Name of Facility",
        "Location",
        "EMR",
        "Census Capacity",
        "Current Census",
        "Type of Patient",
        "Previous Coverage from Medelite",
        "Previous Provider Performance from Medelite",
        "Medical Coverage",
        "Overall Star Rating",
        "Health Inspection",
        "Staffing",
        "Quality of Resident Care",
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


def test_empty_override_falls_back_to_cms_name_and_link_uses_ccn():
    payload = ReportPayload(
        facility=FacilityData(
            ccn="686123",
            provider_name="Kendall Lakes Healthcare and Rehab Center",
            provider_address="5280 SW 157th Ave",
            city="Miami",
            state="FL",
            zip_code="33185",
            location="5280 SW 157th Ave, Miami, FL",
            census_capacity=120,
        ),
        manual=ManualInputs(
            emr="PCC",
            current_census=112,
            patient_type="Long-term & Short-term",
            previous_coverage=False,
            previous_performance="About 30 patients/day",
            medical_coverage="Optometry, PCP, Podiatry",
            facility_name_override="   ",
        ),
    )

    assert report_rows(payload)[0] == (
        "Name of Facility",
        "Kendall Lakes Healthcare and Rehab Center",
    )
    assert medicare_url(payload.facility.ccn) == (
        "https://www.medicare.gov/care-compare/details/nursing-home/686123"
    )
