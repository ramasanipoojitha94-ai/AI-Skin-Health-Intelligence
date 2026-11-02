
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.health_report import HealthReport

router = APIRouter(prefix="/reports", tags=["Health Reports"])


@router.post("/")
def save_report(
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    report = HealthReport(
        user_id=current_user.id,
        analysis_type=data.get("analysis_type"),
        result=data.get("result"),
        confidence=data.get("confidence")
    )

    db.add(report)
    db.commit()
    db.refresh(report)

    return {
        "message": "Report saved successfully",
        "id": report.id
    }


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
