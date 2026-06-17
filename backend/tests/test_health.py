import pytest


@pytest.mark.anyio
async def test_health_endpoint(client):
    response = await client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


@pytest.mark.anyio
async def test_vercel_origin_is_allowed(client):
    response = await client.get(
        "/health",
        headers={"Origin": "https://medelite-report-gen.vercel.app"},
    )

    assert response.headers["access-control-allow-origin"] == (
        "https://medelite-report-gen.vercel.app"
    )
