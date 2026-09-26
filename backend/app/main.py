import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database.supabase_client import init_supabase
from app.simulation.ws_manager import ws_manager
from app.routers import vehicles, stations, trips, simulation, multi_ev, history

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("evoyage.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting {settings.PROJECT_NAME} v{settings.VERSION}...")
    init_supabase()
    yield
    logger.info("Shutting down EVoyage AI server.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan
)

# CORS configuration for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# REST API Routers
app.include_router(vehicles.router, prefix=settings.API_V1_PREFIX)
app.include_router(stations.router, prefix=settings.API_V1_PREFIX)
app.include_router(trips.router, prefix=settings.API_V1_PREFIX)
app.include_router(simulation.router, prefix=settings.API_V1_PREFIX)
app.include_router(multi_ev.router, prefix=settings.API_V1_PREFIX)
app.include_router(history.router, prefix=settings.API_V1_PREFIX)


# WebSocket Endpoints
@app.websocket("/ws/trips/{trip_id}")
async def websocket_trip_endpoint(websocket: WebSocket, trip_id: str):
    await ws_manager.connect(websocket, trip_id)
    try:
        while True:
            data = await websocket.receive_text()
            # Echo or process incoming commands if needed
            logger.info(f"Received WS message on trip {trip_id}: {data}")
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, trip_id)


@app.websocket("/ws/live")
async def websocket_live_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket, "global")
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, "global")


@app.get("/")
async def root():
    return {
        "status": "online",
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "demo_mode": settings.DEMO_MODE,
        "supported_corridors": ["INDORE_UJJAIN", "INDORE_MAHESHWAR", "GWALIOR_JAIPUR"]
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}
