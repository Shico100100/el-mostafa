"""
Proactive alerting worker — checks stock thresholds every N seconds
and inserts alert messages into chatbot_logs for relevant users.

Runs as an APScheduler background job inside the FastAPI process.
Uses a dedicated database connection to avoid conflicts.
"""

from datetime import datetime
from database.connection import db
from config import ALERT_CHECK_INTERVAL_SEC

_LAST_RUN: datetime | None = None


def check_stock_alerts():
    global _LAST_RUN

    low_stock = db.fetch_all(
        """
        SELECT p.id, p.name, p.unit, p.min_stock,
               COALESCE(SUM(s.quantity), 0) AS total_qty
        FROM products p
        LEFT JOIN stock s ON s.product_id = p.id
        WHERE p.min_stock IS NOT NULL AND p.min_stock > 0
        GROUP BY p.id, p.name, p.unit, p.min_stock
        HAVING COALESCE(SUM(s.quantity), 0) < p.min_stock
        ORDER BY (COALESCE(SUM(s.quantity), 0)::decimal / p.min_stock) ASC
        """
    )

    if not low_stock:
        _LAST_RUN = datetime.now()
        return

    admin_users = db.fetch_all("SELECT id FROM users ORDER BY id LIMIT 5")

    items_str = "\n".join(
        f"⚠️ {r['name']}: {float(r['total_qty']):.1f} / {float(r['min_stock']):.1f}"
        for r in low_stock[:10]
    )
    alert = (
        f"🚨 إنذار مخزون ({datetime.now().strftime('%H:%M')}):\n"
        f"{items_str}\n"
        f"إجمالي {len(low_stock)} منتجات تحت حد الأمان."
    )

    for u in admin_users:
        db.execute(
            """
            INSERT INTO chatbot_logs
                (user_id, message_text, sender_type, detected_intent)
            VALUES (%s, %s, 'bot', 'LOW_STOCK_ALERTS')
            """,
            (u["id"], alert),
        )

    if _LAST_RUN is None:
        print(f"[Alerts] Initial check: {len(low_stock)} products low.")
    else:
        print(f"[Alerts] {len(low_stock)} products low — alert sent to {len(admin_users)} admin(s).")

    _LAST_RUN = datetime.now()
