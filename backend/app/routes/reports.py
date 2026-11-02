from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from pydantic import BaseModel, Field

from app.database import get_db
from app.dependencies import get_current_user
from app.models.health_report import HealthReport
from app.models.user import User

router = APIRouter(
    prefix="/reports",
    tags=["Health Reports"]
)


class ReportCreate(BaseModel):
    analysis_type: str = Field(min_length=1, max_length=100)
    result: str = Field(min_length=1, max_length=5000)
    confidence: Optional[float] = Field(
        default=None,
        ge=0,
        le=100
    )


@router.post("/", status_code=status.HTTP_201_CREATED)
def save_report(
    report: ReportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        new_report = HealthReport(
            user_id=current_user.id,
            analysis_type=report.analysis_type.strip(),
            result=report.result.strip(),
            confidence=report.confidence
        )

        db.add(new_report)
        db.commit()
        db.refresh(new_report)

        return {
            "message": "Report saved successfully",
            "report": {
                "id": new_report.id,
                "analysis_type": new_report.analysis_type,
                "result": new_report.result,
                "confidence": new_report.confidence,
                "created_at": new_report.created_at
            }
        }

    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Unable to save report. Please try again."
        )


@router.get("/me")
def get_my_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    reports = (
        db.query(HealthReport)
        .filter(HealthReport.user_id == current_user.id)
        .order_by(HealthReport.created_at.desc())
        .all()
    )

    return [
        {
            "id": report.id,
            "analysis_type": report.analysis_type,
            "result": report.result,
            "confidence": report.confidence,
            "created_at": report.created_at
        }
        for report in reports
    ]