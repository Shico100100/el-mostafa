"""
Core chat service — processes messages through NLP pipeline
and dispatches actions.
"""

import json
from typing import Any, Dict, List

from database.connection import db
from nlp.intents import classify_intent, INTENT_HELP, INTENT_CHAT_HISTORY, INTENT_GENERATE_REPORT, INTENT_UNKNOWN
from nlp.entities import extract_entities
from actions.registry import get_handler
from config import CHAT_HISTORY_LIMIT

HELP_TEXT = (
    "🤖 **المساعد الذكي** — الأوامر المتاحة:\n\n"
    "• `اعمل أمر إنتاج 500 كيلو PVC على ماكينة 2`\n"
    "• `كمية PVC المتوفرة`\n"
    "• `حالة أمر 42`\n"
    "• `المواد الناقصة`\n"
    "• `تقرير عن PVC`\n"
    "• `آخر 5 رسائل`\n"
    "• `مساعدة`\n"
    "• `عندك ملفات؟` (عرض المستندات)\n"
    "• `ابحث في المستندات عن PVC` (بحث في الملفات)"
)


def _save_message(user_id: int, text: str, sender: str,
                  intent: str = None, confidence: float = None,
                  entities: dict = None, result: str = None):
    db.execute(
        """
        INSERT INTO chatbot_logs
            (user_id, message_text, sender_type, detected_intent,
             intent_confidence, entities_json, action_result)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        """,
        (user_id, text, sender, intent, confidence,
         json.dumps(entities) if entities else None, result),
    )


def _get_history(user_id: int, limit: int = CHAT_HISTORY_LIMIT) -> List[Dict[str, Any]]:
    rows = db.fetch_all(
        """
        SELECT id, user_id, message_text, sender_type, detected_intent,
               intent_confidence, entities_json, action_result, created_at
        FROM chatbot_logs
        WHERE user_id = %s
        ORDER BY created_at DESC
        LIMIT %s
        """,
        (user_id, limit),
    )
    rows.reverse()
    return rows


def _build_context_text(history: List[Dict[str, Any]]) -> str:
    parts = []
    for h in history:
        label = "المستخدم" if h["sender_type"] == "user" else "المساعد"
        parts.append(f"{label}: {h['message_text']}")
    return "\n".join(parts)


async def process_message(user_id: int, message: str) -> Dict[str, Any]:
    _save_message(user_id, message, "user")

    history = _get_history(user_id)
    context = _build_context_text(history)

    intent, confidence = classify_intent(message)
    entities = extract_entities(message)

    if intent == INTENT_HELP:
        reply = HELP_TEXT
    elif intent == INTENT_CHAT_HISTORY:
        lines = ["📜 آخر الرسائل:"] if history else ["لا توجد رسائل سابقة."]
        for h in history[-5:]:
            who = "🧑 المستخدم" if h["sender_type"] == "user" else "🤖 المساعد"
            lines.append(f"  {who}: {h['message_text'][:100]}")
        reply = "\n".join(lines)
    elif intent == INTENT_UNKNOWN or confidence < 0.5:
        reply = (
            "لم أفهم طلبك. يمكنك استخدام:\n"
            "• استعلام عن مخزون\n"
            "• إنشاء أمر إنتاج\n"
            "• حالة أمر\n"
            "• تقارير\n"
            'أو اكتب "مساعدة" لعرض جميع الأوامر.'
        )
    else:
        handler = get_handler(intent)
        if handler:
            try:
                reply = await handler(entities, user_id)
            except Exception as e:
                reply = f"❌ حدث خطأ أثناء تنفيذ الأمر: {str(e)}"
        else:
            reply = f"تم التعرف على الأمر ({intent}) لكن لم يتم تنفيذه بعد."

    _save_message(user_id, reply, "bot", intent, confidence, entities, reply)

    return {
        "reply": reply,
        "detected_intent": intent,
        "confidence": confidence,
        "entities": entities,
        "history": history[-CHAT_HISTORY_LIMIT:],
    }
