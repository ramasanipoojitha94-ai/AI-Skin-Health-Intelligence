from sqlalchemy import (
    Column,
    Integer,
    DateTime,
    ForeignKey,
    JSON
)
from sqlalchemy.sql import func

from app.database import Base


class SkincareRoutine(Base):
    __tablename__ = "skincare_routines"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True
    )

    routine_data = Column(
        JSON,
        nullable=False,
        default=dict
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )