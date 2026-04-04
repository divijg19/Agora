from enum import Enum
from typing import List

from pydantic import BaseModel


class TurnIntent(str, Enum):
    OPENING = "opening"
    COUNTER = "counter"
    DEEPENING = "deepening"
    REBUTTAL = "rebuttal"
    CLOSING = "closing"


class DebateTurn(BaseModel):
    speaker_id: str
    text: str
    intent: TurnIntent


class MatchState(BaseModel):
    match_id: str
    topic: str
    fighter_a: str
    fighter_b: str
    turns: List[DebateTurn] = []
    current_turn_count: int = 0
    max_turns: int = 6
    status: str = "initialized"  # initialized, active, judging, completed
