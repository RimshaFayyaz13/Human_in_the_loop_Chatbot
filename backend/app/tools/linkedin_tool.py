import asyncio
from langchain_core.tools import tool


@tool
async def linkedin_profile_crawl(profile_url: str) -> dict:
    """Crawl a public LinkedIn profile and return a summary.
    Requires user approval. (Mocked — replace with real provider e.g. Proxycurl.)

    Args:
        profile_url: Full LinkedIn profile URL.
    """
    await asyncio.sleep(1.0)  # simulate network I/O
    # Mocked response. Plug in a real scraping/API provider here.
    return {
        "profile_url": profile_url,
        "name": "Jane Doe (mock)",
        "headline": "Senior Software Engineer",
        "location": "Toronto, Canada",
        "experience_years": 8,
        "skills": ["Python", "LangChain", "FastAPI", "Next.js"],
        "note": "This is mocked data — wire a real provider in linkedin_tool.py",
    }