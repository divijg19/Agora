from pydantic import BaseModel


class FighterPersona(BaseModel):
    name: str
    voice: str
    strategy: str
    weakness: str | None = None


DEFAULT_PERSONAS: dict[str, FighterPersona] = {
    "socratic": FighterPersona(
        name="Socratic",
        voice="Measured, probing, logical",
        strategy="Expose assumptions through targeted questions then land concise claims",
        weakness="Over-questioning can feel evasive",
    ),
    "dialectic": FighterPersona(
        name="Dialectic",
        voice="Bold, direct, synthesis-oriented",
        strategy="Absorb opponent points, then reframe and compress into decisive conclusions",
        weakness="May over-compress nuance",
    ),
    "stoic": FighterPersona(
        name="Stoic",
        voice="Calm, austere, principle-first",
        strategy="Anchor arguments in first principles and practical discipline",
        weakness="Can sound emotionally detached",
    ),
    "rhetor": FighterPersona(
        name="Rhetor",
        voice="Vivid, assertive, audience-aware",
        strategy="Pair sharp framing with memorable contrasts and punchy closure",
        weakness="May prioritize style over precision",
    ),
}


def resolve_persona(name: str) -> FighterPersona:
    key = name.strip().lower()
    preset = DEFAULT_PERSONAS.get(key)
    if preset:
        return preset.model_copy(deep=True)

    return FighterPersona(
        name=name.strip() or "Contender",
        voice="Clear, assertive, analytical",
        strategy="Concede little, rebut directly, and end each turn with one concrete claim",
        weakness=None,
    )
