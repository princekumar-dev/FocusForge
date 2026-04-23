import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from core.mongodb import mongo_manager
from models.user_profiles import User_profiles
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)

try:
    from bson import ObjectId
    from bson.errors import InvalidId
    from pymongo import ReturnDocument
except ImportError:  # pragma: no cover - bson ships with motor/pymongo
    ObjectId = None  # type: ignore[assignment]
    InvalidId = ValueError  # type: ignore[assignment]
    ReturnDocument = None  # type: ignore[assignment]


DEFAULT_PROFILE: Dict[str, Any] = {
    "display_name": "Adventurer",
    "avatar": "\U0001F331",
    "level": 1,
    "xp": 0,
    "total_xp": 0,
    "energy": 100,
    "max_energy": 100,
    "streak": 0,
    "best_streak": 0,
    "streak_freezes": 3,
    "personality_mode": "chill",
    "mood": "productive",
    "tree_stage": 1,
    "tasks_completed": 0,
    "focus_minutes": 0,
}

PROFILE_FIELDS = set(DEFAULT_PROFILE.keys()) | {"user_id", "created_at", "updated_at"}


def _is_missing_name(value: Optional[str]) -> bool:
    return not value or not value.strip() or value.strip() == DEFAULT_PROFILE["display_name"]


def _preferred_name(user_id: str, auth_name: Optional[str], auth_email: Optional[str], current_name: Optional[str] = None) -> str:
    if current_name and current_name.strip() and current_name.strip() != DEFAULT_PROFILE["display_name"]:
        return current_name.strip()
    if auth_name and auth_name.strip():
        return auth_name.strip()
    if auth_email and "@" in auth_email:
        local_part = auth_email.split("@", 1)[0].strip()
        if local_part:
            return local_part
    return user_id or DEFAULT_PROFILE["display_name"]


def _profile_score(profile: Any) -> int:
    score = 0
    score += int(getattr(profile, "total_xp", 0) or 0) * 1000
    score += int(getattr(profile, "tasks_completed", 0) or 0) * 100
    score += int(getattr(profile, "focus_minutes", 0) or 0) * 10
    score += int(getattr(profile, "level", 0) or 0) * 100
    score += int(getattr(profile, "id", 0) or 0)

    display_name = getattr(profile, "display_name", None)
    if display_name and display_name != DEFAULT_PROFILE["display_name"]:
        score += 25
    avatar = getattr(profile, "avatar", None)
    if avatar and avatar != DEFAULT_PROFILE["avatar"]:
        score += 10
    personality_mode = getattr(profile, "personality_mode", None)
    if personality_mode and personality_mode != DEFAULT_PROFILE["personality_mode"]:
        score += 5
    mood = getattr(profile, "mood", None)
    if mood and mood != DEFAULT_PROFILE["mood"]:
        score += 5

    return score


