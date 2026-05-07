import asyncio
import httpx
from langchain_core.tools import tool

from app.config import settings


@tool
async def github_repo_crawl(owner: str, repo: str) -> dict:
    """Crawl a public GitHub repository and return basic metadata
    (description, stars, language, top-level files). Requires user approval.

    Args:
        owner: GitHub username or organization name.
        repo: Repository name.
    """
    headers = {"Accept": "application/vnd.github+json"}
    if settings.github_token:
        headers["Authorization"] = f"Bearer {settings.github_token}"

    async with httpx.AsyncClient(timeout=20) as client:
        # Simulate latency to demonstrate async background execution
        await asyncio.sleep(0.5)
        meta = await client.get(
            f"https://api.github.com/repos/{owner}/{repo}", headers=headers
        )
        if meta.status_code != 200:
            return {"error": f"GitHub API error {meta.status_code}", "body": meta.text}
        m = meta.json()

        contents = await client.get(
            f"https://api.github.com/repos/{owner}/{repo}/contents", headers=headers
        )
        files = (
            [c["name"] for c in contents.json()]
            if contents.status_code == 200
            else []
        )

        return {
            "full_name": m.get("full_name"),
            "description": m.get("description"),
            "stars": m.get("stargazers_count"),
            "language": m.get("language"),
            "default_branch": m.get("default_branch"),
            "top_level_files": files[:30],
        }