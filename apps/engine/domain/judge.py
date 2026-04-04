from domain.schemas import DebateState


def select_winner(state: DebateState) -> str:
    if not state.turns:
        return state.fighter_a
    by_speaker: dict[str, int] = {state.fighter_a: 0, state.fighter_b: 0}
    for turn in state.turns:
        by_speaker[turn.speaker] = by_speaker.get(turn.speaker, 0) + len(turn.text)
    return max(by_speaker, key=by_speaker.get)
