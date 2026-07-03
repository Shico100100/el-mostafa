"""
Lightweight ERP AI Chatbot — FastAPI application entry point.

Usage:
    python main.py              # Start server on port 8765
    python -m database.migrations  # Run DB migrations once

Requires:
    pip install -r requirements.txt
    python -m spacy download ar_core_web_sm
"""

import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from config import CHATBOT_HOST, CHATBOT_PORT, ENTITY_REFRESH_INTERVAL_SEC, ALERT_CHECK_INTERVAL_SEC
from database.migrations import run_migrations
from nlp.entities import refresh_entities
from alerts.worker import check_stock_alerts
from chat.router import router as chat_router
from speech.router import router as speech_router
from data.loader import load_documents

# Force-register all action handlers (they self-register via @register decorator)
import actions.production  # noqa: F401
import actions.inventory  # noqa: F401
import actions.reports  # noqa: F401
import data.action  # noqa: F401

scheduler = AsyncIOScheduler()


@asynccontextmanager
async def lifespan(app: FastAPI):
    run_migrations()
    refresh_entities()
    load_documents()

    scheduler.add_job(
        refresh_entities,
        "interval",
        seconds=ENTITY_REFRESH_INTERVAL_SEC,
        id="refresh_entities",
        replace_existing=True,
    )
    scheduler.add_job(
        check_stock_alerts,
        "interval",
        seconds=ALERT_CHECK_INTERVAL_SEC,
        id="check_alerts",
        replace_existing=True,
    )
    scheduler.start()

    yield

    scheduler.shutdown(wait=False)
    from database.connection import db
    db.close()


app = FastAPI(
    title="ERP AI Chatbot",
    version="1.0.0",
    description="Lightweight rule-based chatbot for ERP system (Arabic).",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router)
app.include_router(speech_router)


@app.get("/health")
async def health():
    return {"status": "ok", "version": "1.0.0"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=CHATBOT_HOST, port=CHATBOT_PORT, reload=False)
