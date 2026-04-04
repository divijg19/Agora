import json
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class EventType(str, Enum):
    TURN_START = "turn_start"
    CHUNK = "chunk"
    TURN_END = "turn_end"
    RESULT = "result"


class DebateEvent(BaseModel):
    type: EventType
    session_id: str
    payload: dict[str, Any] = Field(default_factory=dict)


def encode_sse(event: DebateEvent) -> str:
    return f"event: {event.type.value}\ndata: {json.dumps(event.payload, separators=(',', ':'))}\n\n"
