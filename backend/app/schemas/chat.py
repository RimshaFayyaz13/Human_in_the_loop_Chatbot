from typing import Literal, Optional, List, Any
from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    thread_id: str = Field(..., description="Unique conversation/thread id")
    message: str


class ApprovalRequest(BaseModel):
    thread_id: str
    decision: Literal["approve", "reject"]
    feedback: Optional[str] = None


class PendingApproval(BaseModel):
    tool_name: str
    tool_args: dict
    description: str


class ChatResponse(BaseModel):
    thread_id: str
    status: Literal["message", "awaiting_approval", "tool_done"]
    reply: Optional[str] = None
    pending: Optional[PendingApproval] = None
    tool_result: Optional[Any] = None


class HistoryMessage(BaseModel):
    role: str
    content: str


class HistoryResponse(BaseModel):
    thread_id: str
    messages: List[HistoryMessage]