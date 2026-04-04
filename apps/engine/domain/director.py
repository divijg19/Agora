import asyncio
from typing import Protocol
from uuid import uuid4

from domain.judge import select_winner
from domain.schemas import DebateState, Turn


class CompletionClient(Protocol):
    async def complete(self, system_prompt: str, user_prompt: str) -> str: ...


class Director:
    def __init__(self, llm_client: CompletionClient):
        self._llm_client = llm_client
        self._sessions: dict[str, DebateState] = {}

    def create_session(
        self, topic: str, fighter_a: str, fighter_b: str, max_turns: int = 4
    ) -> DebateState:
        session_id = str(uuid4())
        state = DebateState(
            session_id=session_id,
            topic=topic,
            fighter_a=fighter_a,
            fighter_b=fighter_b,
            max_turns=max_turns,
            status="initialized",
        )
        self._sessions[session_id] = state
        return state

    def has_session(self, session_id: str) -> bool:
        return session_id in self._sessions

    async def stream_session(self, session_id: str):
        state = self._sessions[session_id]
        state.status = "active"

        speakers = [state.fighter_a, state.fighter_b]
        for turn_index in range(1, state.max_turns + 1):
            speaker = speakers[(turn_index - 1) % 2]
            yield "turn_start", {"turn": turn_index, "speaker": speaker}

            chunks = self._mock_chunks(state.topic, speaker, turn_index)
            full_text = ""
            for chunk in chunks:
                full_text += chunk
                yield "chunk", {"turn": turn_index, "speaker": speaker, "text": chunk}
                await asyncio.sleep(0.03)

            state.turns.append(Turn(index=turn_index, speaker=speaker, text=full_text))
            yield (
                "turn_end",
                {"turn": turn_index, "speaker": speaker, "text": full_text},
            )

        winner = select_winner(state)
        state.status = "completed"
        yield (
            "result",
            {
                "winner": winner,
                "reason": "deterministic mock judge",
                "turns": state.max_turns,
            },
        )

    @staticmethod
    def _mock_chunks(topic: str, speaker: str, turn_index: int) -> list[str]:
        base = f"{speaker} argues about '{topic}' on turn {turn_index}."
        return [base[: len(base) // 2], base[len(base) // 2 :]]
