// Roboflow Configuration
// Replace these values with your actual Roboflow credentials

export const ROBOFLOW_CONFIG = {
  // Your Roboflow API Key
  // Get it from: https://app.roboflow.com/settings/api
  apiKey: "rf_A8lxJGzACYNWfWgiWLj7BVw3zZU2",
  
  // Your Model ID and Version
  // Format: "workspace/project/version"
  // Example: "my-workspace/driver-behavior/1"
  modelId: "driver-behaviour-ge5cr",
  
  // Model Configuration
  confidence: 0.5,        // Minimum confidence threshold (0-1)
  threshold: 0.5,          // IoU threshold for NMS (0-1)
  maxDetections: 10,      // Maximum number of detections per frame
  
  // Performance Settings
  targetFPS: 30,          // Target frames per second
  frameSkip: 1,           // Process every Nth frame (1 = every frame)
  
  // Detection Classes - Updated to match actual model classes
  classes: {
    'DangerousDriving': { color: '#FF0000', label: 'Dangerous Driving', icon: 'AlertTriangle' },
    'Distracted': { color: '#FFA500', label: 'Distracted', icon: 'Eye' },
    'Drinking': { color: '#8B4513', label: 'Drinking', icon: 'Coffee' },
    'SafeDriving': { color: '#00FF00', label: 'Safe Driving', icon: 'Shield' },
    'Yawn': { color: '#FF69B4', label: 'Yawning', icon: 'Zap' }
  }
};

// Environment-specific configuration
export const getRoboflowConfig = () => {
  // Check for environment variables first
  const apiKey = import.meta.env.VITE_ROBOFLOW_API_KEY || ROBOFLOW_CONFIG.apiKey;
  const modelId = import.meta.env.VITE_ROBOFLOW_MODEL_ID || ROBOFLOW_CONFIG.modelId;
  
  return {
    ...ROBOFLOW_CONFIG,
    apiKey,
    modelId
  };
};

// Validation function
export const validateConfig = (config) => {
  const errors = [];
  
  if (!config.apiKey || config.apiKey === "YOUR_ROBOFLOW_API_KEY_HERE") {
    errors.push("Please set your Roboflow API key in the configuration");
  }
  
  if (!config.modelId || config.modelId === "YOUR_ROBOFLOW_MODEL_ID_HERE") {
    errors.push("Please set your Roboflow model ID in the configuration");
  }
  
  if (config.confidence < 0 || config.confidence > 1) {
    errors.push("Confidence must be between 0 and 1");
  }
  
  if (config.threshold < 0 || config.threshold > 1) {
    errors.push("Threshold must be between 0 and 1");
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};
