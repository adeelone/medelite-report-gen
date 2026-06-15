import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FacilityForm } from "@/components/FacilityForm";
import type { ManualInputs } from "@/lib/types";

const manual: ManualInputs = {
  emr: "",
  current_census: "",
  patient_type: "",
  previous_coverage: false,
  previous_performance: "",
  medical_coverage: "",
  facility_name_override: "",
};

describe("FacilityForm", () => {
  it("validates six digit CCN before lookup", () => {
    const onLookup = vi.fn();
    render(
      <FacilityForm
        ccn="123"
        manual={manual}
        loadingLookup={false}
        lookupError={null}
        onCcnChange={vi.fn()}
        onManualChange={vi.fn()}
        onLookup={onLookup}
      />,
    );

    expect(screen.getByText("Enter a 6 digit CCN.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Look Up" })).toBeDisabled();
  });

  it("submits lookup for valid CCN", () => {
    const onLookup = vi.fn();
    render(
      <FacilityForm
        ccn="686123"
        manual={manual}
        loadingLookup={false}
        lookupError={null}
        onCcnChange={vi.fn()}
        onManualChange={vi.fn()}
        onLookup={onLookup}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Look Up" }));

    expect(onLookup).toHaveBeenCalledTimes(1);
  });
});
