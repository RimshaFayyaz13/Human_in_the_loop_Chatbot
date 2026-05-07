from langgraph.graph import StateGraph, START, END

from app.core.state import ChatState
from app.core.nodes import chatbot_node, tool_executor_node
from app.memory.checkpointer import get_checkpointer
from app.tools import SENSITIVE_TOOLS


def _route_after_chatbot(state: ChatState) -> str:
    last = state["messages"][-1]
    tool_calls = getattr(last, "tool_calls", None)

    # Only route to tools if there are actual tool calls
    if tool_calls and len(tool_calls) > 0:
        # Double check it's a sensitive tool we care about
        for call in tool_calls:
            if call["name"] in SENSITIVE_TOOLS:
                return "tools"
        return "tools"

    return END


def build_graph():
    g = StateGraph(ChatState)
    g.add_node("chatbot", chatbot_node)
    g.add_node("tools", tool_executor_node)

    g.add_edge(START, "chatbot")
    g.add_conditional_edges(
        "chatbot",
        _route_after_chatbot,
        {"tools": "tools", END: END}
    )
    g.add_edge("tools", "chatbot")

    return g.compile(
        checkpointer=get_checkpointer(),
        interrupt_before=["tools"],
    )


_compiled = None


def get_graph():
    global _compiled
    if _compiled is None:
        _compiled = build_graph()
    return _compiled