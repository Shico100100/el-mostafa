from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional
from datetime import datetime


class MessageRequest(BaseModel):
    user_id: int = Field(..., description="ERP user ID")
    message: str = Field(..., min_length=1, description="Arabic message text")


class MessageResponse(BaseModel):
    reply: str
    detected_intent: str
    confidence: float
    entities: Dict[str, Any]
    history: List[Dict[str, Any]]


class ChatLogEntry(BaseModel):
    id: int
    user_id: int
    message_text: str
    sender_type: str
    detected_intent: Optional[str] = None
    intent_confidence: Optional[float] = None
    entities_json: Optional[Dict[str, Any]] = None
    action_result: Optional[str] = None
    created_at: datetime
