from pydantic import BaseModel, Field


class Turn(BaseModel):
    index: int = Field(ge=1)
    speaker: str
    text: str


class DebateState(BaseModel):
    session_id: str
    topic: str
    fighter_a: str
    fighter_b: str
    max_turns: int = Field(default=4, ge=2, le=12)
    status: str = "initialized"
    turns: list[Turn] = Field(default_factory=list)
