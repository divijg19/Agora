from fastapi import APIRouter, Request, HTTPException
from sse_starlette.sse import EventSourceResponse
from domain.director import execute_turn
from domain.judge import evaluate_match
from infra.events import ArenaEvent, format_sse

router = APIRouter()


@router.get("/{match_id}")
async def stream_match(request: Request, match_id: str):
    matches = request.app.state.matches
    if match_id not in matches:
        raise HTTPException(status_code=404, detail="Match not found.")

    state = matches[match_id]

    async def event_publisher():
        # 1. Loop through all turns
        while state.current_turn_count < state.max_turns:
            async for event_type, data in execute_turn(state):
                if event_type == "start":
                    yield format_sse(
                        ArenaEvent.TURN_START,
                        {
                            "speaker_id": data["speaker_id"],
                            "intent": data["intent"],
                        },
                    )
                elif event_type == "chunk":
                    yield format_sse(ArenaEvent.CHUNK, {"text": data})
                elif event_type == "end":
                    yield format_sse(ArenaEvent.TURN_END, {"text": data})

        # 2. Debate Complete -> Trigger Judge
        yield format_sse(ArenaEvent.JUDGE_EVALUATING, {})

        verdict = await evaluate_match(state)

        # 3. Yield Result and gracefully end stream
        yield format_sse(ArenaEvent.MATCH_RESULT, verdict.model_dump())

    return EventSourceResponse(event_publisher())
