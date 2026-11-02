from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from app.database import get_db
from app.models.skincare_routine import SkincareRoutine
from app.models.user import User
from app.dependencies import get_current_user

router = APIRouter(
    prefix="/skincare",
    tags=["Skincare Routine"]
)


class RoutineRequest(BaseModel):
    routine_data: dict[str, Any] = Field(
        ...,
        description="The user's skincare routine data."
    )


@router.get("/me")
def get_routine(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    routine = db.query(SkincareRoutine).filter(
        SkincareRoutine.user_id == current_user.id
    ).first()

    return {
        "routine_data": routine.routine_data if routine else {}
    }


@router.put("/me")
def save_routine(
    data: RoutineRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    routine = db.query(SkincareRoutine).filter(
        SkincareRoutine.user_id == current_user.id
    ).first()

    try:
        if routine:
            routine.routine_data = data.routine_data
        else:
            routine = SkincareRoutine(
                user_id=current_user.id,
                routine_data=data.routine_data
            )
            db.add(routine)

        db.commit()

        return {
            "message": "Skincare routine saved successfully",
            "routine_data": data.routine_data
        }

    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to save your skincare routine. Please try again."
        )