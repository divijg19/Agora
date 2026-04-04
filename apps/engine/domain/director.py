from typing import Protocol
from uuid import uuid4

from domain.judge import select_winner
from domain.personas import FighterPersona, resolve_persona
from domain.prompt_builder import (
    build_system_prompt,
    build_turn_prompt,
    resolve_turn_intent,
)
from domain.schemas import DebateState, Turn


class CompletionClient(Protocol):
    async def stream_complete(self, system_prompt: str, user_prompt: str): ...


class Director:
    def __init__(self, llm_client: CompletionClient):
        self._llm_client = llm_client
        self._sessions: dict[str, DebateState] = {}
        self._personas: dict[str, tuple[FighterPersona, FighterPersona]] = {}

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
        self._personas[session_id] = (
            resolve_persona(fighter_a),
            resolve_persona(fighter_b),
        )
        return state

    def has_session(self, session_id: str) -> bool:
        return session_id in self._sessions

    async def stream_session(self, session_id: str):
        state = self._sessions[session_id]
        state.status = "active"
        persona_a, persona_b = self._personas[session_id]

        speakers = [persona_a, persona_b]
        for turn_index in range(1, state.max_turns + 1):
            speaker = speakers[(turn_index - 1) % 2]
            opponent = speakers[turn_index % 2]
            intent = resolve_turn_intent(
                turn_index=turn_index, max_turns=state.max_turns
            )
            yield (
                "turn_start",
                {"turn": turn_index, "speaker": speaker.name, "intent": intent},
            )

            opponent_last_argument = self._last_argument_by_speaker(
                state, opponent.name
            )
            system_prompt = build_system_prompt()
            user_prompt = build_turn_prompt(
                state=state,
                persona=speaker,
                opponent_last_argument=opponent_last_argument,
                intent=intent,
            )

            full_text = ""
            async for chunk in self._llm_client.stream_complete(
                system_prompt, user_prompt
            ):
                if not chunk:
                    continue
                full_text += chunk
                yield (
                    "chunk",
                    {"turn": turn_index, "speaker": speaker.name, "text": chunk},
                )

            if not full_text.strip():
                full_text = "I reject your frame; your assumptions are broad while mine are testable and more resilient."

            state.turns.append(
                Turn(
                    index=turn_index,
                    speaker=speaker.name,
                    intent=intent,
                    text=full_text.strip(),
                )
            )
            yield (
                "turn_end",
                {
                    "turn": turn_index,
                    "speaker": speaker.name,
                    "intent": intent,
                    "text": full_text.strip(),
                },
            )

        winner = select_winner(state)
        state.status = "completed"
        yield (
            "result",
            {
                "winner": winner,
                "reason": "deterministic judge over accumulated turn quality",
                "turns": state.max_turns,
            },
        )

    @staticmethod
    def _last_argument_by_speaker(state: DebateState, speaker_name: str) -> str:
        for turn in reversed(state.turns):
            if turn.speaker == speaker_name:
                return turn.text
        return ""
