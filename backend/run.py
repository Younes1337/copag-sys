#!/usr/bin/env python3
"""
Driver Monitoring System - Backend Startup Script
"""

import uvicorn
import logging

def main():
    """Start the FastAPI server"""
    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    logger = logging.getLogger(__name__)
    logger.info("🚗 Starting Driver Monitoring System Backend...")
    logger.info("🌐 Server will run on http://localhost:8000")
    logger.info("📊 WebSocket available at ws://localhost:8000/ws")
    
    # Run the server
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )

if __name__ == "__main__":
    main()
