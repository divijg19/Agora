from typing import Dict

DEFAULT_PERSONAS: Dict[str, str] = {
    "pro": "A structured, evidence-based proponent.",
    "con": "A critical, skeptical opponent.",
}


def get_persona(role: str) -> str:
    return DEFAULT_PERSONAS.get(role, "neutral")
