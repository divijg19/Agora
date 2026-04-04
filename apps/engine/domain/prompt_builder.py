from domain.personas import FighterPersona
from domain.schemas import DebateState


def resolve_turn_intent(turn_index: int, max_turns: int) -> str:
    if turn_index == max_turns:
        return "Closing"
    if turn_index == 1:
        return "Opening"
    if turn_index == 2:
        return "Counter"
    if turn_index == 3:
        return "Deepening"
    if turn_index == 4:
        return "Rebuttal"
    return "Rebuttal"


def build_system_prompt() -> str:
    return (
        "You are an elite debate writer generating one turn in a staged intellectual duel. "
        "Write high-signal argumentation only. Keep claims concrete, avoid filler, and stay under 120 tokens."
    )


def build_turn_prompt(
    state: DebateState,
    persona: FighterPersona,
    opponent_last_argument: str,
    intent: str,
) -> str:
    weakness_line = (
        f"Weakness to avoid: {persona.weakness}\n" if persona.weakness else ""
    )
    opponent_block = opponent_last_argument.strip() or "No prior argument yet."

    return (
        f"Topic: {state.topic}\n\n"
        f"You are: {persona.name}\n"
        f"Style: {persona.voice}\n"
        f"Strategy: {persona.strategy}\n"
        f"{weakness_line}\n"
        "Opponent said:\n"
        f'"{opponent_block}"\n\n'
        f"Your role: {intent}\n\n"
        "Instructions:\n"
        "- Respond directly to opponent\n"
        "- Be concise (max 4 sentences)\n"
        "- Be sharp and persuasive\n"
        "- Avoid repetition\n"
        "- Stay under ~120 tokens\n"
    )
