from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session

from app import models
from app.api.deps import get_current_user, require_roles
from app.core.database import get_db
from app.schemas.analytics import (
    IncidentHeatmapResponse,
    ProvisionAuditResponse,
    SchoolAnalyticsOverview,
    StrategyEfficacyResponse,
    TriggersReportResponse,
)
from app.schemas.classroom_provision import ClassroomProvisionSummary
from app.schemas.clinical_dossier import CamhsClinicalDossierResponse
from app.schemas.sen_report import SenInformationReportResponse
from app.services.analytics_service import AnalyticsService
from app.services.classroom_provision_service import ClassroomProvisionService
from app.services.clinical_dossier_service import ClinicalDossierService
from app.services.sen_report_service import SenReportService

router = APIRouter()


@router.get("/overview", response_model=SchoolAnalyticsOverview)
def get_analytics_overview(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles(["senco", "admin", "teacher", "ta"])),
):
    """Retrieve school-wide macro analytics, caseload counts, and provision delivery rates."""
    return AnalyticsService.get_live_school_overview(db, school_id=current_user.school_id)


@router.get("/incidents/heatmap", response_model=IncidentHeatmapResponse)
def get_incident_heatmap(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles(["senco", "admin", "teacher", "ta"])),
):
    """Retrieve 5-day x 7-period incident and dysregulation heatmap matrix."""
    return AnalyticsService.get_live_incident_heatmap(db, school_id=current_user.school_id)


@router.get("/incidents/triggers", response_model=TriggersReportResponse)
def get_trigger_frequencies(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles(["senco", "admin", "teacher", "ta"])),
):
    """Retrieve frequency breakdown of antecedent triggers across neurodivergent vulnerability domains."""
    return AnalyticsService.get_live_trigger_frequencies(db, school_id=current_user.school_id)


@router.get("/strategies/win-rates", response_model=StrategyEfficacyResponse)
def get_strategy_win_rates(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles(["senco", "admin", "teacher", "ta"])),
):
    """Retrieve ranked empirical resolution success rates across de-escalation strategies."""
    return AnalyticsService.get_live_strategy_win_rates(db, school_id=current_user.school_id)


@router.get("/provision/audit", response_model=ProvisionAuditResponse)
def get_provision_audit(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles(["senco", "admin", "teacher", "ta"])),
):
    """Retrieve High Needs Block funding band audit and weekly 1:1 TA hours allocated vs delivered."""
    return AnalyticsService.get_live_provision_audit(db, school_id=current_user.school_id)


@router.get("/export/csv")
def export_analytics_csv(
    report_type: str = Query("provision", pattern="^(provision|strategies|triggers)$"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles(["senco", "admin", "teacher", "ta"])),
):
    """Export statutory provision, strategy efficacy, or incident triggers data as an RFC 4180 CSV."""
    csv_content = AnalyticsService.generate_csv_export(
        report_type=report_type, db=db, school_id=current_user.school_id
    )
    filename = f"seemy-mind-{report_type}-audit.csv"
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/governor-report", response_model=SenInformationReportResponse)
def get_statutory_governor_report(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles(["senco", "admin"])),
):
    """Generate the official Statutory SEN Information Report and Governor Pack
    under Regulation 51 & Schedule 1 of the SEND Regulations 2014."""
    return SenReportService.generate_sen_information_report(
        db=db, school_id=current_user.school_id
    )


@router.get("/camhs-dossier/{child_id}", response_model=CamhsClinicalDossierResponse)
def get_camhs_clinical_dossier(
    child_id: UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles(["parent", "senco", "teacher", "ta", "admin"])),
):
    """Generates a formal, NICE NG87/CG128-compliant clinical evidence dossier for CAMHS and Community Pediatricians."""
    try:
        return ClinicalDossierService.generate_camhs_dossier(db=db, child_id=child_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/classroom-provision/{room_name}", response_model=ClassroomProvisionSummary)
def get_classroom_provision_map(
    room_name: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles(["teacher", "senco", "admin", "ta"])),
):
    """Generates the whole-classroom provision map and APDR graduated response review under SEND CoP 6.44-6.56."""
    return ClassroomProvisionService.generate_classroom_provision_map(db=db, room_name=room_name)




