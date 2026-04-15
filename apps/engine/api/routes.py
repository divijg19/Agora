import uuid
from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from domain.schemas import MatchState
from domain.personas import ROSTER

router = APIRouter()


class StartMatchRequest(BaseModel):
    topic: str
    fighter_a: str
    fighter_b: str


@router.post("/start")
async def start_match(request: Request, payload: StartMatchRequest):
    if payload.fighter_a not in ROSTER or payload.fighter_b not in ROSTER:
        raise HTTPException(status_code=400, detail="Invalid fighter ID.")

    match_id = str(uuid.uuid4())
    new_match = MatchState(
        match_id=match_id,
        topic=payload.topic,
        fighter_a=payload.fighter_a,
        fighter_b=payload.fighter_b,
    )

    # Store in FastAPI in-memory state
    request.app.state.matches[match_id] = new_match

    return {"message": "Match initialized", "match_id": match_id}


@router.get("/roster")
async def get_roster():
    # Returns the list of fully serialized Persona objects
    return {"roster": [persona.model_dump() for persona in ROSTER.values()]}
