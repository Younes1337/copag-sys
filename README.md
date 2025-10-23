# 🚗 Roboflow Driver Monitoring System

A production-ready real-time driver behavior monitoring system using Roboflow's InferencePipeline with React frontend and FastAPI backend.

## 🎯 Features

- **Real-time Detection**: Live driver behavior monitoring with <150ms latency
- **Roboflow Integration**: Uses InferencePipeline for high-performance inference
- **WebSocket Streaming**: Efficient real-time communication between frontend and backend
- **Auto-reconnection**: Robust connection handling with automatic reconnection
- **Performance Optimized**: CPU-optimized for smooth performance without GPU
- **Scalable Architecture**: Supports multiple camera feeds and concurrent users

## 🏗️ Architecture

```
React Frontend ←→ WebSocket ←→ FastAPI Backend ←→ Roboflow InferencePipeline
     ↓              ↓              ↓                    ↓
  Live Video    Real-time      Frame Processing    AI Detection
  Display       Streaming      & Optimization      & Bounding Boxes
```

## 🚀 Quick Start

### Prerequisites

- **Python 3.8+**
- **Node.js 16+**
- **Webcam/Camera**
- **Roboflow Account & API Key**

### 1. Clone and Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd copag-monitoring-system

# Set your Roboflow API key
export ROBOFLOW_API_KEY="your_api_key_here"
```

### 2. Backend Setup

```bash
# Navigate to backend
cd backend

# Install dependencies
pip install -r requirements.txt

# Start the backend server
python main.py
```

**Expected Output:**
```
INFO:main:Starting Roboflow Driver Monitoring Backend
INFO:main:WebSocket server started on ws://localhost:8000
INFO:main:Backend ready - waiting for camera commands
```

### 3. Frontend Setup

```bash
# Navigate to frontend (new terminal)
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

**Expected Output:**
```
Vite dev server running at http://localhost:5173
```

### 4. Use the System

1. **Open Browser**: Navigate to `http://localhost:5173`
2. **Click "Start Camera"**: Backend will start camera and Roboflow inference
3. **View Live Detections**: See real-time bounding boxes and detection labels
4. **Monitor Dashboard**: Watch charts update with live detection data

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```bash
# Backend Configuration
ROBOFLOW_API_KEY=your_api_key_here
ROBOFLOW_MODEL_ID=driver-behaviour-ge5cr/1
HOST=0.0.0.0
PORT=8000
DEBUG=false
LOG_LEVEL=INFO

# Performance Tuning
TARGET_FPS=30
MAX_FRAME_QUEUE_SIZE=10
MAX_CONNECTIONS=10
```

### Model Configuration

Update `backend/main.py` to use your specific model:

```python
# Line 460 in main.py
success = await ws_manager.start_inference(
    model_id="your-model-id/version",  # Your Roboflow model
    api_key="your_api_key_here"        # Your API key
)
```

## 📊 Performance Optimization

### CPU Optimization

The system is optimized for CPU environments:

- **Frame Resizing**: Automatically resizes frames to 640x480 for faster processing
- **JPEG Compression**: Optimized encoding with 85% quality for speed
- **Queue Management**: Limited frame queues to prevent memory issues
- **Threading**: Separate threads for inference and WebSocket handling

### Latency Optimization

- **Target Latency**: <150ms end-to-end
- **Frame Rate**: 30 FPS with adaptive quality
- **WebSocket**: Binary frame transmission for efficiency
- **Caching**: Smart frame caching to reduce processing

## 🛠️ Development

### Backend Development

```bash
# Run with auto-reload
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Run with debug logging
DEBUG=true python main.py
```

### Frontend Development

```bash
# Run with hot reload
npm run dev

# Build for production
npm run build
```

### Testing

```bash
# Test WebSocket connection
python test_video_stream.py

# Test camera access
python camera_test.py
```

## 📈 Monitoring

### Health Endpoints

