from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field, field_validator


class FacilityData(BaseModel):
    ccn: str
    provider_name: str
    provider_address: str
    city: str
    state: str
    zip_code: str
    location: str
    census_capacity: int | None = None
    overall_star_rating: str | None = None
    health_inspection_rating: str | None = None
    staffing_rating: str | None = None
    quality_of_resident_care_rating: str | None = None
    claims_metrics: dict[str, str | None] = Field(default_factory=dict)
    source: dict[str, Any] = Field(default_factory=dict)


class ManualInputs(BaseModel):
    emr: str = Field(min_length=1)
    current_census: int = Field(ge=0)
    patient_type: str = Field(min_length=1)
    previous_coverage: bool
    previous_performance: str = Field(min_length=1)
    medical_coverage: str = Field(min_length=1)
    facility_name_override: str | None = None

    @field_validator("facility_name_override")
    @classmethod
    def normalize_override(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip()
        return normalized or None


class ReportPayload(BaseModel):
    facility: FacilityData
    manual: ManualInputs


class ErrorResponse(BaseModel):
    error: str
