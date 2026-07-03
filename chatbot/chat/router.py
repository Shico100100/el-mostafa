"""
FastAPI router for chat endpoints.
"""

from fastapi import APIRouter, HTTPException
from chat.models import MessageRequest, MessageResponse
from chat.service import process_message, _get_history

router = APIRouter(prefix="/api/chatbot", tags=["chatbot"])


@router.post("/message", response_model=MessageResponse)
async def send_message(req: MessageRequest):
    if not req.message.strip():
        raise HTTPException(400, detail="الرسالة لا يمكن أن تكون فارغة.")
    result = await process_message(req.user_id, req.message.strip())
    return MessageResponse(**result)


@router.get("/history/{user_id}")
async def get_history(user_id: int, limit: int = 5):
    if limit < 1 or limit > 100:
        limit = 5
    rows = _get_history(user_id, limit)
    return {"user_id": user_id, "messages": rows}


@router.get("/help")
async def help_text():
    return {
        "intents": [
            "CREATE_PRODUCTION_ORDER",
            "QUERY_STOCK",
            "QUERY_ORDER_STATUS",
            "LOW_STOCK_ALERTS",
            "GENERATE_REPORT",
            "CHAT_HISTORY",
            "HELP",
        ],
        "examples": {
            "production_order": "اعمل أمر إنتاج 500 كيلو PVC على ماكينة 2",
            "stock_query": "كمية PVC المتوفرة",
            "order_status": "حالة أمر 42",
            "alerts": "المواد الناقصة",
            "report": "تقرير عن PVC",
            "history": "آخر 5 رسائل",
        },
    }
