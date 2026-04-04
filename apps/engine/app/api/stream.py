from fastapi import APIRouter

router = APIRouter()


@router.get("/{match_id}")
async def stream_match(match_id: str):
    # TODO (v0.2.x): Return EventSourceResponse linked to Director generator
    pass
