import type { ExportKind, FacilityData, ReportPayload } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function lookupFacility(ccn: string): Promise<FacilityData> {
  const response = await fetch(`${API_URL}/api/lookup?ccn=${encodeURIComponent(ccn)}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: "Lookup failed" }));
    throw new Error(body.error ?? "Lookup failed");
  }
  return response.json();
}

export async function downloadExport(kind: ExportKind, payload: ReportPayload): Promise<void> {
  const response = await fetch(`${API_URL}/api/export/${kind}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`Unable to export ${kind.toUpperCase()}`);
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `facility-assessment-${payload.facility.ccn}.${kind}`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
