"""
Automated Integration and Functional Tests for LabNexus.
Tests simulation engine, metrics generation, scenarios, offline detection,
booking conflict detection, and API endpoints.
"""
import pytest
from datetime import datetime, timedelta
from fastapi import HTTPException
from backend.app.database import SessionLocal
from backend.app.simulation.engine import simulation_engine
from backend.app.routers.computers import list_computers, manual_simulate, disconnect_network, reconnect_network, recover_computer
from backend.app.routers.scenarios import run_scenario, PREDEFINED_SCENARIOS
from backend.app.routers.monitoring import get_monitoring_summary, get_live_metrics
from backend.app.routers.resources import create_booking, list_bookings
from backend.app.routers.analytics import get_predictive_maintenance_forecasts, get_analytics_summary
from backend.app.schemas.schemas import ManualSimulationRequest, ScenarioRunRequest, LabBookingCreate
from backend.app.analytics.anomaly_detector import anomaly_detector

def test_10_computers_initialization():
    """Verify all 10 computers exist with unique IDs and independent specifications"""
    comps = list_computers()
    assert len(comps) == 10
    expected_ids = [f"PC-{i:03d}" for i in range(1, 11)]
    for eid in expected_ids:
        comp = next((c for c in comps if c["computer_id"] == eid), None)
        assert comp is not None
        assert comp["cpu_cores"] > 0
        assert comp["ram_capacity_gb"] > 0
        assert 0.0 <= comp["cpu_percent"] <= 100.0
        assert 0.0 <= comp["ram_percent"] <= 100.0
        assert 0.0 <= comp["disk_percent"] <= 100.0
        assert 0.0 <= comp["health_score"] <= 100.0

def test_metrics_independence():
    """Verify computers do not all have identical values"""
    p1 = simulation_engine.get_computer("PC-001")
    p2 = simulation_engine.get_computer("PC-002")
    assert p1.computer_id != p2.computer_id
    assert p1.cpu_model != p2.cpu_model or p1.ram_capacity_gb != p2.ram_capacity_gb

def test_monitoring_summary():
    """Verify live monitoring summary"""
    summary = get_monitoring_summary()
    assert summary["total_computers"] == 10
    assert summary["online_computers"] >= 1
    assert 0.0 <= summary["avg_cpu_percent"] <= 100.0

def test_manual_simulation_override_and_recovery():
    """Verify manual override of CPU, RAM, and recovery"""
    target_id = "PC-001"
    sim_req = ManualSimulationRequest(cpu_override=97.5, ram_override=92.0)
    res = manual_simulate(target_id, sim_req)
    assert res["status"] == "applied"
    
    p1 = simulation_engine.get_computer(target_id)
    assert p1.manual_cpu_override == 97.5
    assert p1.manual_ram_override == 92.0

    # Test Anomaly Detector picks up CPU critical
    simulation_engine.tick_all()
    anomaly_detector.evaluate_computer(p1.to_dict())
    assert "PC-001:CPU" in anomaly_detector.active_alerts

    # Recover
    rec = recover_computer(target_id)
    assert rec["status"] == "recovered"
    assert p1.manual_cpu_override is None
    assert p1.manual_ram_override is None

def test_offline_detection_on_network_disconnect():
    """Verify network disconnect halts heartbeat and triggers offline status"""
    target_id = "PC-003"
    disconnect_network(target_id)
    p3 = simulation_engine.get_computer(target_id)
    assert p3.network_connected is False

    p3.last_heartbeat = datetime.utcnow() - timedelta(seconds=20)
    simulation_engine.tick_all()

    assert p3.status == "offline"
    assert p3.health_score == 0.0

    # Reconnect
    reconnect_network(target_id)
    assert p3.network_connected is True
    assert p3.status == "online"

def test_scenario_execution():
    """Verify predefined scenarios and recovery"""
    scen_res = run_scenario(ScenarioRunRequest(scenario_id="SCENARIO_CPU_OVERLOAD", target_pc_id="PC-005"))
    assert scen_res["execution_status"] == "running"
    p5 = simulation_engine.get_computer("PC-005")
    assert p5.manual_cpu_override == 98.0

    # Recovery
    rec_scen = run_scenario(ScenarioRunRequest(scenario_id="SCENARIO_SYSTEM_RECOVERY", target_pc_id="PC-005"))
    assert rec_scen["execution_status"] == "recovered"
    assert p5.manual_cpu_override is None

def test_booking_conflict_detection():
    """Verify automated booking conflict rejection for overlapping timeslots"""
    db = SessionLocal()
    try:
        b_a = LabBookingCreate(
            lab_id=1,
            faculty_name="Prof. Turing",
            purpose="CS-301 Lecture",
            booking_date="2026-12-15",
            start_time="10:00",
            end_time="12:00"
        )
        res_a = create_booking(b_a, db)
        assert res_a.id is not None

        # Conflicting booking (11:00 - 13:00)
        conflict_detected = False
        try:
            b_b = LabBookingCreate(
                lab_id=1,
                faculty_name="Dr. Lovelace",
                purpose="Practicum",
                booking_date="2026-12-15",
                start_time="11:00",
                end_time="13:00"
            )
            create_booking(b_b, db)
        except HTTPException as e:
            if e.status_code == 409 and "Conflict" in e.detail:
                conflict_detected = True
        assert conflict_detected, "Booking conflict was not detected!"
    finally:
        db.close()

def test_predictive_maintenance():
    """Verify predictive maintenance forecasts and disclaimer"""
    pm = get_predictive_maintenance_forecasts()
    assert "disclaimer" in pm
    assert len(pm["forecasts"]) == 10
    for f in pm["forecasts"]:
        assert 0.0 <= f["failure_risk_score"] <= 100.0
        assert f["maintenance_urgency"] in ["Immediate Action Required", "Scheduled Maintenance", "Normal Maintenance Cycle"]
        assert len(f["risk_factors"]) > 0
