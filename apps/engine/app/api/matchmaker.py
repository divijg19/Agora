from fastapi import APIRouter

router = APIRouter()


@router.post("/start")
async def start_match():
    # TODO (v0.2.x): Instantiate MatchState, save to app.state.matches
    return {"message": "Match initialized", "match_id": "placeholder_123"}
