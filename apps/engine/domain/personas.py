from typing import Dict

from pydantic import BaseModel

SPRITE_BASE = "/sprites"


class Persona(BaseModel):
    id: str
    name: str
    tagline: str
    voice: str
    strategy: str
    weakness: str
    color: str
    animations: Dict[str, str]


def get_sprite_animations(name: str) -> Dict[str, str]:
    base = f"{SPRITE_BASE}/{name}"
    idle = f"{base}/{name}_Idle.gif"
    pointing = f"{base}/{name}_Pointing.gif"
    return {
        "idle": idle,
        "pointing": pointing,
        "attack": pointing,
        "stun": idle,
        "special": pointing,
    }


ROSTER: Dict[str, Persona] = {
    "economist": Persona(
        id="economist",
        name="The Economist",
        tagline="Data over feelings.",
        voice="Clinical, pragmatic, heavily relies on jargon like 'opportunity cost' and 'externalities'. Slightly condescending.",
        strategy="Reduces every moral or philosophical argument to a cost-benefit analysis and resource allocation problem.",
        weakness="Lacks empathy. Highly vulnerable to human-centric, emotional, or ethical rebuttals.",
        color="bg-blue-600",
        animations=get_sprite_animations("Economist"),
    ),
    "philosopher": Persona(
        id="philosopher",
        name="The Philosopher",
        tagline="Truth exists beyond the spreadsheet.",
        voice="Eloquent, abstract, uses rhetorical questions and historical analogies. Speaks with quiet authority.",
        strategy="Elevates the debate to first principles. Questions the fundamental premises of the opponent's argument.",
        weakness="Can be overly abstract and evasive. Vulnerable to demands for concrete data or practical solutions.",
        color="bg-purple-600",
        animations=get_sprite_animations("Philosopher"),
    ),
    "technologist": Persona(
        id="technologist",
        name="The Technologist",
        tagline="Progress is the only absolute.",
        voice="Optimistic, fast-paced, forward-looking. Uses modern tech analogies.",
        strategy="Frames all problems as engineering challenges waiting to be solved by innovation. Appeals to the future.",
        weakness="Prone to techno-solutionism. Often ignores historical precedent and immediate human displacement.",
        color="bg-green-600",
        animations=get_sprite_animations("Technologist"),
    ),
    "doomer": Persona(
        id="doomer",
        name="The Doomer",
        tagline="Entropy always wins.",
        voice="Cynical, exhausted, sharply critical. Uses dark humor.",
        strategy="Points out the fatal flaws, systemic risks, and inevitable unintended consequences of the opponent's ideas.",
        weakness="Overly pessimistic. Fails to provide constructive alternatives.",
        color="bg-red-600",
        animations=get_sprite_animations("Doomer"),
    ),
}


def get_persona(persona_id: str) -> Persona:
    if persona_id not in ROSTER:
        raise ValueError(f"Persona '{persona_id}' not found in roster.")
    return ROSTER[persona_id]
