import { useState, useEffect, useRef, useCallback } from 'react';
import { getRoboflowConfig, validateConfig } from '@/config/roboflow';

// Get configuration
const ROBOFLOW_CONFIG = getRoboflowConfig();
const DETECTION_CLASSES = ROBOFLOW_CONFIG.classes;

/**
 * Custom hook for Roboflow Inference.js integration
 * Handles model initialization, real-time inference, and detection processing
 */
export const useInference = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [detections, setDetections] = useState([]);
  const [detectionCounts, setDetectionCounts] = useState({});
  const [fps, setFps] = useState(0);
  
  const modelRef = useRef(null);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(Date.now());
  const animationFrameRef = useRef(null);
  const isProcessingRef = useRef(false);
  const frameSkipRef = useRef(0);
  const targetFPS = 3; // Aggressively reduced to 3 FPS for much better performance
  const maxFrameSkipRef = useRef(8); // Process every 8th frame maximum
  const performanceRef = useRef({ slowFrames: 0, totalFrames: 0 });
  
  // Frame-based prediction system
  const frameHistoryRef = useRef([]);
  const predictionFrames = 9; // Analyze last 9 frames for prediction
  const confidenceThreshold = 0.3; // Lowered confidence threshold for more detections

  /**
   * Analyze frame history to determine stable predictions
   */
  const analyzeFrameHistory = useCallback((frameHistory) => {
    if (frameHistory.length < 3) {
      // Not enough frames for prediction, return current detections
      return frameHistory[frameHistory.length - 1]?.detections || [];
    }

    // Count occurrences of each class across frames
    const classCounts = {};
    const classConfidences = {};
    
    frameHistory.forEach(frame => {
      frame.detections.forEach(detection => {
        const className = detection.class;
        classCounts[className] = (classCounts[className] || 0) + 1;
        
        if (!classConfidences[className]) {
          classConfidences[className] = [];
        }
        classConfidences[className].push(detection.confidence);
      });
    });

    // Calculate average confidence for each class
    const classAvgConfidence = {};
    Object.keys(classConfidences).forEach(className => {
      const confidences = classConfidences[className];
      classAvgConfidence[className] = confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length;
    });

    // Find classes that appear in at least 30% of frames with good confidence (lowered threshold)
    const stableClasses = Object.keys(classCounts).filter(className => {
      const frequency = classCounts[className] / frameHistory.length;
      const avgConfidence = classAvgConfidence[className];
      return frequency >= 0.3 && avgConfidence >= confidenceThreshold;
    });

    // Create stable predictions
    const stablePredictions = stableClasses.map(className => ({
      id: `stable_${className}_${Date.now()}`,
      class: className,
      confidence: classAvgConfidence[className],
      bbox: { x: 0, y: 0, width: 0, height: 0 }, // Will be updated by latest detection
      timestamp: Date.now(),
      isStable: true
    }));

    // Update bbox with latest detection if available
    const latestFrame = frameHistory[frameHistory.length - 1];
    stablePredictions.forEach(prediction => {
      const latestDetection = latestFrame.detections.find(d => d.class === prediction.class);
      if (latestDetection) {
        prediction.bbox = latestDetection.bbox;
      }
    });

    return stablePredictions;
  }, [confidenceThreshold]);

  /**
   * Initialize the Roboflow model
   */
  const initializeModel = useCallback(async () => {
    if (isInitialized || isLoading) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Validate configuration first
      const validation = validateConfig(ROBOFLOW_CONFIG);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }
      
      // Set TensorFlow.js backend to CPU to avoid WebGL issues
      const tf = await import('@tensorflow/tfjs');
      
      // Force CPU backend and disable WebGL with aggressive optimizations
      tf.env().set('WEBGL_VERSION', 0);
      tf.env().set('WEBGL_CPU_FORWARD', true);
      tf.env().set('WEBGL_PACK', false); // Disable packing for better performance
      tf.env().set('WEBGL_FORCE_F16_TEXTURES', false); // Use FP32 for better accuracy
      tf.env().set('WEBGL_DELETE_TEXTURE_THRESHOLD', 0);
      await tf.setBackend('cpu');
      await tf.ready();
      
      console.log('🔧 TensorFlow backend optimized for CPU performance');
      
      // Dynamic import to avoid SSR issues
      const inferenceModule = await import('inferencejs');
      
      console.log('🔍 Full inference module:', inferenceModule);
      console.log('🔍 Module keys:', Object.keys(inferenceModule));
      
      // Handle different export formats
      let Inference;
      if (inferenceModule.InferenceEngine) {
        Inference = inferenceModule.InferenceEngine;
        console.log('✅ Using InferenceEngine export');
      } else if (inferenceModule.default) {
        Inference = inferenceModule.default;
        console.log('✅ Using default export');
      } else if (inferenceModule.Inference) {
        Inference = inferenceModule.Inference;
        console.log('✅ Using Inference export');
      } else if (typeof inferenceModule === 'function') {
        Inference = inferenceModule;
        console.log('✅ Using function export');
      } else {
        console.error('❌ Available exports:', Object.keys(inferenceModule));
        throw new Error('Could not find Inference class in inferencejs module');
      }
      
      console.log('🔍 Inference class:', typeof Inference, Inference);
      
      console.log('🤖 Initializing Roboflow model...');
      console.log('📋 Model:', ROBOFLOW_CONFIG.modelId);
      console.log('🔑 API Key:', ROBOFLOW_CONFIG.apiKey.substring(0, 8) + '...');
      
      // Initialize the model
      const model = new Inference();
      
      // Start the worker with the model
      const workerId = await model.startWorker(
        ROBOFLOW_CONFIG.modelId,
        1, // version
        ROBOFLOW_CONFIG.apiKey
      );
      
      modelRef.current = { model, workerId };
      setIsInitialized(true);
      setIsLoading(false);
      
      console.log('✅ Roboflow model initialized successfully');
      
    } catch (err) {
      console.error('❌ Failed to initialize Roboflow model:', err);
      setError(`Failed to initialize model: ${err.message}`);
      setIsLoading(false);
    }
  }, [isInitialized, isLoading]);

  /**
   * Run inference on a video frame
   */
  const runInference = useCallback(async (videoElement) => {
    if (!modelRef.current || !videoElement || isProcessingRef.current) {
      return;
    }

    // Aggressive frame skipping for better performance
    frameSkipRef.current++;
    if (frameSkipRef.current % maxFrameSkipRef.current !== 0) { // Process every 8th frame
      return;
    }

    isProcessingRef.current = true;
    const startTime = performance.now();

    try {
      // Create CVImage directly from video element (simplest approach)
      const { CVImage } = await import('inferencejs');
      const cvImage = new CVImage(videoElement);
      
      // Run inference with CVImage
      const predictions = await modelRef.current.model.infer(
        modelRef.current.workerId,
        cvImage
      );
      
      // Process predictions
      const processedDetections = predictions.map(prediction => ({
        id: Math.random().toString(36).substr(2, 9),
        class: prediction.class,
        confidence: prediction.confidence,
        bbox: {
          x: prediction.x,
          y: prediction.y,
          width: prediction.width,
          height: prediction.height
        },
        timestamp: Date.now()
      }));

      // Add to frame history for prediction analysis
      frameHistoryRef.current.push({
        detections: processedDetections,
        timestamp: Date.now()
      });

      // Keep only last 9 frames
      if (frameHistoryRef.current.length > predictionFrames) {
        frameHistoryRef.current.shift();
      }

      // Analyze frame history for stable predictions
      const stablePredictions = analyzeFrameHistory(frameHistoryRef.current);
      
      // Update detections with stable predictions
      setDetections(stablePredictions);
      
      // Update detection counts (simple increment)
      setDetectionCounts(prevCounts => {
        const newCounts = { ...prevCounts };
        stablePredictions.forEach(detection => {
          const className = detection.class;
          newCounts[className] = (newCounts[className] || 0) + 1;
        });
        return newCounts;
      });
      
      // Calculate FPS
      frameCountRef.current++;
      const now = Date.now();
      if (now - lastTimeRef.current >= 1000) {
        setFps(Math.round((frameCountRef.current * 1000) / (now - lastTimeRef.current)));
        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }
      
      const endTime = performance.now();
      const processingTime = endTime - startTime;
      
      // Update performance tracking
      performanceRef.current.totalFrames++;
      if (processingTime > 150) {
        performanceRef.current.slowFrames++;
        console.warn(`⚠️ Slow inference: ${processingTime.toFixed(2)}ms`);
      }
      
      // Adaptive frame skipping based on performance
      if (processingTime > 200) {
        maxFrameSkipRef.current = Math.min(maxFrameSkipRef.current + 1, 15); // Increase skip if very slow
        console.log(`🔄 Adaptive frame skip increased to ${maxFrameSkipRef.current}`);
      } else if (processingTime < 50 && maxFrameSkipRef.current > 3) {
        maxFrameSkipRef.current = Math.max(maxFrameSkipRef.current - 1, 3); // Decrease skip if fast
        console.log(`🔄 Adaptive frame skip decreased to ${maxFrameSkipRef.current}`);
      }
      
    } catch (err) {
      console.error('❌ Inference error:', err);
    } finally {
      isProcessingRef.current = false;
    }
  }, []);

  /**
   * Start real-time inference loop
   */
  const startInference = useCallback((videoElement) => {
    if (!videoElement || !isInitialized) return;

    const inferenceLoop = () => {
      if (videoElement.readyState >= 2) { // HAVE_CURRENT_DATA
        runInference(videoElement);
      }
      animationFrameRef.current = requestAnimationFrame(inferenceLoop);
    };

    // Start the loop
    animationFrameRef.current = requestAnimationFrame(inferenceLoop);
    console.log('🚀 Started real-time inference loop');
  }, [isInitialized, runInference]);

  /**
   * Stop inference loop
   */
  const stopInference = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setDetections([]);
    setDetectionCounts({});
    console.log('🛑 Stopped inference loop');
  }, []);


  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      stopInference();
      if (modelRef.current) {
        modelRef.current.dispose?.();
      }
    };
  }, [stopInference]);

  /**
   * Get detection statistics
   */
  const getDetectionStats = useCallback(() => {
    const totalDetections = Object.values(detectionCounts).reduce((sum, count) => sum + count, 0);
    const mostCommonDetection = Object.entries(detectionCounts)
      .sort(([,a], [,b]) => b - a)[0];
    
    return {
      totalDetections,
      mostCommonDetection: mostCommonDetection ? {
        class: mostCommonDetection[0],
        count: mostCommonDetection[1]
      } : null,
      detectionCounts,
      fps
    };
  }, [detectionCounts, fps]);

  /**
   * Get class configuration for rendering
   */
  const getClassConfig = useCallback((className) => {
    return DETECTION_CLASSES[className] || { 
      color: '#808080', 
      label: className 
    };
  }, []);

  /**
   * Get performance statistics
   */
  const getPerformanceStats = useCallback(() => {
    const { slowFrames, totalFrames } = performanceRef.current;
    const slowFramePercentage = totalFrames > 0 ? (slowFrames / totalFrames * 100).toFixed(1) : 0;
    return {
      totalFrames,
      slowFrames,
      slowFramePercentage: `${slowFramePercentage}%`,
      currentFrameSkip: maxFrameSkipRef.current,
      targetFPS
    };
  }, [targetFPS]);

  return {
    // State
    isInitialized,
    isLoading,
    error,
    detections,
    detectionCounts,
    fps,
    
    // Actions
    initializeModel,
    startInference,
    stopInference,
    runInference,
    
    // Utilities
    getDetectionStats,
    getClassConfig,
    getPerformanceStats,
    
    // Configuration
    config: ROBOFLOW_CONFIG,
    classes: DETECTION_CLASSES
  };
};
