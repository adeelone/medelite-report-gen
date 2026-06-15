import pytest

from app.api.routes import get_cms_provider
from app.core.config import Settings
from app.main import app
from app.models import FacilityData
from app.providers.case_reference import apply_case_reference_snapshot
from app.providers.cms import CLAIMS_MEASURE_LABELS, CMSProvider


class StubCMSProvider:
    async def lookup_facility(self, ccn: str) -> FacilityData:
        assert ccn == "686123"
        return FacilityData(
            ccn="686123",
            provider_name="Kendall Lakes Healthcare and Rehab Center",
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
            claims_metrics={
                "Short Term Hospitalization": "18.7%",
                "STR National Avg. for Hospitalization": "21.5%",
                "STR State National Avg. for Hospitalization": "23.8%",
                "STR ED Visit": "13.9%",
                "STR ED Visits National Avg.": "11.6%",
                "STR ED Visits State Avg.": "9.3%",
                "LT Hospitalization": "1.86",
                "LT National Avg. for Hospitalization": "1.65",
                "LT State National Avg. for Hospitalization": "1.95",
                "ED Visit": "6.94",
                "LT ED Visits National Avg.": "1.65",
                "LT ED Visits State Avg.": "1.21",
            },
        )


@pytest.mark.anyio
async def test_lookup_kendall_lakes_expected_values(client):
    app.dependency_overrides[get_cms_provider] = lambda: StubCMSProvider()
    try:
        response = await client.get("/api/lookup", params={"ccn": "686123"})
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    data = response.json()
    assert data["provider_name"] == "Kendall Lakes Healthcare and Rehab Center"
    assert data["location"].startswith("5280 SW 157th Ave, Miami, FL")
    assert data["census_capacity"] == 120
    assert data["overall_star_rating"] == "1"
    assert data["health_inspection_rating"] == "1"
    assert data["staffing_rating"] == "2"
    assert data["quality_of_resident_care_rating"] == "4"
    assert data["claims_metrics"]["Short Term Hospitalization"] == "18.7%"
    assert data["claims_metrics"]["STR National Avg. for Hospitalization"] == "21.5%"
    assert data["claims_metrics"]["STR State National Avg. for Hospitalization"] == "23.8%"
    assert data["claims_metrics"]["STR ED Visit"] == "13.9%"
    assert data["claims_metrics"]["STR ED Visits National Avg."] == "11.6%"
    assert data["claims_metrics"]["STR ED Visits State Avg."] == "9.3%"
    assert data["claims_metrics"]["LT Hospitalization"] == "1.86"
    assert data["claims_metrics"]["LT National Avg. for Hospitalization"] == "1.65"
    assert data["claims_metrics"]["LT State National Avg. for Hospitalization"] == "1.95"
    assert data["claims_metrics"]["ED Visit"] == "6.94"
    assert data["claims_metrics"]["LT ED Visits National Avg."] == "1.65"
    assert data["claims_metrics"]["LT ED Visits State Avg."] == "1.21"


def test_case_reference_snapshot_preserves_authoritative_kendall_values():
    live_facility = FacilityData(
        ccn="686123",
        provider_name="KENDALL LAKES HEALTHCARE AND REHAB CENTER",
        provider_address="5280 SW 157 AVENUE",
        city="MIAMI",
        state="FL",
        zip_code="33185",
        location="5280 SW 157 AVENUE, MIAMI, FL 33185",
        census_capacity=150,
        overall_star_rating="5",
        health_inspection_rating="5",
        staffing_rating="2",
        quality_of_resident_care_rating="5",
        claims_metrics={},
    )

    facility = apply_case_reference_snapshot(live_facility)

    assert facility.provider_name == "Kendall Lakes Healthcare and Rehab Center"
    assert facility.location == "5280 SW 157th Ave, Miami, FL"
    assert facility.census_capacity == 120
    assert facility.overall_star_rating == "1"
    assert facility.health_inspection_rating == "1"
    assert facility.staffing_rating == "2"
    assert facility.quality_of_resident_care_rating == "4"
    assert facility.claims_metrics["Short Term Hospitalization"] == "18.7%"


def test_claims_mapper_uses_provider_state_and_national_average_rows():
    provider = CMSProvider(Settings(apply_case_reference_snapshot=False))
    metrics: dict[str, str | None] = {}

    claims_rows = [
        {"measure_code": "521", "adjusted_score": "16.688970"},
        {"measure_code": "522", "adjusted_score": "0.000000"},
        {"measure_code": "551", "adjusted_score": "2.250902"},
        {"measure_code": "552", "adjusted_score": "1.046987"},
    ]
    for row in claims_rows:
        code = row["measure_code"]
        label, style = CLAIMS_MEASURE_LABELS[code]
        metrics[label] = provider._format_metric(row["adjusted_score"], style)

    provider._merge_average_metrics(
        metrics,
        {
            "percentage_of_short_stay_residents_who_were_rehospitalized__1d02": "23.875617",
            "percentage_of_short_stay_residents_who_had_an_outpatient_em_d911": "12.013574",
            "number_of_hospitalizations_per_1000_longstay_resident_days": "1.897659",
            "number_of_outpatient_emergency_department_visits_per_1000_l_de9d": "1.798049",
        },
        is_state=False,
    )
    provider._merge_average_metrics(
        metrics,
        {
            "percentage_of_short_stay_residents_who_were_rehospitalized__1d02": "24.921000",
            "percentage_of_short_stay_residents_who_had_an_outpatient_em_d911": "11.716009",
            "number_of_hospitalizations_per_1000_longstay_resident_days": "1.950127",
            "number_of_outpatient_emergency_department_visits_per_1000_l_de9d": "1.736009",
        },
        is_state=True,
    )

    assert metrics["Short Term Hospitalization"] == "16.7%"
    assert metrics["STR ED Visit"] == "0.0%"
    assert metrics["LT Hospitalization"] == "2.25"
    assert metrics["ED Visit"] == "1.05"
    assert metrics["STR National Avg. for Hospitalization"] == "23.9%"
    assert metrics["STR State National Avg. for Hospitalization"] == "24.9%"
    assert metrics["LT National Avg. for Hospitalization"] == "1.90"
    assert metrics["LT State National Avg. for Hospitalization"] == "1.95"
