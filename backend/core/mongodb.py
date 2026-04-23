import logging
from typing import Optional

from core.config import settings

logger = logging.getLogger(__name__)

try:
    from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorCollection, AsyncIOMotorDatabase
except ImportError:  # pragma: no cover - dependency is added in requirements
    AsyncIOMotorClient = None  # type: ignore[assignment]
    AsyncIOMotorDatabase = None  # type: ignore[assignment]
    AsyncIOMotorCollection = None  # type: ignore[assignment]


class MongoManager:
    def __init__(self):
        self.client: Optional[AsyncIOMotorClient] = None
        self.database: Optional[AsyncIOMotorDatabase] = None

    @property
    def enabled(self) -> bool:
        return bool(settings.mongodb_uri and AsyncIOMotorClient is not None)

    async def initialize(self) -> None:
        if not self.enabled:
            if settings.mongodb_uri and AsyncIOMotorClient is None:
                logger.warning("MONGODB_URI is set but motor is not installed")
            else:
                logger.info("MongoDB profile storage is disabled")
            return

        if self.client is not None and self.database is not None:
            return

        self.client = AsyncIOMotorClient(settings.mongodb_uri)
        self.database = self.client[settings.mongodb_db_name]
        await self.database.user_profiles.create_index("user_id", unique=True)
        logger.info("MongoDB initialized for profile storage")

    async def close(self) -> None:
        if self.client is not None:
            self.client.close()
            logger.info("MongoDB connection closed")
        self.client = None
        self.database = None

    def get_collection(self, name: str) -> AsyncIOMotorCollection:
        if self.database is None:
            raise RuntimeError("MongoDB is not initialized")
        return self.database[name]


mongo_manager = MongoManager()
