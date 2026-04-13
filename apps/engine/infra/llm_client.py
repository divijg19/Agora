import os
import json
from typing import AsyncGenerator, Type, TypeVar
from pydantic import BaseModel
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()

T = TypeVar('T', bound=BaseModel)


class AsyncLLMClient:
    def __init__(self):
        # By checking for an alternative BASE_URL, we can point the standard OpenAI SDK 
        # at free providers like Groq (https://api.groq.com/openai/v1) or Ollama (http://localhost:11434/v1)
        base_url = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
        api_key = os.getenv("OPENAI_API_KEY", "no_key_required") # Fallback for local models
        
        self.client = AsyncOpenAI(
            base_url=base_url,
            api_key=api_key
        )

        # Use an environment variable for the model, fallback to a fast open-source model
        self.model = os.getenv("LLM_MODEL", "llama3-8b-8192")
        self.max_tokens = 150
        self.temperature = 0.7

    async def stream_generation(self, system_prompt: str, prompt: str) -> AsyncGenerator[str, None]:
        """Yields text chunks from any OpenAI-compatible async stream."""
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ],
            max_tokens=self.max_tokens,
            temperature=self.temperature,
            stream=True
        )

        async for chunk in response:
            if chunk.choices and chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content

    async def generate_structured(self, system_prompt: str, prompt: str, response_model: Type[T]) -> T:
        """
        Forces a structured JSON output using standard JSON mode (supported by open models)
        instead of the proprietary OpenAI beta.parse method.
        """
        # Inject the expected schema into the system prompt to guide open models
        schema_str = json.dumps(response_model.model_json_schema())
        json_system_prompt = f"{system_prompt}\n\nIMPORTANT: You must return a valid JSON object matching this exact schema:\n{schema_str}"

        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": json_system_prompt},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.1, # Lower temperature for judging precision
        )
        
        raw_content = response.choices[0].message.content
        # Validate the raw JSON string directly into our Pydantic model
        return response_model.model_validate_json(raw_content)

# Singleton instance
llm = AsyncLLMClient()
