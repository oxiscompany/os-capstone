"""
LabNexus - Intelligent Computer Laboratory Monitoring and Resource Management System
Main FastAPI Application Entrypoint.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
import asyncio
from datetime import datetime

from backend.app.config import settings
from backend.app.database import SessionLocal, engine, Base
from backend.app.seed import init_and_seed_db
from backend.app.models.entities import ComputerMetric, Computer, Alert
from backend.app.simulation.engine import simulation_engine
from backend.app.analytics.anomaly_detector import anomaly_detector
from backend.app.websockets.manager import ws_manager

# Import API Routers
from backend.app.routers.auth import router as auth_router
from backend.app.routers.simulation import router as simulation_router
from backend.app.routers.computers import router as computers_router
from backend.app.routers.monitoring import router as monitoring_router
from backend.app.routers.scenarios import router as scenarios_router
from backend.app.routers.alerts import router as alerts_router
from backend.app.routers.analytics import router as analytics_router
from backend.app.routers.resources import router as resources_router
from backend.app.routers.ws import router as ws_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("labnexus")

async def on_telemetry_tick(snapshot: dict):
    """
    Called each simulation cycle. Evaluates anomalies, saves telemetry records,
    and broadcasts live updates over WebSockets.
    """
    computers_data = snapshot.get("computers", [])

    # 1. Anomaly Detection & Alerts evaluation
    triggered_alerts = []
    for comp in computers_data:
        events = anomaly_detector.evaluate_computer(comp)
        if events:
            triggered_alerts.extend(events)

    # 2. Persist metrics and any new alerts into database
    db = SessionLocal()
    try:
        now = datetime.utcnow()
        for comp in computers_data:
            # Update Computer record state snapshot
            db_pc = db.query(Computer).filter(Computer.computer_id == comp["computer_id"]).first()
            if db_pc:
                db_pc.status = comp["status"]
                db_pc.health_score = comp["health_score"]
                db_pc.active_user = comp["active_user"]
                db_pc.uptime_seconds = comp["uptime_seconds"]
                db_pc.last_heartbeat = now if comp["network_connected"] else db_pc.last_heartbeat

            # Store telemetry record
            metric = ComputerMetric(
                computer_id=comp["computer_id"],
                timestamp=now,
                cpu_percent=comp["cpu_percent"],
                ram_percent=comp["ram_percent"],
                disk_percent=comp["disk_percent"],
                disk_health=comp["disk_health"],
                network_rx_kbps=comp["network_rx_kbps"],
                network_tx_kbps=comp["network_tx_kbps"],
                health_score=comp["health_score"],
                status=comp["status"]
            )
            db.add(metric)

        # Store newly triggered alerts in DB
        for a in triggered_alerts:
            db_alert = Alert(
                computer_id=a["computer_id"],
                alert_type=a["alert_type"],
                severity=a["severity"],
                title=a["title"],
                message=a["message"],
                metric_name=a.get("metric_name"),
                metric_value=a.get("metric_value"),
                threshold_value=a.get("threshold_value"),
                is_acknowledged=a.get("is_acknowledged", False),
                is_resolved=a.get("is_resolved", False)
            )
            db.add(db_alert)

        db.commit()
    except Exception as e:
        logger.error(f"Error persisting telemetry to DB: {e}")
        db.rollback()
    finally:
        db.close()

    # 3. Broadcast to all active WebSocket clients
    await ws_manager.broadcast_json("TELEMETRY_UPDATE", snapshot)
    if triggered_alerts:
        await ws_manager.broadcast_json("ALERT_TRIGGERED", triggered_alerts)

def on_simulation_event(event: dict):
    """Broadcast simulation event to WebSockets"""
    asyncio.create_task(ws_manager.broadcast_json("SIMULATION_EVENT", event))

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup sequence
    logger.info("Initializing LabNexus database and seed records...")
    init_and_seed_db()

    # Hook simulation callbacks
    simulation_engine.register_telemetry_callback(on_telemetry_tick)
    simulation_engine.register_event_callback(on_simulation_event)

    # Start simulation engine if not testing
    import os
    if os.getenv("TESTING") != "true":
        logger.info("Starting Virtual Computer Simulation Engine...")
        await simulation_engine.start()

    yield

    # Shutdown sequence
    if os.getenv("TESTING") != "true":
        logger.info("Stopping Simulation Engine...")
        await simulation_engine.stop()

app = FastAPI(
    title="LabNexus API",
    description="Intelligent Computer Laboratory Monitoring and Resource Management System",
    version=settings.PROJECT_VERSION,
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all routers
app.include_router(auth_router, prefix=settings.API_V1_PREFIX)
app.include_router(simulation_router, prefix=settings.API_V1_PREFIX)
app.include_router(computers_router, prefix=settings.API_V1_PREFIX)
app.include_router(monitoring_router, prefix=settings.API_V1_PREFIX)
app.include_router(scenarios_router, prefix=settings.API_V1_PREFIX)
app.include_router(alerts_router, prefix=settings.API_V1_PREFIX)
app.include_router(analytics_router, prefix=settings.API_V1_PREFIX)
app.include_router(resources_router, prefix=settings.API_V1_PREFIX)
app.include_router(ws_router) # /ws/monitoring

@app.get("/")
def root():
    return {
        "system": "LabNexus - Computer Laboratory Monitoring & Resource Management Simulation",
        "status": "online",
        "version": settings.PROJECT_VERSION,
        "docs": "/docs",
        "computers_monitored": len(simulation_engine.computers)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=False)
