from domain.schemas import MatchState, JudgeVerdict
from domain.personas import get_persona
from infra.llm_client import llm


async def evaluate_match(state: MatchState) -> JudgeVerdict:
    """
    Evaluates the entire debate transcript and outputs a structured Pydantic verdict.
    """
    fighter_a = get_persona(state.fighter_a)
    fighter_b = get_persona(state.fighter_b)

    # Reconstruct the transcript for the judge
    history_lines = []
    for turn in state.turns:
        p = get_persona(turn.speaker_id)
        history_lines.append(f"[{p.name}]: {turn.text}")

    history_str = "\n\n".join(history_lines)

    system_prompt = f"""You are the impartial, theatrical AI Judge of a debate arena.
Your job is to evaluate the debate between {fighter_a.name} and {fighter_b.name}.
You must declare an absolute winner based on:
1. Logical consistency
2. Effectiveness of rebuttals
3. Adherence to their theatrical persona

Be harsh, critical, concise, and highly entertaining."""

    user_prompt = f"""Topic: {state.topic}

Debate Transcript:
{history_str}

Evaluate both fighters, state your punchline reasoning, and declare the absolute winner.
The winner_id MUST be exactly either '{fighter_a.id}' or '{fighter_b.id}'."""

    verdict = await llm.generate_structured(
        system_prompt=system_prompt,
        prompt=user_prompt,
        response_model=JudgeVerdict,
    )

    return verdict
