from domain.schemas import DebateState


def build_turn_prompt(state: DebateState, speaker: str, turn_index: int) -> str:
    return (
        f"Topic: {state.topic}. "
        f"Speaker: {speaker}. "
        f"Turn: {turn_index}. "
        "Respond with a concise argument only."
    )
