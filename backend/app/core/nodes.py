from langchain_core.messages import SystemMessage, ToolMessage
from langchain_groq import ChatGroq

from app.config import settings
from app.tools import ALL_TOOLS

SYSTEM_PROMPT = """You are a friendly, conversational AI assistant with memory of the entire conversation.

## Personality
- Warm, helpful, and natural in conversation
- Remember everything the user tells you (name, preferences, context)
- Reply to greetings, small talk, and general questions like a normal assistant
- Keep responses concise unless the user asks for detail

## General Conversation (default mode)
For ANYTHING that is not explicitly a GitHub or LinkedIn request, just chat normally:
- "hi" / "hello" → greet back warmly
- "how are you" → respond naturally
- "what can you do?" → explain your capabilities
- "remember my name is X" → acknowledge and remember it
- General questions → answer directly from your knowledge

## Tools — ONLY use when user EXPLICITLY requests it
You have two tools available. Use them ONLY when the user clearly asks:

1. `github_repo_crawl` — use ONLY when user says something like:
   - "crawl the github repo X"
   - "analyze github repo owner/repo"
   - "what files are in github repo X"

2. `linkedin_profile_crawl` — use ONLY when user says something like:
   - "crawl this linkedin profile: [URL]"
   - "look up linkedin profile [URL]"
   - "get info from this linkedin: [URL]"

## IMPORTANT rules
- NEVER ask for a GitHub repo or LinkedIn URL unless the user already said they want to crawl one
- NEVER assume a tool is needed just because someone mentions GitHub or LinkedIn casually
- If the user says "crawl a linkedin profile" but hasn't given the URL yet, ask for the URL politely ONCE
- If the user says "hi" or anything conversational → just respond naturally, NO tool calls
- Do NOT explain that you need approval for tools unless you are actually about to call one"""


def build_llm():
    if not settings.groq_api_key:
        raise ValueError("No Groq API key found. Set GROQ_API_KEY in backend/.env")

    llm = ChatGroq(
        model=settings.groq_model,
        api_key=settings.groq_api_key,
        temperature=0.7,   # slightly higher = more natural conversation
    )
    return llm.bind_tools(ALL_TOOLS)


async def chatbot_node(state):
    llm = build_llm()
    messages = state["messages"]
    if not any(isinstance(m, SystemMessage) for m in messages):
        messages = [SystemMessage(content=SYSTEM_PROMPT)] + messages
    response = await llm.ainvoke(messages)
    return {"messages": [response]}


async def tool_executor_node(state):
    from app.tools import ALL_TOOLS

    tools_by_name = {t.name: t for t in ALL_TOOLS}
    last_msg = state["messages"][-1]
    tool_messages = []
    for call in last_msg.tool_calls:
        tool = tools_by_name.get(call["name"])
        if tool is None:
            content = f"Tool {call['name']} not found."
        else:
            try:
                result = await tool.ainvoke(call["args"])
                content = str(result)
            except Exception as e:
                content = f"Tool error: {e}"
        tool_messages.append(
            ToolMessage(content=content, tool_call_id=call["id"], name=call["name"])
        )
    return {"messages": tool_messages}