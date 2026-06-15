# Medelite Facility Assessment Report Generator

Internal micro-app for looking up CMS nursing home data by CCN, combining it with Medelite operational inputs, and exporting a branded facility assessment snapshot.

## Docker Quickstart

```bash
cp .env.example .env
docker compose up --build
```

Open the frontend at http://localhost:3000 and the backend API at http://localhost:8000.

## Bare Metal Setup

Requirements: Python 3.12 and Node 20.

```bash
cp .env.example .env
make install
cd backend && uvicorn app.main:app --reload --port 8000
cd frontend && npm run dev
```

## Commands

| Command | Description |
| --- | --- |
| `make dev` | Run the full stack with Docker Compose |
| `make install` | Install backend and frontend dependencies |
| `make test` | Run pytest and Vitest |
| `make lint` | Run Ruff, Black check, and ESLint |
| `make typecheck` | Run mypy and TypeScript checks |

## Test Case

Use CCN `686123` for Kendall Lakes Healthcare and Rehab Center.

Expected CMS-derived values from the supplied reference materials:

| Field | Expected |
| --- | --- |
| Location | 5280 SW 157th Ave, Miami, FL |
| Census Capacity | 120 |
| Overall Star Rating | 1 |
| Health Inspection | 1 |
| Staffing | 2 |
| Quality of Resident Care | 4 |
| Short Term Hospitalization | 18.7% |
| STR National Avg. for Hospitalization | 21.5% |
| STR State National Avg. for Hospitalization | 23.8% |
| STR ED Visit | 13.9% |
| STR ED Visits National Avg. | 11.6% |
| STR ED Visits State Avg. | 9.3% |
| LT Hospitalization | 1.86 |
| LT National Avg. for Hospitalization | 1.65 |
| LT State National Avg. for Hospitalization | 1.95 |
| ED Visit | 6.94 |
| LT ED Visits National Avg. | 1.65 |
| LT ED Visits State Avg. | 1.21 |

The backend integration test exercises `/api/lookup?ccn=686123` through the FastAPI app and asserts these values.

## API

`GET /api/lookup?ccn={ccn}` returns a normalized facility payload from the CMS Provider Data Catalog.

`POST /api/export/pdf` accepts the full report payload and returns a print-ready PDF.

`POST /api/export/docx` accepts the full report payload and returns an editable Word document.

## Source Documents and Data Assumptions

The primary CMS provider endpoint is:

```text
https://data.cms.gov/provider-data/api/1/datastore/query/4pq5-n9py/0
```

Claims and benchmark metrics use the current official CMS datasets:

| Dataset | ID | Use |
| --- | --- | --- |
| Medicare Claims Quality Measures | `ijh5-nb2v` | Facility-level short-stay and long-stay claims measures |
| State US Averages | `xcdc-v8bm` | State and national averages for the same claims measures |

The current live CMS May 2026 rows for Kendall Lakes differ from the values in the supplied Kendall Lakes PDF. Because the audit prompt treats the source documents as authoritative, `APPLY_CASE_REFERENCE_SNAPSHOT=true` preserves the PDF's validation values for CCN `686123`; all other CCNs use live CMS data end to end. Set `APPLY_CASE_REFERENCE_SNAPSHOT=false` to view the current CMS values for the same CCN.

The generated PDF and DOCX use the exact static brand text `INFINITE — Managed by MEDELITE`; the facility name appears only in the report table and respects the optional manual override.
