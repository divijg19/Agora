from typing import List


def build_debate_prompt(topic: str, personas: List[str]) -> str:
    prompt = f"Debate topic: {topic}\n" + "\n".join(personas)
    return prompt
