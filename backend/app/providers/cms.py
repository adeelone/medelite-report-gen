from __future__ import annotations

from typing import Any, cast

import httpx

from app.core.config import Settings
from app.core.errors import FacilityNotFoundError
from app.models import FacilityData
from app.providers.case_reference import apply_case_reference_snapshot

CLAIMS_MEASURE_LABELS = {
    "521": ("Short Term Hospitalization", "percent"),
    "522": ("STR ED Visit", "percent"),
    "551": ("LT Hospitalization", "decimal"),
    "552": ("ED Visit", "decimal"),
}

AVERAGE_FIELD_LABELS = {
    "percentage_of_short_stay_residents_who_were_rehospitalized__1d02": (
        "STR National Avg. for Hospitalization",
        "STR State National Avg. for Hospitalization",
        "percent",
    ),
    "percentage_of_short_stay_residents_who_had_an_outpatient_em_d911": (
        "STR ED Visits National Avg.",
        "STR ED Visits State Avg.",
        "percent",
    ),
    "number_of_hospitalizations_per_1000_longstay_resident_days": (
        "LT National Avg. for Hospitalization",
        "LT State National Avg. for Hospitalization",
        "decimal",
    ),
    "number_of_outpatient_emergency_department_visits_per_1000_l_de9d": (
        "LT ED Visits National Avg.",
        "LT ED Visits State Avg.",
        "decimal",
    ),
}


class CMSProvider:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    async def lookup_facility(self, ccn: str) -> FacilityData:
        async with httpx.AsyncClient(timeout=20) as client:
            provider_row = await self._fetch_provider_row(client, ccn)
            state = self._first(provider_row, "provider_state", "state") or ""
            claims_metrics = await self._fetch_claims_metrics(client, ccn, state)

        facility = self._map_provider(provider_row, ccn, claims_metrics)
        if self.settings.apply_case_reference_snapshot:
            return apply_case_reference_snapshot(facility)
        return facility

    async def _fetch_provider_row(self, client: httpx.AsyncClient, ccn: str) -> dict[str, Any]:
        url = f"{self.settings.cms_api_base_url}/{self.settings.cms_provider_dataset_id}/0"
        response = await client.get(
            url,
            params={
                "conditions[0][property]": "cms_certification_number_ccn",
                "conditions[0][value]": ccn,
                "conditions[0][operator]": "=",
            },
        )
        response.raise_for_status()
        rows = self._rows_from_payload(response.json())
        if not rows:
            raise FacilityNotFoundError(ccn)
        return rows[0]

    async def _fetch_claims_metrics(
        self, client: httpx.AsyncClient, ccn: str, state: str
    ) -> dict[str, str | None]:
        if not self.settings.cms_claims_dataset_id:
            return {}

        claims_rows = await self._fetch_rows(
            client,
            self.settings.cms_claims_dataset_id,
            "cms_certification_number_ccn",
            ccn,
            limit=100,
        )
        state_rows = await self._fetch_rows(
            client,
            self.settings.cms_state_averages_dataset_id,
            "state_or_nation",
            state,
            limit=1,
        )
        nation_rows = await self._fetch_rows(
            client,
            self.settings.cms_state_averages_dataset_id,
            "state_or_nation",
            "NATION",
            limit=1,
        )

        metrics: dict[str, str | None] = {}
        for row in claims_rows:
            code = self._first(row, "measure_code")
            if code not in CLAIMS_MEASURE_LABELS:
                continue
            label, style = CLAIMS_MEASURE_LABELS[code]
            metrics[label] = self._format_metric(self._first(row, "adjusted_score"), style)

        if nation_rows:
            self._merge_average_metrics(metrics, nation_rows[0], is_state=False)
        if state_rows:
            self._merge_average_metrics(metrics, state_rows[0], is_state=True)
        return metrics

    async def _fetch_rows(
        self,
        client: httpx.AsyncClient,
        dataset_id: str,
        property_name: str,
        value: str,
        limit: int,
    ) -> list[dict[str, Any]]:
        url = f"{self.settings.cms_api_base_url}/{dataset_id}/0"
        response = await client.get(
            url,
            params={
                "conditions[0][property]": property_name,
                "conditions[0][value]": value,
                "conditions[0][operator]": "=",
                "limit": str(limit),
            },
        )
        response.raise_for_status()
        return self._rows_from_payload(response.json())

    def _merge_average_metrics(
        self, metrics: dict[str, str | None], row: dict[str, Any], is_state: bool
    ) -> None:
        normalized = {str(key).lower(): value for key, value in row.items()}
        for field, labels in AVERAGE_FIELD_LABELS.items():
            national_label, state_label, style = labels
            value = normalized.get(field)
            if value in (None, ""):
                continue
            label = state_label if is_state else national_label
            metrics[label] = self._format_metric(value, style)

    def _map_provider(
        self,
        row: dict[str, Any],
        ccn: str,
        claims_metrics: dict[str, str | None],
    ) -> FacilityData:
        address = self._first(row, "provider_address", "address")
        city = self._first(row, "provider_city", "citytown", "city")
        state = self._first(row, "provider_state", "state")
        zip_code = self._first(row, "provider_zip_code", "zip_code", "zip")
        location_parts = [address, city, state]
        location = ", ".join(part for part in location_parts if part)
        if zip_code and zip_code not in location:
            location = f"{location} {zip_code}".strip()

        beds = self._first(row, "number_of_certified_beds", "certified_beds")
        return FacilityData(
            ccn=ccn,
            provider_name=self._first(row, "provider_name", "facility_name") or "",
            provider_address=address or "",
            city=city or "",
            state=state or "",
            zip_code=zip_code or "",
            location=location,
            census_capacity=self._int_or_none(beds),
            overall_star_rating=self._string_or_none(self._first(row, "overall_rating")),
            health_inspection_rating=self._string_or_none(
                self._first(row, "health_inspection_rating")
            ),
            staffing_rating=self._string_or_none(self._first(row, "staffing_rating")),
            quality_of_resident_care_rating=self._string_or_none(
                self._first(row, "quality_measure_rating", "qm_rating")
            ),
            claims_metrics=claims_metrics,
            source=row,
        )

    @staticmethod
    def _rows_from_payload(payload: Any) -> list[dict[str, Any]]:
        if isinstance(payload, dict):
            if isinstance(payload.get("results"), list):
                return cast(list[dict[str, Any]], payload["results"])
            if isinstance(payload.get("data"), list):
                return cast(list[dict[str, Any]], payload["data"])
        if isinstance(payload, list):
            return payload
        return []

    @staticmethod
    def _first(row: dict[str, Any], *keys: str) -> str | None:
        lower = {str(key).lower(): value for key, value in row.items()}
        for key in keys:
            value = lower.get(key.lower())
            if value not in (None, ""):
                return str(value).strip()
        return None

    @staticmethod
    def _int_or_none(value: Any) -> int | None:
        try:
            return int(float(str(value)))
        except (TypeError, ValueError):
            return None

    @staticmethod
    def _string_or_none(value: Any) -> str | None:
        if value in (None, ""):
            return None
        return str(value).strip()

    @staticmethod
    def _format_metric(value: Any, style: str = "raw") -> str:
        if value in (None, ""):
            return "N/A"
        if style == "percent":
            return f"{float(str(value)):.1f}%"
        if style == "decimal":
            return f"{float(str(value)):.2f}"
        return str(value).strip()
