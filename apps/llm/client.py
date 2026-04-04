from typing import Optional

import openai


class OpenAIClient:
    def __init__(self, api_key: Optional[str] = None):
        if api_key:
            openai.api_key = api_key

    def completion(self, **kwargs):
        # Placeholder: call to OpenAI completion API
        return openai.Completion.create(**kwargs)
