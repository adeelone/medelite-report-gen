"use client";

type Props = {
  canExport: boolean;
  exporting: "pdf" | "docx" | null;
  error: string | null;
  onExport: (kind: "pdf" | "docx") => void;
};

export function ExportBar({ canExport, exporting, error, onExport }: Props) {
  return (
    <div className="exportBar">
      <button type="button" disabled={!canExport || exporting !== null} onClick={() => onExport("pdf")}>
        {exporting === "pdf" ? "Preparing PDF" : "Download PDF"}
      </button>
      <button type="button" disabled={!canExport || exporting !== null} onClick={() => onExport("docx")}>
        {exporting === "docx" ? "Preparing Word" : "Download Word"}
      </button>
      {error ? <span className="errorText">{error}</span> : null}
    </div>
  );
}
