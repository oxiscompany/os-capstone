"""
Monitoring Router for LabNexus.
Live telemetry feeds, historical metric series for graphs, and high-level health overview.
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from datetime import datetime, timedelta
from backend.app.database import get_db
from backend.app.models.entities import ComputerMetric
from backend.app.simulation.engine import simulation_engine
from backend.app.schemas.schemas import MonitoringSummaryOut, MetricDataPoint

router = APIRouter(prefix="", tags=["Monitoring"])

@router.get("/metrics/live")
def get_live_metrics():
    """Live snapshot of all 10 virtual computers"""
    return simulation_engine.get_telemetry_snapshot()

@router.get("/metrics/history/{computer_id}", response_model=List[MetricDataPoint])
def get_metrics_history(computer_id: str, limit: int = Query(30, ge=5, le=300), db: Session = Depends(get_db)):
    """Historical telemetry for individual computer charts"""
    records = db.query(ComputerMetric).filter(
        ComputerMetric.computer_id == computer_id
    ).order_by(ComputerMetric.timestamp.desc()).limit(limit).all()

    # Return chronological order (oldest to newest)
    records.reverse()

    results = []
    for r in records:
        results.append(MetricDataPoint(
            timestamp=r.timestamp.strftime("%H:%M:%S") if r.timestamp else datetime.utcnow().strftime("%H:%M:%S"),
            cpu_percent=r.cpu_percent,
            ram_percent=r.ram_percent,
            disk_percent=r.disk_percent,
            disk_health=r.disk_health,
            network_rx_kbps=r.network_rx_kbps,
            network_tx_kbps=r.network_tx_kbps,
            health_score=r.health_score
        ))

    # If DB doesn't have enough history yet, supplement from current state
    if not results:
        pc = simulation_engine.get_computer(computer_id)
        if pc:
            results.append(MetricDataPoint(
                timestamp=datetime.utcnow().strftime("%H:%M:%S"),
                cpu_percent=pc.cpu_percent,
                ram_percent=pc.ram_percent,
                disk_percent=pc.disk_percent,
                disk_health=pc.disk_health,
                network_rx_kbps=pc.network_rx_kbps,
                network_tx_kbps=pc.network_tx_kbps,
                health_score=pc.health_score
            ))

    return results

@router.get("/monitoring/summary", response_model=MonitoringSummaryOut)
def get_monitoring_summary():
    """Summary KPI cards for Main Dashboard"""
    snapshot = simulation_engine.get_telemetry_snapshot()
    return snapshot["summary"]
