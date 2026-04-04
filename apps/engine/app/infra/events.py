import json
from enum import Enum
from typing import Any, Dict


class ArenaEvent(str, Enum):
    TURN_START = "turn_start"
    CHUNK = "chunk"
    TURN_END = "turn_end"
    JUDGE_EVALUATING = "judge_evaluating"
    MATCH_RESULT = "match_result"


def format_sse(event: ArenaEvent, data: Dict[str, Any]) -> str:
    """Formats data into a strictly compliant Server-Sent Event string."""
    return f"event: {event.value}\ndata: {json.dumps(data)}\n\n"
