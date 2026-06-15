"use client";

import React from "react";
import { useMemo, useState } from "react";
import { ExportBar } from "@/components/ExportBar";
import { FacilityForm } from "@/components/FacilityForm";
import { MetricCards } from "@/components/MetricCards";
import { ReportPreview } from "@/components/ReportPreview";
import { downloadExport, lookupFacility } from "@/lib/api";
import type { ExportKind, FacilityData, ManualInputs, ReportPayload } from "@/lib/types";

const initialManual: ManualInputs = {
  emr: "",
  current_census: "",
  patient_type: "",
  previous_coverage: false,
  previous_performance: "",
  medical_coverage: "",
  facility_name_override: "",
};

export default function Home() {
  const [ccn, setCcn] = useState("686123");
  const [facility, setFacility] = useState<FacilityData | null>(null);
  const [manual, setManual] = useState<ManualInputs>(initialManual);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [loadingLookup, setLoadingLookup] = useState(false);
  const [exporting, setExporting] = useState<ExportKind | null>(null);

  const payload = useMemo<ReportPayload | null>(() => {
    if (!facility || manual.current_census === "") {
      return null;
    }
    const required = [manual.emr, manual.patient_type, manual.previous_performance, manual.medical_coverage];
    if (required.some((value) => value.trim() === "")) {
      return null;
    }
    return {
      facility,
      manual: {
        ...manual,
        current_census: manual.current_census,
      },
    };
  }, [facility, manual]);

  async function handleLookup() {
    setLookupError(null);
    setLoadingLookup(true);
    try {
      const result = await lookupFacility(ccn);
      setFacility(result);
    } catch (error) {
      setFacility(null);
      setLookupError(error instanceof Error ? error.message : "Lookup failed");
    } finally {
      setLoadingLookup(false);
    }
  }

  async function handleExport(kind: ExportKind) {
    if (!payload) {
      setExportError("Complete lookup and required manual fields first.");
      return;
    }
    setExportError(null);
    setExporting(kind);
    try {
      await downloadExport(kind, payload);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : "Export failed");
    } finally {
      setExporting(null);
    }
  }

  return (
    <main className="appShell">
      <section className="workspace">
        <div className="controlColumn">
          <div className="headerBlock">
            <div className="brandName">INFINITE — Managed by MEDELITE</div>
            <h1>FACILITY ASSESSMENT SNAPSHOT</h1>
            <span>{facility?.state ?? "CCN"}</span>
          </div>
          <FacilityForm
            ccn={ccn}
            manual={manual}
            loadingLookup={loadingLookup}
            lookupError={lookupError}
            onCcnChange={setCcn}
            onManualChange={setManual}
            onLookup={handleLookup}
          />
          <ExportBar canExport={payload !== null} exporting={exporting} error={exportError} onExport={handleExport} />
          <MetricCards facility={facility} />
        </div>
        <ReportPreview facility={facility} manual={manual} />
      </section>
    </main>
  );
}
