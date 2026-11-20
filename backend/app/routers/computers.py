"""
Computers Router for LabNexus.
CRUD, detailed diagnostics, and individual virtual computer fault injection/overrides.
"""
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from backend.app.database import get_db
from backend.app.models.entities import Computer, HardwareInventory, ComputerSession, Alert
from backend.app.simulation.engine import simulation_engine
from backend.app.schemas.schemas import (
    ComputerOut, ComputerDetailOut, ManualSimulationRequest,
    ProcessStartRequest, ComputerUpdate
)

router = APIRouter(prefix="/computers", tags=["Virtual Computers"])

class LoginSimulationRequest(BaseModel):
    username: str

@router.get("", response_model=List[ComputerOut])
def list_computers():
    """List all 10 virtual computers with current live telemetry"""
    data = [pc.to_dict() for pc in simulation_engine.computers.values()]
    return data

@router.get("/{computer_id}")
def get_computer_detail(computer_id: str, db: Session = Depends(get_db)):
    """Detailed diagnostic view for single computer"""
    pc = simulation_engine.get_computer(computer_id)
    if not pc:
        raise HTTPException(status_code=404, detail=f"Computer {computer_id} not found.")

    comp_dict = pc.to_dict()

    # Query hardware inventory from DB
    hw_records = db.query(HardwareInventory).filter(HardwareInventory.computer_id == computer_id).all()
    hardware_list = [
        {
            "id": h.id,
            "component_type": h.component_type,
            "brand": h.brand,
            "model": h.model,
            "serial_number": h.serial_number,
            "status": h.status
        }
        for h in hw_records
    ]

    # Query recent alerts for this computer
    recent_alerts = db.query(Alert).filter(Alert.computer_id == computer_id).order_by(Alert.id.desc()).limit(10).all()
    alerts_list = [
        {
            "id": a.id,
            "title": a.title,
            "severity": a.severity,
            "message": a.message,
            "created_at": a.created_at.isoformat() if a.created_at else None,
            "is_resolved": a.is_resolved
        }
        for a in recent_alerts
    ]

    # Query session history
    sessions = db.query(ComputerSession).filter(ComputerSession.computer_id == computer_id).order_by(ComputerSession.id.desc()).limit(5).all()
    session_list = [
        {
            "id": s.id,
            "user_name": s.user_name,
            "login_time": s.login_time.isoformat() if s.login_time else None,
            "logout_time": s.logout_time.isoformat() if s.logout_time else None,
            "duration_seconds": s.duration_seconds,
            "session_type": s.session_type,
            "status": s.status
        }
        for s in sessions
    ]

    comp_dict["hardware_inventory"] = hardware_list
    comp_dict["recent_alerts"] = alerts_list
    comp_dict["session_history"] = session_list
    return comp_dict

@router.put("/{computer_id}")
def update_computer(computer_id: str, update_data: ComputerUpdate, db: Session = Depends(get_db)):
    pc = simulation_engine.get_computer(computer_id)
    if not pc:
        raise HTTPException(status_code=404, detail=f"Computer {computer_id} not found.")

    if update_data.name:
        pc.name = update_data.name
    if update_data.os_name:
        pc.os_name = update_data.os_name
    if update_data.ram_capacity_gb:
        pc.ram_capacity_gb = update_data.ram_capacity_gb
    if update_data.storage_capacity_gb:
        pc.storage_capacity_gb = update_data.storage_capacity_gb

    # Sync to DB record
    db_comp = db.query(Computer).filter(Computer.computer_id == computer_id).first()
    if db_comp:
        if update_data.name: db_comp.name = update_data.name
        if update_data.os_name: db_comp.os_name = update_data.os_name
        if update_data.ram_capacity_gb: db_comp.ram_capacity_gb = update_data.ram_capacity_gb
        if update_data.storage_capacity_gb: db_comp.storage_capacity_gb = update_data.storage_capacity_gb
        db.commit()

    return pc.to_dict()

# --- Manual Simulation & Injections ---

@router.post("/{computer_id}/simulate")
def manual_simulate(computer_id: str, req: ManualSimulationRequest):
    pc = simulation_engine.get_computer(computer_id)
    if not pc:
        raise HTTPException(status_code=404, detail=f"Computer {computer_id} not found.")

    changes = []
    if req.cpu_override is not None:
        pc.manual_cpu_override = req.cpu_override
        changes.append(f"CPU set to {req.cpu_override}%")
    if req.ram_override is not None:
        pc.manual_ram_override = req.ram_override
        changes.append(f"RAM set to {req.ram_override}%")
    if req.disk_override is not None:
        pc.manual_disk_override = req.disk_override
        changes.append(f"Disk utilization set to {req.disk_override}%")
    if req.disk_health_override is not None:
        pc.manual_disk_health_override = req.disk_health_override
        changes.append(f"Disk health set to {req.disk_health_override}%")
    if req.disconnect_network is not None:
        pc.network_connected = not req.disconnect_network
        changes.append("Network disconnected" if req.disconnect_network else "Network reconnected")
    if req.trigger_fault:
        pc.trigger_hardware_fault()
        changes.append("Hardware fault triggered")
    if req.restore_health:
        pc.restore_health()
        changes.append("Health restored to pristine state")

    simulation_engine.record_event(
        "MANUAL_INJECTION",
        f"Manual parameters applied to {computer_id}: " + "; ".join(changes),
        computer_id
    )
    return {"status": "applied", "computer": pc.to_dict()}

