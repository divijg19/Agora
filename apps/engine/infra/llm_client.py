import json
import os
from typing import Protocol

import httpx


class LLMClient(Protocol):
    async def stream_complete(self, system_prompt: str, user_prompt: str): ...


class HttpLLMClient:
    """OpenAI-compatible HTTP client; defaults to deterministic stub when unset."""

    def __init__(
        self,
        base_url: str | None = None,
        api_key: str | None = None,
        model: str = "gpt-4o-mini",
        max_tokens: int = 120,
    ):
        self.base_url = (base_url or os.getenv("LLM_BASE_URL") or "").rstrip("/")
        self.api_key = api_key or os.getenv("LLM_API_KEY") or ""
        self.model = model
        self.max_tokens = max_tokens
        self._client = httpx.AsyncClient(timeout=30.0)

    async def stream_complete(self, system_prompt: str, user_prompt: str):
        if not self.base_url or not self.api_key:
            for chunk in self._mock_stream(user_prompt):
                yield chunk
            return

        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": 0.5,
            "max_tokens": self.max_tokens,
            "stream": True,
        }

        async with self._client.stream(
            "POST",
            f"{self.base_url}/v1/chat/completions",
            headers={"Authorization": f"Bearer {self.api_key}"},
            json=payload,
        ) as response:
            response.raise_for_status()

            async for line in response.aiter_lines():
                if not line:
                    continue
                if not line.startswith("data:"):
                    continue

                raw_data = line[5:].strip()
                if raw_data == "[DONE]":
                    break

                try:
                    data = json.loads(raw_data)
                except json.JSONDecodeError:
                    continue

                delta = data.get("choices", [{}])[0].get("delta", {}).get("content")
                if delta:
                    yield delta

    @staticmethod
    def _mock_stream(user_prompt: str):
        name = HttpLLMClient._extract_field(user_prompt, "You are:") or "Debater"
        voice = (
            HttpLLMClient._extract_field(user_prompt, "Style:") or "clear and assertive"
        )
        strategy = (
            HttpLLMClient._extract_field(user_prompt, "Strategy:") or "direct rebuttal"
        )
        intent = HttpLLMClient._extract_field(user_prompt, "Your role:") or "Rebuttal"

        opponent_line = ""
        in_opponent_block = False
        for line in user_prompt.splitlines():
            if line.strip() == "Opponent said:":
                in_opponent_block = True
                continue
            if in_opponent_block and line.strip().startswith('"'):
                opponent_line = line.strip().strip('"')
                break

        intent_sentence = HttpLLMClient._intent_sentence(intent)
        if opponent_line and opponent_line != "No prior argument yet.":
            base = (
                f"As {name}, I challenge your claim: {opponent_line[:92]}. "
                f"My {voice.lower()} tone applies {strategy.lower()} to expose your weak link. "
                f"{intent_sentence} "
                "The stronger position is mine because it explains tradeoffs without hand-waving."
            )
        else:
            base = (
                f"As {name}, I open from first principles with a {voice.lower()} delivery. "
                f"My strategy is {strategy.lower()}, so I define the battleground before conceding nothing. "
                f"{intent_sentence} "
                "This frame gives my side the initiative and clearer burden of proof."
            )

        chunk_size = 36
        for i in range(0, len(base), chunk_size):
            yield base[i : i + chunk_size]

    @staticmethod
    def _extract_field(prompt: str, label: str) -> str:
        for line in prompt.splitlines():
            if line.startswith(label):
                return line.split(label, 1)[1].strip()
        return ""

    @staticmethod
    def _intent_sentence(intent: str) -> str:
        match intent:
            case "Opening":
                return "I establish the thesis, stakes, and standard for evaluating this debate."
            case "Counter":
                return "I directly counter your mechanism and re-center the argument on causality."
            case "Deepening":
                return "I deepen the case with second-order effects and practical implications."
            case "Rebuttal":
                return (
                    "I rebut your key premise and tighten my strongest line of attack."
                )
            case "Closing":
                return "I close by compressing the strongest evidence into a decisive final claim."
            case _:
                return (
                    "I advance a focused, testable claim that pressures your position."
                )

    async def aclose(self) -> None:
        await self._client.aclose()
