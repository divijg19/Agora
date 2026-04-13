import os
from typing import AsyncGenerator, Type, TypeVar
from openai import AsyncOpenAI
from dotenv import load_dotenv
from pydantic import BaseModel

T = TypeVar('T', bound=BaseModel)

# Ensure environment variables are loaded (for OPENAI_API_KEY)
load_dotenv()


class AsyncLLMClient:
    def __init__(self):
        # Automatically picks up OPENAI_API_KEY from environment
        self.client = AsyncOpenAI()

        # Hard constraints for the spectacle engine
        self.model = "gpt-4o-mini"
        self.max_tokens = 150  # Keeps turns punchy
        self.temperature = 0.7 # Enough variance, but stays on rails

    async def stream_generation(self, system_prompt: str, prompt: str) -> AsyncGenerator[str, None]:
        """
        Yields text chunks directly from the OpenAI async stream.
        """
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
                # Yield raw string chunks
                yield chunk.choices[0].delta.content

    async def generate_structured(self, system_prompt: str, prompt: str, response_model: Type[T]) -> T:
        """
        Forces the LLM to return a strictly typed Pydantic object.
        Uses OpenAI's beta parse feature for guaranteed structured outputs.
        """
        response = await self.client.beta.chat.completions.parse(
            model=self.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ],
            response_format=response_model,
            temperature=0.2, # Lower temperature for analytical judging
        )
        # return the parsed Pydantic object directly
        return response.choices[0].message.parsed


# Singleton instance to be used across the app
llm = AsyncLLMClient()
