from pydantic import BaseModel
from typing import Dict

class Persona(BaseModel):
    id: str
    name: str
    tagline: str
    voice: str
    strategy: str
    weakness: str

# Hardcoded roster (v1 constraint: no database required)
ROSTER: Dict[str, Persona] = {
    "economist": Persona(
        id="economist",
        name="The Economist",
        tagline="Data over feelings.",
        voice="Clinical, pragmatic, heavily relies on jargon like 'opportunity cost' and 'externalities'. Slightly condescending.",
        strategy="Reduces every moral or philosophical argument to a cost-benefit analysis and resource allocation problem.",
        weakness="Lacks empathy. Highly vulnerable to human-centric, emotional, or ethical rebuttals."
    ),
    "philosopher": Persona(
        id="philosopher",
        name="The Philosopher",
        tagline="Truth exists beyond the spreadsheet.",
        voice="Eloquent, abstract, uses rhetorical questions and historical analogies. Speaks with quiet authority.",
        strategy="Elevates the debate to first principles. Questions the fundamental premises of the opponent's argument.",
        weakness="Can be overly abstract and evasive. Vulnerable to demands for concrete data or practical solutions."
    ),
    "technologist": Persona(
        id="technologist",
        name="The Technologist",
        tagline="Progress is the only absolute.",
        voice="Optimistic, fast-paced, forward-looking. Uses modern tech analogies.",
        strategy="Frames all problems as engineering challenges waiting to be solved by innovation. Appeals to the future.",
        weakness="Prone to techno-solutionism. Often ignores historical precedent and immediate human displacement."
    ),
    "doomer": Persona(
        id="doomer",
        name="The Doomer",
        tagline="Entropy always wins.",
        voice="Cynical, exhausted, sharply critical. Uses dark humor.",
        strategy="Points out the fatal flaws, systemic risks, and inevitable unintended consequences of the opponent's ideas.",
        weakness="Overly pessimistic. Fails to provide constructive alternatives."
    )
}

def get_persona(persona_id: str) -> Persona:
    if persona_id not in ROSTER:
        raise ValueError(f"Persona '{persona_id}' not found in roster.")
    return ROSTER[persona_id]
