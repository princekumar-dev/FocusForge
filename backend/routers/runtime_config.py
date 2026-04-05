from core.config import settings
from fastapi import APIRouter

router = APIRouter(tags=["runtime-config"])


@router.get("/api/config")
async def get_runtime_config():
    """Expose the minimal runtime config the frontend needs in local/dev mode."""
    return {"API_BASE_URL": settings.backend_url}
