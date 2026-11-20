"""
Simulation Control Router for LabNexus.
Global lifecycle management (start, pause, resume, stop, reset), speed configuration, and simulation events.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from backend.app.simulation.engine import simulation_engine

router = APIRouter(prefix="/simulation", tags=["Simulation Control"])

class SpeedConfigRequest(BaseModel):
    speed_multiplier: float
    interval_seconds: Optional[float] = None

@router.post("/start")
async def start_simulation():
    res = await simulation_engine.start()
    return res

@router.post("/pause")
def pause_simulation():
    return simulation_engine.pause()

@router.post("/resume")
def resume_simulation():
    return simulation_engine.resume()

@router.post("/stop")
async def stop_simulation():
    res = await simulation_engine.stop()
    return res

@router.post("/reset")
def reset_simulation():
    return simulation_engine.reset()

@router.get("/status")
def get_simulation_status():
    return {
        "is_running": simulation_engine.is_running,
        "is_paused": simulation_engine.is_paused,
        "speed_multiplier": simulation_engine.speed_multiplier,
        "interval_seconds": simulation_engine.interval_seconds,
        "mode": simulation_engine.mode,
        "computers_count": len(simulation_engine.computers),
        "recent_events_count": len(simulation_engine.simulation_events)
    }

@router.post("/config")
def update_simulation_config(cfg: SpeedConfigRequest):
    if cfg.speed_multiplier <= 0:
        raise HTTPException(status_code=400, detail="Speed multiplier must be positive.")
    simulation_engine.speed_multiplier = cfg.speed_multiplier
    if cfg.interval_seconds and cfg.interval_seconds > 0:
        simulation_engine.interval_seconds = cfg.interval_seconds
    simulation_engine.record_event(
        "CONFIG_UPDATED",
        f"Speed multiplier set to {cfg.speed_multiplier}x, interval: {simulation_engine.interval_seconds}s",
        "GLOBAL"
    )
    return {
        "speed_multiplier": simulation_engine.speed_multiplier,
        "interval_seconds": simulation_engine.interval_seconds
    }

@router.get("/events")
def get_simulation_events(limit: int = 50) -> List[Dict[str, Any]]:
    return simulation_engine.simulation_events[:limit]
