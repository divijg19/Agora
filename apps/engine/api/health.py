from fastapi import APIRouter, Response

router = APIRouter()


HEALTH_PAYLOAD = {"status": "ok", "system": "agora_engine"}


def _health_headers() -> dict[str, str]:
    return {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        "Pragma": "no-cache",
    }


@router.get("/health", include_in_schema=False)
async def health():
    return HEALTH_PAYLOAD


@router.head("/health", include_in_schema=False)
async def health_head():
    return Response(status_code=200, headers=_health_headers())


@router.get("/")
async def root_health():
    return HEALTH_PAYLOAD
