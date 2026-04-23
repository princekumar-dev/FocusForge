import json
import logging
from datetime import datetime
from typing import List, Optional

from dependencies.auth import get_current_user
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from schemas.auth import UserResponse
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from services.user_profiles import User_profilesService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/entities/user_profiles", tags=["user_profiles"])


class User_profilesData(BaseModel):
    display_name: str = None
    avatar: str = None
    level: int = None
    xp: int = None
    total_xp: int = None
    energy: int = None
    max_energy: int = None
    streak: int = None
    best_streak: int = None
    streak_freezes: int = None
    personality_mode: str = None
    mood: str = None
    tree_stage: int = None
    tasks_completed: int = None
    focus_minutes: int = None
    created_at: Optional[datetime] = None


class User_profilesUpdateData(BaseModel):
    display_name: Optional[str] = None
    avatar: Optional[str] = None
    level: Optional[int] = None
    xp: Optional[int] = None
    total_xp: Optional[int] = None
    energy: Optional[int] = None
    max_energy: Optional[int] = None
    streak: Optional[int] = None
    best_streak: Optional[int] = None
    streak_freezes: Optional[int] = None
    personality_mode: Optional[str] = None
    mood: Optional[str] = None
    tree_stage: Optional[int] = None
    tasks_completed: Optional[int] = None
    focus_minutes: Optional[int] = None
    created_at: Optional[datetime] = None


class User_profilesResponse(BaseModel):
    id: str
    user_id: str
    display_name: Optional[str] = None
    avatar: Optional[str] = None
    level: Optional[int] = None
    xp: Optional[int] = None
    total_xp: Optional[int] = None
    energy: Optional[int] = None
    max_energy: Optional[int] = None
    streak: Optional[int] = None
    best_streak: Optional[int] = None
    streak_freezes: Optional[int] = None
    personality_mode: Optional[str] = None
    mood: Optional[str] = None
    tree_stage: Optional[int] = None
    tasks_completed: Optional[int] = None
    focus_minutes: Optional[int] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class User_profilesListResponse(BaseModel):
    items: List[User_profilesResponse]
    total: int
    skip: int
    limit: int


class User_profilesBatchCreateRequest(BaseModel):
    items: List[User_profilesData]


class User_profilesBatchUpdateItem(BaseModel):
    id: str
    updates: User_profilesUpdateData


class User_profilesBatchUpdateRequest(BaseModel):
    items: List[User_profilesBatchUpdateItem]


class User_profilesBatchDeleteRequest(BaseModel):
    ids: List[str]


