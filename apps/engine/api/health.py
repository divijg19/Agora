from fastapi import APIRouter

router = APIRouter()


HEALTH_PAYLOAD = {"status": "ok", "system": "agora_engine"}


@router.get("/health", include_in_schema=False)
@router.head("/health", include_in_schema=False)
async def health():
    return HEALTH_PAYLOAD


@router.get("/")
@router.head("/", include_in_schema=False)
async def root_health():
    return HEALTH_PAYLOAD
