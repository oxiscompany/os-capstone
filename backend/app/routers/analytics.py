"""
Analytics & Intelligence Router for LabNexus.
Resource utilization, health score breakdowns, and predictive maintenance forecasts.
"""
from fastapi import APIRouter
from typing import List, Dict, Any
from backend.app.simulation.engine import simulation_engine
from backend.app.analytics.health_scorer import HealthScorer
from backend.app.analytics.predictive_maintenance import predictive_maintenance_engine

router = APIRouter(prefix="/analytics", tags=["Analytics & Intelligence"])

@router.get("/summary")
def get_analytics_summary():
    snapshot = simulation_engine.get_telemetry_snapshot()
    comps = snapshot["computers"]

    # Health distribution
    healthy = sum(1 for c in comps if c["health_score"] >= 75.0 and c["status"] == "online")
    warning = sum(1 for c in comps if 40.0 <= c["health_score"] < 75.0 or c["status"] == "warning")
    critical = sum(1 for c in comps if c["health_score"] < 40.0 or c["status"] == "critical")
    offline = sum(1 for c in comps if c["status"] == "offline")

    # Lab utilization factor
    active_users_count = sum(1 for c in comps if c.get("active_user"))
    lab_occupancy_rate = round((active_users_count / max(1, len(comps))) * 100.0, 1)

    return {
        "summary": snapshot["summary"],
        "health_distribution": {
            "healthy": healthy,
            "warning": warning,
            "critical": critical,
            "offline": offline
        },
        "occupancy": {
            "total_workstations": len(comps),
            "occupied_workstations": active_users_count,
            "occupancy_rate_percent": lab_occupancy_rate
        }
    }

@router.get("/utilization")
def get_utilization_breakdown() -> List[Dict[str, Any]]:
    """Per-computer utilization comparison across CPU, RAM, Disk, and Network"""
    comps = [pc.to_dict() for pc in simulation_engine.computers.values()]
    return [
        {
            "computer_id": c["computer_id"],
            "name": c["name"],
            "cpu_percent": c["cpu_percent"],
            "ram_percent": c["ram_percent"],
            "disk_percent": c["disk_percent"],
            "network_rx_kbps": c["network_rx_kbps"],
            "network_tx_kbps": c["network_tx_kbps"],
            "status": c["status"]
        }
        for c in comps
    ]

@router.get("/health")
def get_health_breakdown() -> List[Dict[str, Any]]:
    """Detailed category health sub-scores (CPU, RAM, Disk, Network) for each PC"""
    results = []
    for pc in simulation_engine.computers.values():
        c_dict = pc.to_dict()
        sub_scores = HealthScorer.calculate_sub_scores(c_dict)
        results.append({
            "computer_id": pc.computer_id,
            "name": pc.name,
            "status": pc.status,
            **sub_scores
        })
    return results

@router.get("/predictive-maintenance")
def get_predictive_maintenance_forecasts() -> Dict[str, Any]:
    """
    Predictive maintenance forecasts with failure risk scores and transparency disclaimer.
    """
    forecasts = []
    for pc in simulation_engine.computers.values():
        c_dict = pc.to_dict()
        forecast = predictive_maintenance_engine.analyze_computer_trajectory(c_dict, [])
        forecasts.append(forecast)

    # Sort descending by failure risk
    forecasts.sort(key=lambda x: x["failure_risk_score"], reverse=True)

    high_risk_count = sum(1 for f in forecasts if f["failure_risk_score"] >= 80.0)
    medium_risk_count = sum(1 for f in forecasts if 50.0 <= f["failure_risk_score"] < 80.0)
    low_risk_count = sum(1 for f in forecasts if f["failure_risk_score"] < 50.0)

    return {
        "disclaimer": predictive_maintenance_engine.disclaimer,
        "high_risk_computers_count": high_risk_count,
        "medium_risk_computers_count": medium_risk_count,
        "low_risk_computers_count": low_risk_count,
        "forecasts": forecasts
    }
