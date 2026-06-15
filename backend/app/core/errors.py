from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse


class FacilityNotFoundError(Exception):
    def __init__(self, ccn: str) -> None:
        self.ccn = ccn


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(FacilityNotFoundError)
    async def facility_not_found(_: Request, exc: FacilityNotFoundError) -> JSONResponse:
        return JSONResponse(
            status_code=404, content={"error": "Facility not found", "ccn": exc.ccn}
        )
