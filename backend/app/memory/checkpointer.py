"""
Async SQLite-backed LangGraph checkpointer for persistent memory.
"""
import aiosqlite
from langgraph.checkpoint.sqlite.aio import AsyncSqliteSaver

from app.config import settings

_conn: aiosqlite.Connection | None = None
_saver: AsyncSqliteSaver | None = None


async def init_checkpointer() -> None:
    global _conn, _saver
    _conn = await aiosqlite.connect(settings.db_path)
    _saver = AsyncSqliteSaver(_conn)
    # Create internal tables if missing
    await _saver.setup()


async def close_checkpointer() -> None:
    global _conn
    if _conn is not None:
        await _conn.close()
        _conn = None


def get_checkpointer() -> AsyncSqliteSaver:
    if _saver is None:
        raise RuntimeError("Checkpointer not initialized")
    return _saver