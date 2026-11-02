import logging

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.skin_concern import SkinConcern

router = APIRouter(
    prefix="/skin-concerns",
    tags=["Personal Skin Concerns"]
)

logger = logging.getLogger(__name__)


class ConcernCreate(BaseModel):
    message: str = Field(min_length=1, max_length=1000)


class ConcernUpdate(BaseModel):
    message: str = Field(min_length=1, max_length=1000)


def clean_message(message: str) -> str:
    cleaned = message.strip()

    if not cleaned:
        raise HTTPException(
            status_code=400,
            detail="Please enter your skin concern."
        )

    if len(cleaned) > 1000:
        raise HTTPException(
            status_code=400,
            detail="Skin concern must not exceed 1000 characters."
        )

    return cleaned


def concern_response(concern: SkinConcern):
    return {
        "id": concern.id,
        "message": concern.message,
        "created_at": concern.created_at
    }


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_concern(
    data: ConcernCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        concern = SkinConcern(
            user_id=current_user.id,
            message=clean_message(data.message)
        )

        db.add(concern)
        db.commit()
        db.refresh(concern)

        return {
            "message": "Your concern has been saved.",
            "concern": concern_response(concern)
        }

    except SQLAlchemyError:
        db.rollback()
        logger.exception("Could not save skin concern.")

        raise HTTPException(
            status_code=500,
            detail="Unable to save your concern. Please try again."
        )


@router.get("/me")
def get_my_concerns(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    concerns = (
        db.query(SkinConcern)
        .filter(SkinConcern.user_id == current_user.id)
        .order_by(SkinConcern.created_at.desc())
        .all()
    )

    return [
        concern_response(concern)
        for concern in concerns
    ]


@router.put("/{concern_id}")
def update_concern(
    concern_id: int,
    data: ConcernUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    concern = (
        db.query(SkinConcern)
        .filter(
            SkinConcern.id == concern_id,
            SkinConcern.user_id == current_user.id
        )
        .first()
    )

    if concern is None:
        raise HTTPException(
            status_code=404,
            detail="Concern not found."
        )

    try:
        concern.message = clean_message(data.message)

        db.commit()
        db.refresh(concern)

        return {
            "message": "Your concern has been updated.",
            "concern": concern_response(concern)
        }

    except SQLAlchemyError:
        db.rollback()
        logger.exception("Could not update skin concern.")

        raise HTTPException(
            status_code=500,
            detail="Unable to update your concern. Please try again."
        )


@router.delete("/{concern_id}")
def delete_concern(
    concern_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    concern = (
        db.query(SkinConcern)
        .filter(
            SkinConcern.id == concern_id,
            SkinConcern.user_id == current_user.id
        )
        .first()
    )

    if concern is None:
        raise HTTPException(
            status_code=404,
            detail="Concern not found."
        )

    try:
        db.delete(concern)
        db.commit()

        return {
            "message": "Your concern has been deleted."
        }

    except SQLAlchemyError:
        db.rollback()
        logger.exception("Could not delete skin concern.")

        raise HTTPException(
            status_code=500,
            detail="Unable to delete your concern. Please try again."
        )