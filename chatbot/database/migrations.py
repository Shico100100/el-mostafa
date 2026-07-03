"""
Database migration: creates the chatbot_logs table in the existing ERP database.
Run once:  python -m database.migrations
"""

from database.connection import db

CREATE_CHATBOT_LOGS = """
CREATE TABLE IF NOT EXISTS chatbot_logs (
    id              BIGSERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL,
    message_text    TEXT NOT NULL,
    sender_type     VARCHAR(10) NOT NULL CHECK (sender_type IN ('user', 'bot')),
    detected_intent VARCHAR(64),
    intent_confidence REAL,
    entities_json   JSONB,
    action_result   TEXT,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
"""

CREATE_INDEX_USER_TIME = """
CREATE INDEX IF NOT EXISTS idx_chatbot_logs_user_created
    ON chatbot_logs (user_id, created_at DESC);
"""


def run_migrations():
    db.execute(CREATE_CHATBOT_LOGS)
    db.execute(CREATE_INDEX_USER_TIME)
    print("Migration: chatbot_logs table ready.")


if __name__ == "__main__":
    run_migrations()
