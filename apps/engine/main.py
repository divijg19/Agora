from contextlib import asynccontextmanager

from api.routes import router as debate_router
from domain.director import Director
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from infra.llm_client import HttpLLMClient


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.llm_client = HttpLLMClient()
    app.state.director = Director(llm_client=app.state.llm_client)
    yield
    await app.state.llm_client.aclose()


app = FastAPI(title="Agora Engine", version="0.0.2", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(debate_router, prefix="/api")


@app.get("/health")
async def health_check() -> dict[str, str]:
    return {"status": "ok", "system": "agora_engine"}