@router.post("/{computer_id}/disconnect")
def disconnect_network(computer_id: str):
    pc = simulation_engine.get_computer(computer_id)
    if not pc:
        raise HTTPException(status_code=404, detail=f"Computer {computer_id} not found.")
    pc.network_connected = False
    simulation_engine.record_event("NETWORK_DISCONNECT", f"Network cable unplugged on {computer_id}", computer_id)
    return {"status": "disconnected", "computer_id": computer_id}

@router.post("/{computer_id}/reconnect")
def reconnect_network(computer_id: str):
    pc = simulation_engine.get_computer(computer_id)
    if not pc:
        raise HTTPException(status_code=404, detail=f"Computer {computer_id} not found.")
    pc.network_connected = True
    pc.restore_health()
    simulation_engine.record_event("NETWORK_RECONNECT", f"Network connection restored on {computer_id}", computer_id)
    return {"status": "connected", "computer_id": computer_id}

@router.post("/{computer_id}/recover")
def recover_computer(computer_id: str):
    pc = simulation_engine.get_computer(computer_id)
    if not pc:
        raise HTTPException(status_code=404, detail=f"Computer {computer_id} not found.")
    pc.restore_health()
    simulation_engine.record_event("SYSTEM_RECOVERED", f"{computer_id} normalized and restored to full health.", computer_id)
    return {"status": "recovered", "computer": pc.to_dict()}

# --- Process Controls ---

@router.post("/{computer_id}/processes/start")
def start_process(computer_id: str, req: ProcessStartRequest):
    pc = simulation_engine.get_computer(computer_id)
    if not pc:
        raise HTTPException(status_code=404, detail=f"Computer {computer_id} not found.")
    proc = pc.add_process(req.name, req.base_cpu, req.base_ram_mb, req.is_approved)
    simulation_engine.record_event("PROCESS_STARTED", f"Process '{req.name}' (PID {proc.pid}) launched on {computer_id}.", computer_id)
    return proc.to_dict()

@router.post("/{computer_id}/processes/{pid}/stop")
def terminate_process(computer_id: str, pid: int):
    pc = simulation_engine.get_computer(computer_id)
    if not pc:
        raise HTTPException(status_code=404, detail=f"Computer {computer_id} not found.")
    success = pc.terminate_process(pid)
    if not success:
        raise HTTPException(status_code=400, detail="Cannot terminate system process or PID not found.")
    simulation_engine.record_event("PROCESS_TERMINATED", f"Process PID {pid} killed on {computer_id}.", computer_id)
    return {"status": "terminated", "pid": pid}

# --- Session Controls ---

@router.post("/{computer_id}/login")
def simulate_login(computer_id: str, req: LoginSimulationRequest, db: Session = Depends(get_db)):
    pc = simulation_engine.get_computer(computer_id)
    if not pc:
        raise HTTPException(status_code=404, detail=f"Computer {computer_id} not found.")
    pc.simulate_login(req.username)
    # Save session in DB
    new_sess = ComputerSession(
        computer_id=computer_id,
        user_name=req.username,
        session_type="Student Lab Work",
        status="active"
    )
    db.add(new_sess)
    db.commit()
    simulation_engine.record_event("USER_LOGIN", f"User '{req.username}' logged into {computer_id}.", computer_id)
    return {"status": "logged_in", "user": req.username}

@router.post("/{computer_id}/logout")
def simulate_logout(computer_id: str, db: Session = Depends(get_db)):
    pc = simulation_engine.get_computer(computer_id)
    if not pc:
        raise HTTPException(status_code=404, detail=f"Computer {computer_id} not found.")
    old_user = pc.active_user
    pc.simulate_logout()
    # Close active session in DB
    active_sess = db.query(ComputerSession).filter(
        ComputerSession.computer_id == computer_id,
        ComputerSession.status == "active"
    ).order_by(ComputerSession.id.desc()).first()
    if active_sess:
        active_sess.status = "closed"
        active_sess.logout_time = pc.last_heartbeat
        db.commit()
    simulation_engine.record_event("USER_LOGOUT", f"User '{old_user}' logged out from {computer_id}.", computer_id)
    return {"status": "logged_out"}
