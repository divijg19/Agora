from pydantic import BaseModel


class FighterPersona(BaseModel):
    name: str
    style: str
