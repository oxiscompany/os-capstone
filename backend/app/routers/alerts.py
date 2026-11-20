"""
Alerts Router for LabNexus.
Alerts list, deduplication querying, and acknowledgement lifecycle.
"""
from fastapi import APIRouter, HTTPException, Query, Depends
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from backend.app.analytics.anomaly_detector import anomaly_detector
from backend.app.schemas.schemas import AlertOut, AlertAcknowledgeRequest

router = APIRouter(prefix="/alerts", tags=["Alerts"])

@router.get("", response_model=List[AlertOut])
def list_alerts(
    severity: Optional[str] = None,
    computer_id: Optional[str] = None,
    unacknowledged_only: bool = False,
    limit: int = Query(50, ge=1, le=200)
):
    alerts = anomaly_detector.alert_history
    filtered = []
    for a in alerts:
        if severity and a.get("severity") != severity:
            continue
        if computer_id and a.get("computer_id") != computer_id:
            continue
        if unacknowledged_only and a.get("is_acknowledged"):
            continue
        filtered.append(a)

    return filtered[:limit]

@router.get("/summary")
def get_alerts_summary():
    alerts = anomaly_detector.alert_history
    critical_count = sum(1 for a in alerts if a.get("severity") == "critical" and not a.get("is_resolved"))
    warning_count = sum(1 for a in alerts if a.get("severity") == "warning" and not a.get("is_resolved"))
    info_count = sum(1 for a in alerts if a.get("severity") == "info")
    unack_count = sum(1 for a in alerts if not a.get("is_acknowledged") and not a.get("is_resolved"))

    return {
        "critical_alerts": critical_count,
        "warning_alerts": warning_count,
        "info_alerts": info_count,
        "unacknowledged_alerts": unack_count,
        "total_active_anomalies": len(anomaly_detector.active_alerts)
    }

@router.put("/{alert_id}/acknowledge")
def acknowledge_alert(alert_id: int, req: AlertAcknowledgeRequest):
    updated = anomaly_detector.acknowledge_alert(alert_id, req.acknowledged_by)
    if not updated:
        raise HTTPException(status_code=404, detail=f"Alert #{alert_id} not found.")
    return updated
