import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(dotenv_path=Path(__file__).resolve().parent.parent / ".env")


DB_CONFIG = {
    "host": os.getenv("DATABASE_HOST", "localhost"),
    "port": int(os.getenv("DATABASE_PORT", 5432)),
    "dbname": os.getenv("DATABASE_NAME", "elmostafa_db"),
    "user": os.getenv("DATABASE_USERNAME", "postgres"),
    "password": os.getenv("DATABASE_PASSWORD", "postgres"),
}

JWT_SECRET = os.getenv("AUTH_JWT_SECRET", "change-me-in-production")

CHATBOT_PORT = int(os.getenv("CHATBOT_PORT", "8765"))
CHATBOT_HOST = os.getenv("CHATBOT_HOST", "0.0.0.0")

CHAT_HISTORY_LIMIT = int(os.getenv("CHAT_HISTORY_LIMIT", "5"))

ENTITY_REFRESH_INTERVAL_SEC = int(os.getenv("ENTITY_REFRESH_INTERVAL_SEC", "300"))

ALERT_CHECK_INTERVAL_SEC = int(os.getenv("ALERT_CHECK_INTERVAL_SEC", "180"))

REPORT_OUTPUT_DIR = Path(__file__).resolve().parent / "reports"
REPORT_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