- **Health Check**: `GET http://localhost:8000/`
- **System Status**: `GET http://localhost:8000/status`
- **WebSocket**: `ws://localhost:8000/ws`

### Performance Metrics

The system tracks:
- **FPS**: Frames per second
- **Latency**: End-to-end processing time
- **Detection Count**: Number of detections per frame
- **Connection Status**: WebSocket connection health

## 🚀 Production Deployment

### Local Production

```bash
# Backend (Terminal 1)
cd backend
python main.py

# Frontend (Terminal 2)
cd frontend
npm run build
npm run preview
```

### Cloud Deployment Options

#### Option 1: Modal GPU Endpoints (Recommended for Scale)

```python
# Create modal_gpu_inference.py
import modal

app = modal.App("roboflow-driver-monitoring")

@app.function(
    image=modal.Image.debian_slim().pip_install("inference", "roboflow"),
    gpu="T4",
    timeout=300
)
def run_inference(frame_data, model_id, api_key):
    # Run inference on Modal GPU
    # Return results to local backend
    pass
```

**Benefits:**
- **GPU Acceleration**: 10x faster inference
- **Scalability**: Handle multiple streams
- **Cost Effective**: Pay per inference

**Latency Trade-off:**
- **Local**: ~150ms (CPU)
- **Modal**: ~300ms (GPU + Network)

#### Option 2: AWS EC2

```bash
# Deploy on EC2 instance
sudo apt-get update
sudo apt-get install python3-pip nginx

# Install dependencies
pip3 install -r requirements.txt

# Run with systemd
sudo systemctl enable roboflow-monitoring
sudo systemctl start roboflow-monitoring
```

#### Option 3: Google Cloud Run

```yaml
# cloudbuild.yaml
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/roboflow-monitoring', '.']
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/roboflow-monitoring']
  - name: 'gcr.io/cloud-builders/gcloud'
    args: ['run', 'deploy', 'roboflow-monitoring', '--image', 'gcr.io/$PROJECT_ID/roboflow-monitoring']
```

## 🔍 Troubleshooting

### Common Issues

#### 1. Camera Access Denied
```bash
# Check camera permissions
ls /dev/video*

# Test camera access
python -c "import cv2; cap = cv2.VideoCapture(0); print('Camera works:', cap.isOpened())"
```

#### 2. WebSocket Connection Failed
```bash
# Check if backend is running
curl http://localhost:8000/

# Test WebSocket connection
python test_video_stream.py
```

#### 3. Low Performance
```bash
# Check system resources
htop

# Reduce frame rate
export TARGET_FPS=15

# Reduce frame quality
# Edit main.py line 85: quality = 70
```

#### 4. Model Not Loading
```bash
# Verify API key
echo $ROBOFLOW_API_KEY

# Test API connection
curl -H "Authorization: Bearer $ROBOFLOW_API_KEY" https://api.roboflow.com/
```

### Debug Mode

```bash
# Enable debug logging
export DEBUG=true
export LOG_LEVEL=DEBUG

# Run with verbose output
python main.py
```

## 📚 API Reference

### WebSocket Messages

#### Start Camera
```json
{
  "type": "start_camera"
}
```

#### Stop Camera
```json
{
  "type": "stop_camera"
}
```

#### Prediction Response
```json
{
  "type": "prediction",
  "data": {
    "detections": [
      {
        "class": "Distracted",
        "confidence": 0.85,
        "bbox": [100, 150, 200, 300],
        "timestamp": 1234567890.123
      }
    ],
    "frame_data": "base64_encoded_image",
    "timestamp": 1234567890.123,
    "counts": {
      "Dangerous Driving": 2,
      "Distracted": 8,
      "Safe Driving": 15
    }
  }
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- **Documentation**: Check this README
- **Issues**: Create a GitHub issue
- **Discussions**: Use GitHub Discussions
- **Email**: Contact the development team

---

**Built with ❤️ using Roboflow, FastAPI, and React**