@router.get("", response_model=User_profilesListResponse)
async def query_user_profiless(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    logger.debug(
        "Querying user_profiless: query=%s, sort=%s, skip=%s, limit=%s, fields=%s",
        query,
        sort,
        skip,
        limit,
        fields,
    )

    service = User_profilesService(db)
    try:
        query_dict = None
        if query:
            try:
                query_dict = json.loads(query)
            except json.JSONDecodeError as exc:
                raise HTTPException(status_code=400, detail="Invalid query JSON format") from exc

        return await service.get_list(
            skip=skip,
            limit=limit,
            query_dict=query_dict,
            sort=sort,
            user_id=str(current_user.id),
            auth_name=current_user.name,
            auth_email=current_user.email,
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Error querying user_profiless: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {exc}") from exc


@router.get("/all", response_model=User_profilesListResponse)
async def query_user_profiless_all(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    logger.debug(
        "Querying all user_profiless: query=%s, sort=%s, skip=%s, limit=%s, fields=%s",
        query,
        sort,
        skip,
        limit,
        fields,
    )

    service = User_profilesService(db)
    try:
        query_dict = None
        if query:
            try:
                query_dict = json.loads(query)
            except json.JSONDecodeError as exc:
                raise HTTPException(status_code=400, detail="Invalid query JSON format") from exc

        return await service.get_list(skip=skip, limit=limit, query_dict=query_dict, sort=sort)
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Error querying user_profiless: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {exc}") from exc


@router.get("/{id}", response_model=User_profilesResponse)
async def get_user_profiles(
    id: str,
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    logger.debug("Fetching user_profiles with id=%s, fields=%s", id, fields)

    service = User_profilesService(db)
    try:
        result = await service.get_by_id(id, user_id=str(current_user.id))
        if not result:
            raise HTTPException(status_code=404, detail="User_profiles not found")
        return result
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Error fetching user_profiles %s: %s", id, exc, exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {exc}") from exc


@router.post("", response_model=User_profilesResponse, status_code=201)
async def create_user_profiles(
    data: User_profilesData,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    logger.debug("Creating new user_profiles with data=%s", data)

    service = User_profilesService(db)
    try:
        result = await service.create(
            data.model_dump(),
            user_id=str(current_user.id),
            auth_name=current_user.name,
            auth_email=current_user.email,
        )
        if not result:
            raise HTTPException(status_code=400, detail="Failed to create user_profiles")
        profile_id = result["id"] if isinstance(result, dict) else str(result.id)
        logger.info("User_profiles created successfully with id=%s", profile_id)
        return result
    except HTTPException:
        raise
    except ValueError as exc:
        logger.error("Validation error creating user_profiles: %s", exc)
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        logger.error("Error creating user_profiles: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {exc}") from exc


@router.post("/batch", response_model=List[User_profilesResponse], status_code=201)
async def create_user_profiless_batch(
    request: User_profilesBatchCreateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    logger.debug("Batch creating %s user_profiless", len(request.items))

    service = User_profilesService(db)
    results = []

    try:
        for item_data in request.items:
            result = await service.create(
                item_data.model_dump(),
                user_id=str(current_user.id),
                auth_name=current_user.name,
                auth_email=current_user.email,
            )
            if result:
                results.append(result)

        return results
    except Exception as exc:
        await db.rollback()
        logger.error("Error in batch create: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch create failed: {exc}") from exc


@router.put("/batch", response_model=List[User_profilesResponse])
async def update_user_profiless_batch(
    request: User_profilesBatchUpdateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    logger.debug("Batch updating %s user_profiless", len(request.items))

    service = User_profilesService(db)
    results = []

    try:
        for item in request.items:
            update_dict = {k: v for k, v in item.updates.model_dump().items() if v is not None}
            result = await service.update(item.id, update_dict, user_id=str(current_user.id))
            if result:
                results.append(result)

        return results
    except Exception as exc:
        await db.rollback()
        logger.error("Error in batch update: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch update failed: {exc}") from exc


@router.put("/{id}", response_model=User_profilesResponse)
async def update_user_profiles(
    id: str,
    data: User_profilesUpdateData,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    logger.debug("Updating user_profiles %s with data=%s", id, data)

    service = User_profilesService(db)
    try:
        update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
        result = await service.update(id, update_dict, user_id=str(current_user.id))
        if not result:
            raise HTTPException(status_code=404, detail="User_profiles not found")
        return result
    except HTTPException:
        raise
    except ValueError as exc:
        logger.error("Validation error updating user_profiles %s: %s", id, exc)
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        logger.error("Error updating user_profiles %s: %s", id, exc, exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {exc}") from exc


@router.delete("/batch")
async def delete_user_profiless_batch(
    request: User_profilesBatchDeleteRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    logger.debug("Batch deleting %s user_profiless", len(request.ids))

    service = User_profilesService(db)
    deleted_count = 0

    try:
        for item_id in request.ids:
            success = await service.delete(item_id, user_id=str(current_user.id))
            if success:
                deleted_count += 1

        return {"message": f"Successfully deleted {deleted_count} user_profiless", "deleted_count": deleted_count}
    except Exception as exc:
        await db.rollback()
        logger.error("Error in batch delete: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch delete failed: {exc}") from exc


@router.delete("/{id}")
async def delete_user_profiles(
    id: str,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    logger.debug("Deleting user_profiles with id=%s", id)

    service = User_profilesService(db)
    try:
        success = await service.delete(id, user_id=str(current_user.id))
        if not success:
            raise HTTPException(status_code=404, detail="User_profiles not found")

        return {"message": "User_profiles deleted successfully", "id": id}
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Error deleting user_profiles %s: %s", id, exc, exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {exc}") from exc
