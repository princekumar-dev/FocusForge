from core.database import Base
from sqlalchemy import Column, DateTime, Integer, String


class Tasks(Base):
    __tablename__ = "tasks"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    user_id = Column(String, nullable=False)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    priority = Column(String, nullable=True)
    category = Column(String, nullable=True)
    status = Column(String, nullable=False)
    xp_reward = Column(Integer, nullable=True)
    energy_cost = Column(Integer, nullable=True)
    order_index = Column(Integer, nullable=True)
    due_date = Column(String, nullable=True)
    completed_at = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=True)