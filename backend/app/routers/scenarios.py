"""
Scenario Simulation Router for LabNexus.
Lists the 8 predefined failure/recovery scenarios, executes them, and logs history.
"""
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from backend.app.simulation.engine import simulation_engine
from backend.app.schemas.schemas import ScenarioRunRequest, ScenarioOut

router = APIRouter(prefix="/scenarios", tags=["Scenarios"])

PREDEFINED_SCENARIOS = [
    {
        "id": "SCENARIO_CPU_OVERLOAD",
        "name": "Scenario 1 – CPU Overload",
        "description": "Sets target computer CPU usage to 98% via runaway process simulation and verifies critical CPU alert triggering.",
        "default_target": "PC-001",
        "severity": "critical",
        "category": "Compute"
    },
    {
        "id": "SCENARIO_MEMORY_OVERLOAD",
        "name": "Scenario 2 – Memory Overload",
        "description": "Simulates memory leak consuming 95% of available RAM, triggering memory warnings.",
        "default_target": "PC-002",
        "severity": "critical",
        "category": "Memory"
    },
    {
        "id": "SCENARIO_NETWORK_FAILURE",
        "name": "Scenario 3 – Network Failure",
        "description": "Disconnects network interface on target computer, halts telemetry heartbeats, and verifies automatic offline timeout detection.",
        "default_target": "PC-003",
        "severity": "critical",
        "category": "Network"
    },
    {
        "id": "SCENARIO_DISK_FAILURE",
        "name": "Scenario 4 – Disk Failure",
        "description": "Simulates SMART storage sector degradation and drops disk health to 15%, testing hardware warning alerts.",
        "default_target": "PC-004",
        "severity": "critical",
        "category": "Storage"
    },
    {
        "id": "SCENARIO_IDLE_COMPUTER",
        "name": "Scenario 5 – Idle Computer",
        "description": "Simulates prolonged inactivity and idle power state (CPU < 5%, 0 active user sessions).",
        "default_target": "PC-006",
        "severity": "info",
        "category": "Power & Sessions"
    },
    {
        "id": "SCENARIO_UNAUTHORIZED_SOFTWARE",
        "name": "Scenario 6 – Unauthorized Software",
        "description": "Launches unapproved application ('CryptoMiner_XMRig.exe') and verifies security violation alerts.",
        "default_target": "PC-005",
        "severity": "critical",
        "category": "Security"
    },
    {
        "id": "SCENARIO_MULTIPLE_FAILURES",
        "name": "Scenario 7 – Multiple System Failure",
        "description": "Triggers simultaneous cascading failures across PC-001 (CPU), PC-003 (RAM), and PC-005 (Network).",
        "default_target": "MULTI",
        "severity": "critical",
        "category": "Cascading Fault"
    },
    {
        "id": "SCENARIO_SYSTEM_RECOVERY",
        "name": "Scenario 8 – System Recovery",
        "description": "Restores normal metrics, reconnects network, updates machine status, and emits recovery notifications.",
        "default_target": "ALL",
        "severity": "info",
        "category": "Recovery"
    }
]

@router.get("")
def list_scenarios() -> List[Dict[str, Any]]:
    return PREDEFINED_SCENARIOS

@router.post("/run")
def run_scenario(req: ScenarioRunRequest):
    result = simulation_engine.run_scenario(req.scenario_id, req.target_pc_id)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result

@router.get("/history")
def get_scenario_history(limit: int = 30) -> List[Dict[str, Any]]:
    return simulation_engine.scenario_history[:limit]
