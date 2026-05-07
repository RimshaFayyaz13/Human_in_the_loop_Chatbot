"""
Service layer that drives the LangGraph and surfaces HITL events to the API.
"""
from typing import Optional

from langchain_core.messages import HumanMessage, AIMessage, ToolMessage

from app.core.graph import get_graph
from app.schemas.chat import ChatResponse, PendingApproval
from app.tools import SENSITIVE_TOOLS


def _config(thread_id: str) -> dict:
    return {"configurable": {"thread_id": thread_id}}


async def _check_pending_approval(thread_id: str) -> Optional[PendingApproval]:
    graph = get_graph()
    state = await graph.aget_state(_config(thread_id))
    # If the next node to run is "tools", we have a pending approval
    if state.next and "tools" in state.next:
        last = state.values["messages"][-1]
        for call in getattr(last, "tool_calls", []) or []:
            if call["name"] in SENSITIVE_TOOLS:
                return PendingApproval(
                    tool_name=call["name"],
                    tool_args=call["args"],
                    description=_describe(call["name"], call["args"]),
                )
    return None


def _describe(tool_name: str, args: dict) -> str:
    if tool_name == "github_repo_crawl":
        return f"Crawl GitHub repo {args.get('owner')}/{args.get('repo')}"
    if tool_name == "linkedin_profile_crawl":
        return f"Crawl LinkedIn profile {args.get('profile_url')}"
    return f"Run tool {tool_name} with args {args}"


async def send_message(thread_id: str, user_message: str) -> ChatResponse:
    graph = get_graph()
    cfg = _config(thread_id)

    # Stream until the graph either finishes or interrupts before "tools"
    async for _ in graph.astream(
        {"messages": [HumanMessage(content=user_message)]}, cfg, stream_mode="values"
    ):
        pass

    pending = await _check_pending_approval(thread_id)
    if pending:
        return ChatResponse(
            thread_id=thread_id, status="awaiting_approval", pending=pending
        )

    state = await graph.aget_state(cfg)
    last = state.values["messages"][-1]
    return ChatResponse(thread_id=thread_id, status="message", reply=last.content)


async def resume_after_approval(
    thread_id: str, decision: str, feedback: Optional[str]
) -> ChatResponse:
    graph = get_graph()
    cfg = _config(thread_id)
    state = await graph.aget_state(cfg)

    if decision == "reject":
        # Replace the AI's tool-call message with a plain refusal so the loop continues
        last = state.values["messages"][-1]
        rejection_text = (
            f"(User rejected the requested tool call. Reason: {feedback or 'no reason given'}). "
            "Please continue the conversation without calling that tool."
        )
        await graph.aupdate_state(
            cfg,
            {"messages": [AIMessage(content=rejection_text, id=last.id)]},
        )
        # Resume — chatbot node will run next and produce a normal reply
        async for _ in graph.astream(None, cfg, stream_mode="values"):
            pass
        new_state = await graph.aget_state(cfg)
        return ChatResponse(
            thread_id=thread_id,
            status="message",
            reply=new_state.values["messages"][-1].content,
        )

    # APPROVE → resume so "tools" node executes asynchronously, then chatbot replies
    tool_result = None
    async for event in graph.astream(None, cfg, stream_mode="values"):
        msgs = event.get("messages", [])
        for m in msgs:
            if isinstance(m, ToolMessage):
                tool_result = m.content

    new_state = await graph.aget_state(cfg)
    return ChatResponse(
        thread_id=thread_id,
        status="tool_done",
        reply=new_state.values["messages"][-1].content,
        tool_result=tool_result,
    )


async def get_history(thread_id: str):
    graph = get_graph()
    state = await graph.aget_state(_config(thread_id))
    out = []
    for m in state.values.get("messages", []) if state.values else []:
        role = m.__class__.__name__.replace("Message", "").lower()
        if role == "human":
            role = "user"
        elif role == "ai":
            role = "assistant"
        out.append({"role": role, "content": m.content if isinstance(m.content, str) else str(m.content)})
    return out