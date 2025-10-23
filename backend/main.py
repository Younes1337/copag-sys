#!/usr/bin/env python3
"""
Driver Monitoring System - Backend Server
Step 1: Basic FastAPI server
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import json
import logging
from datetime import datetime
from typing import List

# --- 🚀 FastAPI App ---
app = FastAPI(
    title="Driver Monitoring System",
    description="Real-time driver distraction detection with AI",
    version="1.0.0"
)

# CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 📊 Simple State Management ---
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.stats = {
            "total_connections": 0,
            "is_monitoring": False,
            "last_update": None
        }
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        self.stats["total_connections"] = len(self.active_connections)
        self.stats["last_update"] = datetime.now().isoformat()
        logging.info(f"Client connected. Total connections: {len(self.active_connections)}")
    
    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        self.stats["total_connections"] = len(self.active_connections)
        self.stats["last_update"] = datetime.now().isoformat()
        logging.info(f"Client disconnected. Total connections: {len(self.active_connections)}")
    
    async def send_to_all(self, message: dict):
        """Send message to all connected clients"""
        for connection in self.active_connections:
            try:
                await connection.send_text(json.dumps(message))
            except:
                # Remove dead connections
                if connection in self.active_connections:
                    self.active_connections.remove(connection)

# Initialize connection manager
manager = ConnectionManager()

# --- 🔌 WebSocket Endpoint ---
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time communication"""
    await manager.connect(websocket)
    
    try:
        while True:
            # Keep connection alive and handle incoming messages
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Handle different message types
            if message.get("type") == "ping":
                await websocket.send_text(json.dumps({
                    "type": "pong",
                    "timestamp": datetime.now().isoformat()
                }))
            elif message.get("type") == "get_stats":
                await websocket.send_text(json.dumps({
                    "type": "stats",
                    "data": manager.stats
                }))
            elif message.get("type") == "start_monitoring":
                manager.stats["is_monitoring"] = True
                manager.stats["last_update"] = datetime.now().isoformat()
                await websocket.send_text(json.dumps({
                    "type": "monitoring_started",
                    "message": "Monitoring started successfully"
                }))
            elif message.get("type") == "stop_monitoring":
                manager.stats["is_monitoring"] = False
                manager.stats["last_update"] = datetime.now().isoformat()
                await websocket.send_text(json.dumps({
                    "type": "monitoring_stopped",
                    "message": "Monitoring stopped successfully"
                }))
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logging.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)

# --- 🎯 API Endpoints ---
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Driver Monitoring System API",
        "status": "running",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "active_connections": len(manager.active_connections),
        "monitoring": manager.stats["is_monitoring"]
    }

@app.get("/stats")
async def get_stats():
    """Get system statistics"""
    return {
        "stats": manager.stats,
        "timestamp": datetime.now().isoformat()
    }

@app.post("/start")
async def start_monitoring():
    """Start monitoring"""
    manager.stats["is_monitoring"] = True
    manager.stats["last_update"] = datetime.now().isoformat()
    
    # Notify all connected clients
    await manager.send_to_all({
        "type": "monitoring_started",
        "message": "Monitoring started from API"
    })
    
    return {"message": "Monitoring started", "status": "success"}

@app.post("/stop")
async def stop_monitoring():
    """Stop monitoring"""
    manager.stats["is_monitoring"] = False
    manager.stats["last_update"] = datetime.now().isoformat()
    
    # Notify all connected clients
    await manager.send_to_all({
        "type": "monitoring_stopped",
        "message": "Monitoring stopped from API"
    })
    
    return {"message": "Monitoring stopped", "status": "success"}

# --- 🚀 Startup Event ---
@app.on_event("startup")
async def startup_event():
    """Initialize the server on startup"""
    logging.basicConfig(level=logging.INFO)
    logging.info("🚗 Starting Driver Monitoring System...")
    logging.info("✅ Server ready!")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
