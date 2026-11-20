"""
WebSocket Connection Manager for LabNexus.
Handles client connection lifecycles, ping/pong, and broadcasting telemetry and alerts.
"""
from typing import List, Dict, Any
from fastapi import WebSocket
import logging
import json

logger = logging.getLogger("labnexus.websocket")

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket client connected. Total clients: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"WebSocket client disconnected. Total clients: {len(self.active_connections)}")

    async def broadcast_json(self, message_type: str, data: Any):
        """Broadcast payload to all connected frontend clients"""
        if not self.active_connections:
            return

        payload = {
            "type": message_type,
            "data": data
        }
        
        # Prepare text JSON
        text = json.dumps(payload, default=str)
        dead_connections = []

        for connection in self.active_connections:
            try:
                await connection.send_text(text)
            except Exception as e:
                logger.warning(f"Error sending message to client: {e}")
                dead_connections.append(connection)

        # Clean up stale disconnected sockets
        for dead in dead_connections:
            self.disconnect(dead)

ws_manager = ConnectionManager()
