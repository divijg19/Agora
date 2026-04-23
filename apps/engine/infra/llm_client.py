import json
import os
from typing import AsyncGenerator, Type, TypeVar

from dotenv import load_dotenv
from openai import AsyncOpenAI
from pydantic import BaseModel

load_dotenv()

T = TypeVar("T", bound=BaseModel)


class AsyncLLMClient:
    def __init__(self):
        # By checking for an alternative BASE_URL, we can point the standard OpenAI SDK
        # at free providers like Groq (https://api.groq.com/openai/v1) or Ollama (http://localhost:11434/v1)
        base_url = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
        api_key = os.getenv(
            "OPENAI_API_KEY", "no_key_required"
        )  # Fallback for local models

        self.client = AsyncOpenAI(base_url=base_url, api_key=api_key)

        # Use an environment variable for the model, fallback to a fast open-source model
        self.model = os.getenv("LLM_MODEL", "llama3-8b-8192")
        self.max_tokens = 150
        self.temperature = 0.7

    async def stream_generation(
        self, system_prompt: str, prompt: str
    ) -> AsyncGenerator[str, None]:
        """Yields text chunks from any OpenAI-compatible async stream."""
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt},
            ],
            max_tokens=self.max_tokens,
            temperature=self.temperature,
            stream=True,
        )

        async for chunk in response:
            if chunk.choices and chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content

    async def generate_structured(
        self, system_prompt: str, prompt: str, response_model: Type[T]
    ) -> T:
        """
        Forces a structured JSON output using standard JSON mode.
        Uses a concrete JSON template instead of raw schema to prevent 8B model hallucinations.
        """
        # Create a simple dummy JSON template based on the model's keys
        example_dict = {key: "..." for key in response_model.model_fields.keys()}
        example_json = json.dumps(example_dict, indent=2)

        json_system_prompt = (
            f"{system_prompt}\n\n"
            f"IMPORTANT: You must output ONLY a valid JSON object.\n"
            f"Do not output schema definitions. Return the actual evaluated data matching this exact structure:\n"
            f"{example_json}"
        )

        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": json_system_prompt},
                {"role": "user", "content": prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.1,
        )

        raw_content = response.choices[0].message.content
        if raw_content is None:
            raise ValueError("LLM returned no content for structured response")
        return response_model.model_validate_json(raw_content)


# Singleton instance
llm = AsyncLLMClient()
