import json
import logging
from typing import Dict, List
from fastapi import WebSocket

logger = logging.getLogger("evoyage.ws")


class ConnectionManager:
    def __init__(self):
        # Maps trip_id to list of active WebSockets
        self.active_connections: Dict[str, List[WebSocket]] = {}
        # Global broadcast connections
        self.global_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket, trip_id: str = "global"):
        await websocket.accept()
        if trip_id not in self.active_connections:
            self.active_connections[trip_id] = []
        self.active_connections[trip_id].append(websocket)
        logger.info(f"WebSocket connected for trip: {trip_id}")

    def disconnect(self, websocket: WebSocket, trip_id: str = "global"):
        if trip_id in self.active_connections and websocket in self.active_connections[trip_id]:
            self.active_connections[trip_id].remove(websocket)
            logger.info(f"WebSocket disconnected for trip: {trip_id}")

    async def broadcast_to_trip(self, trip_id: str, message: dict):
        if trip_id in self.active_connections:
            data = json.dumps(message)
            for connection in self.active_connections[trip_id]:
                try:
                    await connection.send_text(data)
                except Exception as e:
                    logger.warning(f"Error sending to ws: {e}")

    async def broadcast_all(self, message: dict):
        data = json.dumps(message)
        for trip_conns in self.active_connections.values():
            for connection in trip_conns:
                try:
                    await connection.send_text(data)
                except Exception as e:
                    logger.warning(f"Error broadcasting ws: {e}")


ws_manager = ConnectionManager()
