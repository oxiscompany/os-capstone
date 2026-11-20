"""
WebSocket Router for LabNexus live telemetry streaming.
Endpoint: /ws/monitoring
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from backend.app.websockets.manager import ws_manager
from backend.app.simulation.engine import simulation_engine
import logging

logger = logging.getLogger("labnexus.websocket")
router = APIRouter(tags=["WebSocket"])

@router.websocket("/ws/monitoring")
async def monitoring_websocket_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        # Immediately send current state snapshot on connect
        snapshot = simulation_engine.get_telemetry_snapshot()
        await websocket.send_json({
            "type": "INITIAL_TELEMETRY",
            "data": snapshot
        })

        # Client keep-alive loop
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception as e:
        logger.warning(f"WebSocket connection error: {e}")
        ws_manager.disconnect(websocket)
