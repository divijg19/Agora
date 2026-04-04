from domain.schemas import DebateState
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from infra.events import DebateEvent, EventType, encode_sse
from pydantic import BaseModel, Field

router = APIRouter(tags=["debate"])


class StartDebateRequest(BaseModel):
    topic: str = Field(min_length=3, max_length=280)
    fighter_a: str = Field(min_length=1, max_length=80)
    fighter_b: str = Field(min_length=1, max_length=80)
    max_turns: int = Field(default=4, ge=2, le=12)


class StartDebateResponse(BaseModel):
    session_id: str
    status: str


@router.post("/debate/start", response_model=StartDebateResponse)
async def start_debate(
    payload: StartDebateRequest, request: Request
) -> StartDebateResponse:
    director = request.app.state.director
    state: DebateState = director.create_session(
        topic=payload.topic,
        fighter_a=payload.fighter_a,
        fighter_b=payload.fighter_b,
        max_turns=payload.max_turns,
    )
    return StartDebateResponse(session_id=state.session_id, status=state.status)


@router.get("/debate/stream/{session_id}")
async def stream_debate(session_id: str, request: Request) -> StreamingResponse:
    director = request.app.state.director

    if not director.has_session(session_id):
        raise HTTPException(status_code=404, detail="session not found")

    async def event_stream():
        async for event_name, payload in director.stream_session(session_id):
            event = DebateEvent(
                type=EventType(event_name), session_id=session_id, payload=payload
            )
            yield encode_sse(event)

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
