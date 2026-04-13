from enum import Enum
from typing import Any, Dict
import json


class ArenaEvent(str, Enum):
    TURN_START = "turn_start"
    CHUNK = "chunk"
    TURN_END = "turn_end"
    JUDGE_EVALUATING = "judge_evaluating"
    MATCH_RESULT = "match_result"


def format_sse(event: ArenaEvent, data: Dict[str, Any]) -> Dict[str, Any]:
    """Formats data into an sse-starlette compliant dictionary."""
    return {
        "event": event.value,
        "data": json.dumps(data)
    }
