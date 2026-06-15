"use client";

import type { FormEvent } from "react";
import type { ManualInputs } from "@/lib/types";

type Props = {
  ccn: string;
  manual: ManualInputs;
  loadingLookup: boolean;
  lookupError: string | null;
  onCcnChange: (ccn: string) => void;
  onManualChange: (manual: ManualInputs) => void;
  onLookup: () => void;
};

const textFields: Array<{ key: keyof ManualInputs; label: string; placeholder: string }> = [
  { key: "facility_name_override", label: "Facility name override", placeholder: "Optional" },
  { key: "emr", label: "EMR", placeholder: "PCC" },
  { key: "patient_type", label: "Type of patient", placeholder: "Long-term & Short-term" },
  {
    key: "previous_performance",
    label: "Previous provider performance",
    placeholder: "About 30 patients/day",
  },
  { key: "medical_coverage", label: "Medical coverage", placeholder: "Optometry, PCP, Podiatry" },
];

export function FacilityForm({
  ccn,
  manual,
  loadingLookup,
  lookupError,
  onCcnChange,
  onManualChange,
  onLookup,
}: Props) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onLookup();
  }

  return (
    <form className="formPanel" onSubmit={handleSubmit}>
      <div className="fieldGroup ccnRow">
        <label htmlFor="ccn">CCN</label>
        <div className="lookupLine">
          <input
            id="ccn"
            inputMode="numeric"
            maxLength={6}
            pattern="[0-9]{6}"
            value={ccn}
            onChange={(event) => onCcnChange(event.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="686123"
            aria-invalid={ccn.length > 0 && ccn.length !== 6}
          />
          <button type="submit" disabled={ccn.length !== 6 || loadingLookup}>
            {loadingLookup ? "Looking up" : "Look Up"}
          </button>
        </div>
        {ccn.length > 0 && ccn.length !== 6 ? <p className="errorText">Enter a 6 digit CCN.</p> : null}
        {lookupError ? <p className="errorText">{lookupError}</p> : null}
      </div>

      <div className="manualGrid">
        {textFields.map((field) => (
          <div className="fieldGroup" key={field.key}>
            <label htmlFor={field.key}>{field.label}</label>
            <input
              id={field.key}
              value={String(manual[field.key])}
              onChange={(event) => onManualChange({ ...manual, [field.key]: event.target.value })}
              placeholder={field.placeholder}
            />
          </div>
        ))}
        <div className="fieldGroup">
          <label htmlFor="current_census">Current census</label>
          <input
            id="current_census"
            type="number"
            min={0}
            value={manual.current_census}
            onChange={(event) =>
              onManualChange({
                ...manual,
                current_census: event.target.value === "" ? "" : Number(event.target.value),
              })
            }
            placeholder="112"
          />
        </div>
        <div className="fieldGroup">
          <label htmlFor="previous_coverage">Previous coverage from Medelite</label>
          <select
            id="previous_coverage"
            value={manual.previous_coverage ? "yes" : "no"}
            onChange={(event) =>
              onManualChange({ ...manual, previous_coverage: event.target.value === "yes" })
            }
          >
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>
      </div>
    </form>
  );
}
