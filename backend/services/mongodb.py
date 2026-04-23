from core.mongodb import mongo_manager


async def initialize_mongodb():
    await mongo_manager.initialize()


async def close_mongodb():
    await mongo_manager.close()
