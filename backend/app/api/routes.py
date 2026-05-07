from fastapi import APIRouter, BackgroundTasks, HTTPException

from app.schemas.chat import (
    ChatRequest,
    ChatResponse,
    ApprovalRequest,
    HistoryResponse,
    HistoryMessage,
)
from app.services import chat_service

router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    try:
        return await chat_service.send_message(req.thread_id, req.message)
    except Exception as e:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/approval", response_model=ChatResponse)
async def approval(req: ApprovalRequest, background: BackgroundTasks):
    """
    Approve or reject the pending tool call.
    Tool execution happens asynchronously inside the graph (await), and FastAPI's
    BackgroundTasks is wired in for any post-processing you want to add.
    """
    try:
        result = await chat_service.resume_after_approval(
            req.thread_id, req.decision, req.feedback
        )
        background.add_task(_post_tool_hook, req.thread_id, req.decision)
        return result
    except Exception as e:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history/{thread_id}", response_model=HistoryResponse)
async def history(thread_id: str):
    msgs = await chat_service.get_history(thread_id)
    return HistoryResponse(
        thread_id=thread_id,
        messages=[HistoryMessage(**m) for m in msgs if m["content"]],
    )


async def _post_tool_hook(thread_id: str, decision: str) -> None:
    # Place audit logging / metrics / notifications here.
    print(f"[audit] thread={thread_id} decision={decision}")