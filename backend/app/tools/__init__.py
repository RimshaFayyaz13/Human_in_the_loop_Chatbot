from app.tools.github_tool import github_repo_crawl
from app.tools.linkedin_tool import linkedin_profile_crawl

ALL_TOOLS = [
    github_repo_crawl,
    linkedin_profile_crawl
]
SENSITIVE_TOOLS = {"github_repo_crawl", "linkedin_profile_crawl"}