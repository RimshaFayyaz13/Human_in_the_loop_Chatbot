from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router
from app.config import settings
from app.memory.checkpointer import init_checkpointer, close_checkpointer


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_checkpointer()
    yield
    await close_checkpointer()


app = FastAPI(title="HITL Chatbot API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")


@app.get("/")
async def root():
    return {"status": "ok", "service": "hitl-chatbot"}