from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from typing import Any, cast
from api.routes import router as api_router
from api.stream import router as stream_router


app = FastAPI(title="Agora Engine", version="0.1.4")

app.add_middleware(
    cast(Any, CORSMiddleware),
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/match")
app.include_router(stream_router, prefix="/api/stream")

# In-memory registry for active matches
app.state.matches = {}


@app.get("/health")
async def health_check() -> dict[str, str]:
    return {"status": "ok", "system": "agora_engine"}
