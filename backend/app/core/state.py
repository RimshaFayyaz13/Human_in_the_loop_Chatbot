from typing import Annotated, TypedDict, List
from langgraph.graph.message import add_messages
from langchain_core.messages import BaseMessage


class ChatState(TypedDict):
    messages: Annotated[List[BaseMessage], add_messages]