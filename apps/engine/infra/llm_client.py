import os
from typing import Protocol

import httpx


class LLMClient(Protocol):
    async def complete(self, system_prompt: str, user_prompt: str) -> str: ...


class HttpLLMClient:
    """OpenAI-compatible HTTP client; defaults to deterministic stub when unset."""

    def __init__(
        self,
        base_url: str | None = None,
        api_key: str | None = None,
        model: str = "gpt-4o-mini",
    ):
        self.base_url = (base_url or os.getenv("LLM_BASE_URL") or "").rstrip("/")
        self.api_key = api_key or os.getenv("LLM_API_KEY") or ""
        self.model = model
        self._client = httpx.AsyncClient(timeout=30.0)

    async def complete(self, system_prompt: str, user_prompt: str) -> str:
        if not self.base_url or not self.api_key:
            return f"[mocked completion] {user_prompt[:160]}"

        response = await self._client.post(
            f"{self.base_url}/v1/chat/completions",
            headers={"Authorization": f"Bearer {self.api_key}"},
            json={
                "model": self.model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                "temperature": 0.2,
            },
        )
        response.raise_for_status()
        body = response.json()
        return body["choices"][0]["message"]["content"]

    async def aclose(self) -> None:
        await self._client.aclose()
