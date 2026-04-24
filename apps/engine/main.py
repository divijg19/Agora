from typing import cast, Any
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware import Middleware

from api.routes import router as api_router
from api.stream import router as stream_router
from api.health import router as health_router


app = FastAPI(
    title="Agora Engine",
    version="0.6.7",
    middleware=[
        Middleware(
            cast(Any, CORSMiddleware),
            allow_origins=["*"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )
    ],
)

app.include_router(health_router)
app.include_router(api_router, prefix="/api/match")
app.include_router(stream_router, prefix="/api/stream")

app.state.matches = {}