class User_profilesService:
    """Service layer for User_profiles operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    @property
    def use_mongodb(self) -> bool:
        return mongo_manager.database is not None

    def _profiles_collection(self):
        return mongo_manager.get_collection("user_profiles")

    def _serialize_mongo_profile(self, document: Dict[str, Any]) -> Dict[str, Any]:
        payload = {key: document.get(key) for key in PROFILE_FIELDS if key in document}
        payload["id"] = str(document["_id"])
        payload["user_id"] = document["user_id"]
        return payload

    async def _find_sql_profiles(self, user_id: str) -> List[User_profiles]:
        result = await self.db.execute(
            select(User_profiles)
            .where(User_profiles.user_id == user_id)
            .order_by(User_profiles.id.desc())
        )
        return list(result.scalars().all())

    async def _pick_best_sql_profile(self, user_id: str) -> Optional[User_profiles]:
        profiles = await self._find_sql_profiles(user_id)
        if not profiles:
            return None
        return max(profiles, key=_profile_score)

    async def _migrate_sql_profile_to_mongo(
        self,
        user_id: str,
        auth_name: Optional[str],
        auth_email: Optional[str],
    ) -> Optional[Dict[str, Any]]:
        sql_profile = await self._pick_best_sql_profile(user_id)
        if not sql_profile:
            return None

        created_at = getattr(sql_profile, "created_at", None) or datetime.now(timezone.utc)
        document: Dict[str, Any] = {
            "user_id": user_id,
            "created_at": created_at,
            "updated_at": datetime.now(timezone.utc),
        }

        for field in DEFAULT_PROFILE:
            value = getattr(sql_profile, field, None)
            if field == "display_name":
                document[field] = _preferred_name(user_id, auth_name, auth_email, value)
            else:
                document[field] = value if value is not None else DEFAULT_PROFILE[field]

        try:
            result = await self._profiles_collection().update_one(
                {"user_id": user_id},
                {
                    "$setOnInsert": document,
                    "$set": {
                        "display_name": document["display_name"],
                        "updated_at": datetime.now(timezone.utc),
                    },
                },
                upsert=True,
            )
            if result.upserted_id:
                logger.info("Migrated SQL profile for user_id=%s into MongoDB", user_id)
            return await self._profiles_collection().find_one({"user_id": user_id})
        except Exception as exc:
            logger.error("Failed to migrate SQL profile for user_id=%s: %s", user_id, exc, exc_info=True)
            raise

    async def _get_or_create_mongo_profile(
        self,
        user_id: str,
        auth_name: Optional[str],
        auth_email: Optional[str],
    ) -> Dict[str, Any]:
        collection = self._profiles_collection()
        document = await collection.find_one({"user_id": user_id})

        if document is None:
            document = await self._migrate_sql_profile_to_mongo(user_id, auth_name, auth_email)

        if document is None:
            now = datetime.now(timezone.utc)
            document = {
                "user_id": user_id,
                **DEFAULT_PROFILE,
                "display_name": _preferred_name(user_id, auth_name, auth_email),
                "created_at": now,
                "updated_at": now,
            }
            insert_result = await collection.insert_one(document)
            document["_id"] = insert_result.inserted_id
            logger.info("Created MongoDB profile for user_id=%s", user_id)
            return document

        desired_name = _preferred_name(user_id, auth_name, auth_email, document.get("display_name"))
        updates: Dict[str, Any] = {}
        if _is_missing_name(document.get("display_name")) and desired_name != document.get("display_name"):
            updates["display_name"] = desired_name

        for field, default_value in DEFAULT_PROFILE.items():
            if document.get(field) is None:
                updates[field] = default_value

        if updates:
            updates["updated_at"] = datetime.now(timezone.utc)
            await collection.update_one({"_id": document["_id"]}, {"$set": updates})
            document.update(updates)

        return document

    async def create(self, data: Dict[str, Any], user_id: Optional[str] = None, auth_name: Optional[str] = None, auth_email: Optional[str] = None):
        """Create or upsert a user profile."""
        if not user_id:
            raise ValueError("user_id is required")

        if self.use_mongodb:
            existing = await self._get_or_create_mongo_profile(user_id, auth_name, auth_email)
            create_updates = {}
            for key, value in data.items():
                if key not in DEFAULT_PROFILE or value is None:
                    continue
                current_value = existing.get(key)
                if current_value is None or current_value == DEFAULT_PROFILE[key]:
                    create_updates[key] = value

            if create_updates:
                create_updates["updated_at"] = datetime.now(timezone.utc)
                await self._profiles_collection().update_one(
                    {"_id": existing["_id"]},
                    {"$set": create_updates},
                )
                existing.update(create_updates)

            return self._serialize_mongo_profile(existing)

        try:
            existing = await self.get_by_field("user_id", user_id)
            if existing:
                return existing
            payload = {**data, "user_id": user_id}
            obj = User_profiles(**payload)
            self.db.add(obj)
            await self.db.commit()
            await self.db.refresh(obj)
            logger.info("Created SQL user_profiles with id: %s", obj.id)
            return obj
        except Exception as e:
            await self.db.rollback()
            logger.error("Error creating user_profiles: %s", str(e))
            raise

    async def check_ownership(self, obj_id: str, user_id: str) -> bool:
        try:
            obj = await self.get_by_id(obj_id, user_id=user_id)
            return obj is not None
        except Exception as e:
            logger.error("Error checking ownership for user_profiles %s: %s", obj_id, str(e))
            return False

    async def get_by_id(self, obj_id: str, user_id: Optional[str] = None):
        if self.use_mongodb:
            if ObjectId is None:
                raise RuntimeError("MongoDB ObjectId support is unavailable")
            try:
                object_id = ObjectId(obj_id)
            except (InvalidId, TypeError):
                return None
            query: Dict[str, Any] = {"_id": object_id}
            if user_id:
                query["user_id"] = user_id
            document = await self._profiles_collection().find_one(query)
            return self._serialize_mongo_profile(document) if document else None

        try:
            query = select(User_profiles).where(User_profiles.id == int(obj_id))
            if user_id:
                query = query.where(User_profiles.user_id == user_id)
            result = await self.db.execute(query)
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error("Error fetching user_profiles %s: %s", obj_id, str(e))
            raise

    async def get_list(
        self,
        skip: int = 0,
        limit: int = 20,
        user_id: Optional[str] = None,
        query_dict: Optional[Dict[str, Any]] = None,
        sort: Optional[str] = None,
        auth_name: Optional[str] = None,
        auth_email: Optional[str] = None,
    ) -> Dict[str, Any]:
        if self.use_mongodb:
            collection = self._profiles_collection()
            normalized_query = dict(query_dict or {})
            if user_id:
                requested_user_id = normalized_query.get("user_id")
                if requested_user_id and requested_user_id != user_id:
                    return {"items": [], "total": 0, "skip": skip, "limit": limit}
                profile = await self._get_or_create_mongo_profile(user_id, auth_name, auth_email)
                payload = self._serialize_mongo_profile(profile)
                for field, value in normalized_query.items():
                    if field == "user_id":
                        continue
                    if payload.get(field) != value:
                        return {"items": [], "total": 0, "skip": skip, "limit": limit}
                items = [payload]
                sliced = items[skip : skip + limit]
                return {"items": sliced, "total": len(items), "skip": skip, "limit": limit}

            mongo_query = {key: value for key, value in normalized_query.items() if key in PROFILE_FIELDS}
            total = await collection.count_documents(mongo_query)
            cursor = collection.find(mongo_query)
            sort_field = "updated_at"
            sort_direction = -1
            if sort:
                if sort.startswith("-"):
                    sort_field = sort[1:]
                    sort_direction = -1
                else:
                    sort_field = sort
                    sort_direction = 1
            if sort_field in PROFILE_FIELDS or sort_field == "_id":
                cursor = cursor.sort(sort_field, sort_direction)
            documents = await cursor.skip(skip).limit(limit).to_list(length=limit)
            return {
                "items": [self._serialize_mongo_profile(document) for document in documents],
                "total": total,
                "skip": skip,
                "limit": limit,
            }

        try:
            query = select(User_profiles)
            count_query = select(func.count(User_profiles.id))

            if user_id:
                query = query.where(User_profiles.user_id == user_id)
                count_query = count_query.where(User_profiles.user_id == user_id)

            if query_dict:
                for field, value in query_dict.items():
                    if hasattr(User_profiles, field):
                        query = query.where(getattr(User_profiles, field) == value)
                        count_query = count_query.where(getattr(User_profiles, field) == value)

            count_result = await self.db.execute(count_query)
            total = count_result.scalar()

            if sort:
                if sort.startswith("-"):
                    field_name = sort[1:]
                    if hasattr(User_profiles, field_name):
                        query = query.order_by(getattr(User_profiles, field_name).desc())
                else:
                    if hasattr(User_profiles, sort):
                        query = query.order_by(getattr(User_profiles, sort))
            else:
                query = query.order_by(User_profiles.id.desc())

            result = await self.db.execute(query.offset(skip).limit(limit))
            items = result.scalars().all()

            return {
                "items": items,
                "total": total,
                "skip": skip,
                "limit": limit,
            }
        except Exception as e:
            logger.error("Error fetching user_profiles list: %s", str(e))
            raise

    async def update(self, obj_id: str, update_data: Dict[str, Any], user_id: Optional[str] = None):
        if self.use_mongodb:
            if not user_id:
                raise ValueError("user_id is required")
            if ObjectId is None:
                raise RuntimeError("MongoDB ObjectId support is unavailable")
            try:
                object_id = ObjectId(obj_id)
            except (InvalidId, TypeError):
                logger.warning("Invalid MongoDB profile id for update: %s", obj_id)
                return None

            sanitized_updates = {
                key: value
                for key, value in update_data.items()
                if key in DEFAULT_PROFILE and key != "user_id" and value is not None
            }
            if "display_name" in sanitized_updates:
                sanitized_updates["display_name"] = sanitized_updates["display_name"].strip() or DEFAULT_PROFILE["display_name"]
            if not sanitized_updates:
                document = await self._profiles_collection().find_one({"_id": object_id, "user_id": user_id})
                return self._serialize_mongo_profile(document) if document else None

            sanitized_updates["updated_at"] = datetime.now(timezone.utc)
            result = await self._profiles_collection().find_one_and_update(
                {"_id": object_id, "user_id": user_id},
                {"$set": sanitized_updates},
                return_document=ReturnDocument.AFTER,
            )
            if not result:
                logger.warning("MongoDB user_profiles %s not found for update", obj_id)
                return None
            logger.info("Updated MongoDB user_profiles %s", obj_id)
            return self._serialize_mongo_profile(result)

        try:
            obj = await self.get_by_id(obj_id, user_id=user_id)
            if not obj:
                logger.warning("User_profiles %s not found for update", obj_id)
                return None
            for key, value in update_data.items():
                if hasattr(obj, key) and key != "user_id":
                    setattr(obj, key, value)

            await self.db.commit()
            await self.db.refresh(obj)
            logger.info("Updated user_profiles %s", obj_id)
            return obj
        except Exception as e:
            await self.db.rollback()
            logger.error("Error updating user_profiles %s: %s", obj_id, str(e))
            raise

    async def delete(self, obj_id: str, user_id: Optional[str] = None) -> bool:
        if self.use_mongodb:
            if not user_id:
                return False
            if ObjectId is None:
                raise RuntimeError("MongoDB ObjectId support is unavailable")
            try:
                object_id = ObjectId(obj_id)
            except (InvalidId, TypeError):
                return False
            result = await self._profiles_collection().delete_one({"_id": object_id, "user_id": user_id})
            if result.deleted_count:
                logger.info("Deleted MongoDB user_profiles %s", obj_id)
                return True
            logger.warning("MongoDB user_profiles %s not found for deletion", obj_id)
            return False

        try:
            obj = await self.get_by_id(obj_id, user_id=user_id)
            if not obj:
                logger.warning("User_profiles %s not found for deletion", obj_id)
                return False
            await self.db.delete(obj)
            await self.db.commit()
            logger.info("Deleted user_profiles %s", obj_id)
            return True
        except Exception as e:
            await self.db.rollback()
            logger.error("Error deleting user_profiles %s: %s", obj_id, str(e))
            raise

    async def get_by_field(self, field_name: str, field_value: Any):
        if self.use_mongodb:
            if field_name not in PROFILE_FIELDS:
                raise ValueError(f"Field {field_name} does not exist on User_profiles")
            document = await self._profiles_collection().find_one({field_name: field_value})
            return self._serialize_mongo_profile(document) if document else None

        try:
            if not hasattr(User_profiles, field_name):
                raise ValueError(f"Field {field_name} does not exist on User_profiles")
            result = await self.db.execute(
                select(User_profiles).where(getattr(User_profiles, field_name) == field_value)
            )
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error("Error fetching user_profiles by %s: %s", field_name, str(e))
            raise

    async def list_by_field(
        self, field_name: str, field_value: Any, skip: int = 0, limit: int = 20
    ) -> List[Any]:
        if self.use_mongodb:
            if field_name not in PROFILE_FIELDS:
                raise ValueError(f"Field {field_name} does not exist on User_profiles")
            cursor = self._profiles_collection().find({field_name: field_value}).skip(skip).limit(limit)
            documents = await cursor.to_list(length=limit)
            return [self._serialize_mongo_profile(document) for document in documents]

        try:
            if not hasattr(User_profiles, field_name):
                raise ValueError(f"Field {field_name} does not exist on User_profiles")
            result = await self.db.execute(
                select(User_profiles)
                .where(getattr(User_profiles, field_name) == field_value)
                .offset(skip)
                .limit(limit)
                .order_by(User_profiles.id.desc())
            )
            return list(result.scalars().all())
        except Exception as e:
            logger.error("Error fetching user_profiless by %s: %s", field_name, str(e))
            raise
