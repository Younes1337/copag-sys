# 🚀 Client-Side Roboflow Inference Setup Guide

This guide will help you set up client-side Roboflow inference using Inference.js in your React application.

## 📋 Prerequisites

- **Node.js 16+** installed
- **Roboflow Account** with API key
- **Webcam/Camera** access
- **Modern Browser** with WebGL support

## 🔧 Setup Steps

### 1. Install Dependencies

The `inferencejs` package has already been installed. If you need to reinstall:

```bash
cd frontend
npm install inferencejs
```

### 2. Configure Roboflow API

#### Option A: Environment Variables (Recommended)

Create a `.env.local` file in the `frontend` directory:

```bash
# frontend/.env.local
VITE_ROBOFLOW_API_KEY=your_actual_api_key_here
VITE_ROBOFLOW_MODEL_ID=your-workspace/your-project/version
```

#### Option B: Direct Configuration

Edit `frontend/src/config/roboflow.js`:

```javascript
export const ROBOFLOW_CONFIG = {
  apiKey: "your_actual_api_key_here",
  modelId: "your-workspace/your-project/version",
  // ... other settings
};
```

### 3. Get Your Roboflow Credentials

1. **Go to [Roboflow](https://app.roboflow.com)**
2. **Sign in** to your account
3. **Navigate to your project**
4. **Go to Settings → API**
5. **Copy your API key**
6. **Note your model ID** (format: `workspace/project/version`)

### 4. Test the Setup

```bash
# Start the development server
cd frontend
npm run dev
```

Open your browser to `http://localhost:5173` and:

1. **Click "Start Camera"**
2. **Allow camera access**
3. **Check browser console** for initialization logs
4. **Look for detection overlays** on the video

## 🎯 Expected Behavior

### ✅ Success Indicators

- **Model Status**: Shows "AI Model Live" in green
- **Camera**: Starts successfully with live video
- **Detections**: Bounding boxes appear on detected objects
- **Console**: Shows "✅ Roboflow model initialized successfully"
- **FPS Counter**: Shows real-time inference performance

### ❌ Common Issues

#### 1. "Model Not Ready" Status
- **Check API key** in configuration
- **Verify model ID** format
- **Check browser console** for errors

#### 2. Camera Access Denied
- **Allow camera permissions** in browser
- **Check camera availability**
- **Try different browser**

#### 3. No Detections Appearing
- **Verify model is trained** for your use case
- **Check confidence threshold** (try lowering to 0.3)
- **Ensure good lighting** and clear view

#### 4. Slow Performance
- **Reduce frame rate** in config
- **Lower resolution** in camera settings
- **Close other browser tabs**

## ⚙️ Configuration Options

### Performance Tuning

```javascript
// frontend/src/config/roboflow.js
export const ROBOFLOW_CONFIG = {
  confidence: 0.3,        // Lower = more detections
  threshold: 0.5,         // IoU threshold
  maxDetections: 5,       // Reduce for performance
  targetFPS: 15,          // Lower FPS for better performance
  frameSkip: 2,           // Process every 2nd frame
};
```

### Detection Classes

Update the classes in `roboflow.js` to match your model:

```javascript
classes: {
  'YourClass1': { color: '#FF0000', label: 'Your Label 1' },
  'YourClass2': { color: '#00FF00', label: 'Your Label 2' },
  // ... add more classes
}
```

## 🔍 Debugging

### Browser Console Logs

Look for these messages:

```
🤖 Initializing Roboflow model...
📋 Model: your-workspace/your-project/1
🔑 API Key: abc12345...
✅ Roboflow model initialized successfully
🚀 Started real-time inference loop
```

### Performance Monitoring

The system tracks:
- **FPS**: Frames per second
- **Processing Time**: Per-frame inference time
- **Detection Count**: Number of objects detected

### Common Error Messages

| Error | Solution |
|-------|----------|
| `Failed to initialize model: Invalid API key` | Check your API key |
| `Model not found` | Verify model ID format |
| `Camera access denied` | Allow camera permissions |
| `WebGL not supported` | Use a modern browser |

## 🚀 Production Deployment

### Build for Production

```bash
cd frontend
npm run build
npm run preview
```

### Environment Variables

For production, set these environment variables:

```bash
VITE_ROBOFLOW_API_KEY=your_production_api_key
VITE_ROBOFLOW_MODEL_ID=your_production_model_id
```

### Performance Optimization

1. **Enable compression** in your web server
2. **Use CDN** for static assets
3. **Optimize images** and reduce bundle size
4. **Monitor performance** with browser dev tools

## 📚 Additional Resources

- [Roboflow Documentation](https://docs.roboflow.com/)
- [Inference.js GitHub](https://github.com/roboflow/inference)
- [WebGL Support Check](https://webglreport.com/)
- [Browser Compatibility](https://caniuse.com/webgl)

## 🆘 Support

If you encounter issues:

1. **Check browser console** for error messages
2. **Verify API credentials** are correct
3. **Test with a simple model** first
4. **Check network connectivity**
5. **Try different browser** or device

---

**🎉 You're all set! Your React app now runs Roboflow inference entirely in the browser!**
