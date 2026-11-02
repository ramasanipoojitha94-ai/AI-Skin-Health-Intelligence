from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from pydantic import BaseModel, EmailStr, Field
from passlib.context import CryptContext

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.appointment import Appointment
from app.models.health_report import HealthReport
from app.models.skincare_routine import SkincareRoutine
from app.models.chat import ChatConversation, ChatMessage

router = APIRouter(prefix="/profile", tags=["Profile"])

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)


class ProfileUpdate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    current_password: str = ""


class PasswordUpdate(BaseModel):
    current_password: str = Field(min_length=1, max_length=72)
    new_password: str = Field(min_length=8, max_length=72)


class DeleteAccountRequest(BaseModel):
    password: str = Field(min_length=1, max_length=72)


def user_response(user: User):
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email
    }


def verify_password(password: str, hashed_password: str) -> bool:
    try:
        return pwd_context.verify(password, hashed_password)
    except (ValueError, TypeError):
        return False


@router.get("/me")
def get_profile(
    current_user: User = Depends(get_current_user)
):
    return user_response(current_user)


@router.put("/me")
def update_profile(
    data: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    name = data.name.strip()
    email = data.email.strip().lower()

    if len(name) < 2:
        raise HTTPException(
            status_code=400,
            detail="Name must contain at least 2 characters."
        )

    email_changed = email != current_user.email.lower()

    if email_changed:
        if not data.current_password:
            raise HTTPException(
                status_code=400,
                detail="Current password is required to change email."
            )

        if not verify_password(
            data.current_password,
            current_user.hashed_password
        ):
            raise HTTPException(
                status_code=400,
                detail="Current password is incorrect."
            )

    existing = db.query(User).filter(
        User.email == email,
        User.id != current_user.id
    ).first()

    if existing:
        raise HTTPException(
            status_code=409,
            detail="Email is already in use."
        )

    try:
        current_user.name = name
        current_user.email = email

        db.commit()
        db.refresh(current_user)

        return {
            "message": "Profile updated successfully.",
            "user": user_response(current_user)
        }

    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Unable to update profile. Please try again."
        )


@router.put("/change-password")
def change_password(
    data: PasswordUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not verify_password(
        data.current_password,
        current_user.hashed_password
    ):
        raise HTTPException(
            status_code=400,
            detail="Current password is incorrect."
        )

    if data.current_password == data.new_password:
        raise HTTPException(
            status_code=400,
            detail="New password must be different."
        )

    try:
        current_user.hashed_password = pwd_context.hash(
            data.new_password
        )

        db.commit()

        return {
            "message": "Password changed successfully."
        }

    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Unable to change password. Please try again."
        )


@router.delete("/me")
def delete_account(
    data: DeleteAccountRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not verify_password(
        data.password,
        current_user.hashed_password
    ):
        raise HTTPException(
            status_code=400,
            detail="Password is incorrect."
        )

    try:
        # Delete related chat messages first
        conversations = db.query(ChatConversation).filter(
            ChatConversation.user_id == current_user.id
        ).all()

        conversation_ids = [conversation.id for conversation in conversations]

        if conversation_ids:
            db.query(ChatMessage).filter(
                ChatMessage.conversation_id.in_(conversation_ids)
            ).delete(synchronize_session=False)

        # Delete other user-related records
        db.query(Appointment).filter(
            Appointment.user_id == current_user.id
        ).delete(synchronize_session=False)

        db.query(HealthReport).filter(
            HealthReport.user_id == current_user.id
        ).delete(synchronize_session=False)

        db.query(SkincareRoutine).filter(
            SkincareRoutine.user_id == current_user.id
        ).delete(synchronize_session=False)

        db.query(ChatConversation).filter(
            ChatConversation.user_id == current_user.id
        ).delete(synchronize_session=False)

        db.delete(current_user)
        db.commit()

        return {
            "message": "Account deleted successfully."
        }

    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Unable to delete account. Please try again."
        )