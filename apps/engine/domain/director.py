import asyncio
from typing import AsyncGenerator, Tuple
from domain.schemas import MatchState, TurnIntent, DebateTurn
from domain.personas import get_persona
from infra.llm_client import llm


def get_turn_intent(current_turn: int, max_turns: int) -> TurnIntent:
    """Calculates the dramatic intent of the turn based on progression."""
    if current_turn < 2:
        return TurnIntent.OPENING
    elif current_turn >= max_turns - 2:
        return TurnIntent.CLOSING
    elif current_turn % 2 == 0:
        return TurnIntent.COUNTER
    else:
        return TurnIntent.REBUTTAL


def get_intent_instruction(intent: TurnIntent) -> str:
    """Maps intent to strict LLM directives."""
    instructions = {
        TurnIntent.OPENING: "Establish your fundamental stance on the topic. Be bold and provocative.",
        TurnIntent.COUNTER: "Directly attack the core premise of your opponent's last message.",
        TurnIntent.DEEPENING: "Expand on your original premise with a powerful new angle or analogy.",
        TurnIntent.REBUTTAL: "Identify a logical fallacy or weakness in the opponent's argument and exploit it.",
        TurnIntent.CLOSING: "Deliver a final, mic-drop summary of why your philosophy triumphs. No new arguments.",
    }
    return instructions[intent]


def build_prompts(
    state: MatchState, speaker_id: str, intent: TurnIntent
) -> Tuple[str, str]:
    """Compiles the System and User prompts for the LLM."""
    persona = get_persona(speaker_id)

    # Compile History
    history_lines = []
    for turn in state.turns:
        p = get_persona(turn.speaker_id)
        history_lines.append(f"[{p.name}]: {turn.text}")

    history_str = (
        "\n\n".join(history_lines)
        if history_lines
        else "(The debate is just beginning.)"
    )

    system_prompt = f"""You are an AI actor in a theatrical debate game.
Your Persona: {persona.name} ({persona.tagline})
Voice: {persona.voice}
Strategy: {persona.strategy}
Weakness: {persona.weakness}

STRICT RULES:
- NEVER break character.
- NEVER use pleasantries (e.g., "Hello", "As an AI", "I understand").
- Keep it punchy, dramatic, and concise. Maximum 4 sentences per turn.
- Speak directly to the audience or your opponent."""

    user_prompt = f"""Topic: {state.topic}

Debate History:
{history_str}

Your Role This Turn: {intent.name}
Instruction: {get_intent_instruction(intent)}

Deliver your turn now."""

    return system_prompt, user_prompt


async def execute_turn(state: MatchState) -> AsyncGenerator[Tuple[str, str], None]:
    """
    Executes a single turn.
    Yields internal engine events: ("start", speaker_id), ("chunk", text), ("end", full_text)
    Mutates the state by appending the completed turn.
    """
    if state.current_turn_count >= state.max_turns:
        return

    # Determine whose turn it is (Fighter A goes first on evens, B on odds)
    is_fighter_a = state.current_turn_count % 2 == 0
    speaker_id = state.fighter_a if is_fighter_a else state.fighter_b

    intent = get_turn_intent(state.current_turn_count, state.max_turns)
    system_prompt, user_prompt = build_prompts(state, speaker_id, intent)

    # 1. Signal Turn Start
    yield ("start", speaker_id)

    # 2. Stream generation
    full_text = ""
    generator = llm.stream_generation(system_prompt, user_prompt)
    async for chunk in generator:
        full_text += chunk
        yield ("chunk", chunk)

    # 3. Update state in memory
    completed_turn = DebateTurn(
        speaker_id=speaker_id,
        text=full_text.strip(),
        intent=intent,
    )
    state.turns.append(completed_turn)
    state.current_turn_count += 1

    # 4. Signal Turn End
    yield ("end", full_text.strip())

    # Let the frontend typewriter and user finish reading before next turn starts.
    await asyncio.sleep(2.5)
