from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.matchmaker import router as match_router
from app.api.stream import router as stream_router

app = FastAPI(title="Agora Engine", version="0.1.0")

# Aggressive CORS for Next.js (Arena) local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(match_router, prefix="/api/match")
app.include_router(stream_router, prefix="/api/stream")

# In-memory registry for active duels (v1 constraint: no database)
app.state.matches = {}


@app.get("/health")
async def health_check():
    return {"status": "ok", "system": "agora_engine"}
