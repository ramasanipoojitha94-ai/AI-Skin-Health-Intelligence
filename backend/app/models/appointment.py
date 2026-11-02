from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func

from app.database import Base


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    doctor_id = Column(Integer, nullable=False)
    doctor_name = Column(String(150), nullable=False)
    specialty = Column(String(150), nullable=False)

    appointment_date = Column(String(10), nullable=False)
    appointment_time = Column(String(30), nullable=False)

    consultation_fee = Column(Integer, nullable=False)

    status = Column(
        String(30),
        nullable=False,
        default="Booked",
        server_default="Booked"
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )