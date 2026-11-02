from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from pydantic import BaseModel, Field, field_validator

from app.database import get_db
from app.models.appointment import Appointment
from app.models.user import User
from app.dependencies import get_current_user

router = APIRouter(
    prefix="/appointments",
    tags=["Doctor Appointments"]
)


class AppointmentRequest(BaseModel):
    doctor_id: int = Field(gt=0)
    doctor_name: str = Field(min_length=2, max_length=150)
    specialty: str = Field(min_length=2, max_length=150)
    appointment_date: str
    appointment_time: str = Field(min_length=1, max_length=30)
    consultation_fee: int = Field(ge=0)

    @field_validator("appointment_date")
    @classmethod
    def validate_date(cls, value):
        try:
            parsed = date.fromisoformat(value)
        except ValueError:
            raise ValueError("Date must use YYYY-MM-DD format.")

        if parsed < date.today():
            raise ValueError("Appointment date cannot be in the past.")

        return value


class RescheduleRequest(BaseModel):
    appointment_date: str
    appointment_time: str = Field(min_length=1, max_length=30)

    @field_validator("appointment_date")
    @classmethod
    def validate_date(cls, value):
        try:
            parsed = date.fromisoformat(value)
        except ValueError:
            raise ValueError("Date must use YYYY-MM-DD format.")

        if parsed < date.today():
            raise ValueError("Appointment date cannot be in the past.")

        return value


def appointment_response(appointment):
    return {
        "id": appointment.id,
        "doctor_id": appointment.doctor_id,
        "doctor_name": appointment.doctor_name,
        "specialty": appointment.specialty,
        "date": appointment.appointment_date,
        "time": appointment.appointment_time,
        "fee": appointment.consultation_fee,
        "status": appointment.status
    }


def get_appointment_date(appointment):
    try:
        return date.fromisoformat(appointment.appointment_date)
    except (ValueError, TypeError):
        return None


@router.post("/", status_code=status.HTTP_201_CREATED)
def book_appointment(
    data: AppointmentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        appointment = Appointment(
            user_id=current_user.id,
            **data.model_dump()
        )

        db.add(appointment)
        db.commit()
        db.refresh(appointment)

        return {
            "message": "Appointment booked successfully",
            "appointment": appointment_response(appointment)
        }

    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Unable to book appointment. Please try again."
        )


@router.get("/me")
def my_appointments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    appointments = (
        db.query(Appointment)
        .filter(Appointment.user_id == current_user.id)
        .order_by(Appointment.created_at.desc())
        .all()
    )

    return [
        appointment_response(appointment)
        for appointment in appointments
    ]


@router.get("/summary")
def appointment_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    appointments = (
        db.query(Appointment)
        .filter(Appointment.user_id == current_user.id)
        .all()
    )

    today = date.today()

    upcoming = []
    past = []
    cancelled = []

    for appointment in appointments:
        appointment_date = get_appointment_date(appointment)
        appointment_status = (appointment.status or "").lower()

        if appointment_status == "cancelled":
            cancelled.append(appointment)
        elif appointment_date and appointment_date >= today:
            upcoming.append(appointment)
        elif appointment_date and appointment_date < today:
            past.append(appointment)

    upcoming.sort(
        key=lambda item: (
            get_appointment_date(item) or date.max,
            item.appointment_time or ""
        )
    )

    return {
        "total": len(appointments),
        "upcoming": len(upcoming),
        "past": len(past),
        "cancelled": len(cancelled),
        "upcoming_appointments": [
            appointment_response(item)
            for item in upcoming[:5]
        ]
    }


@router.patch("/{appointment_id}/cancel")
def cancel_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    appointment = (
        db.query(Appointment)
        .filter(
            Appointment.id == appointment_id,
            Appointment.user_id == current_user.id
        )
        .first()
    )

    if appointment is None:
        raise HTTPException(
            status_code=404,
            detail="Appointment not found."
        )

    if (appointment.status or "").lower() == "cancelled":
        raise HTTPException(
            status_code=400,
            detail="This appointment is already cancelled."
        )

    try:
        appointment.status = "Cancelled"
        db.commit()
        db.refresh(appointment)

        return {
            "message": "Appointment cancelled successfully",
            "appointment_id": appointment.id,
            "status": appointment.status
        }

    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Unable to cancel appointment. Please try again."
        )


@router.patch("/{appointment_id}/reschedule")
def reschedule_appointment(
    appointment_id: int,
    data: RescheduleRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    appointment = (
        db.query(Appointment)
        .filter(
            Appointment.id == appointment_id,
            Appointment.user_id == current_user.id
        )
        .first()
    )

    if appointment is None:
        raise HTTPException(
            status_code=404,
            detail="Appointment not found."
        )

    if (appointment.status or "").lower() == "cancelled":
        raise HTTPException(
            status_code=400,
            detail="Cancelled appointments cannot be rescheduled."
        )

    try:
        appointment.appointment_date = data.appointment_date
        appointment.appointment_time = data.appointment_time

        db.commit()
        db.refresh(appointment)

        return {
            "message": "Appointment rescheduled successfully",
            "appointment": appointment_response(appointment)
        }

    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Unable to reschedule appointment. Please try again."
        )