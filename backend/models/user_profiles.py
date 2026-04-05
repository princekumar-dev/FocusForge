from core.database import Base
from sqlalchemy import Column, DateTime, Integer, String


class User_profiles(Base):
    __tablename__ = "user_profiles"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    user_id = Column(String, nullable=False)
    display_name = Column(String, nullable=True)
    avatar = Column(String, nullable=True)
    level = Column(Integer, nullable=True)
    xp = Column(Integer, nullable=True)
    total_xp = Column(Integer, nullable=True)
    energy = Column(Integer, nullable=True)
    max_energy = Column(Integer, nullable=True)
    streak = Column(Integer, nullable=True)
    best_streak = Column(Integer, nullable=True)
    streak_freezes = Column(Integer, nullable=True)
    personality_mode = Column(String, nullable=True)
    mood = Column(String, nullable=True)
    tree_stage = Column(Integer, nullable=True)
    tasks_completed = Column(Integer, nullable=True)
    focus_minutes = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=True)