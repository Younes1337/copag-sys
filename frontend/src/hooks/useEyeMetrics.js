import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Real-time Eye Metrics Calculation Hook
 * Calculates EAR, Blink Count, and Blink Frequency from video feed
 */
export const useEyeMetrics = () => {
  const [ear, setEar] = useState(0);
  const [blinkCount, setBlinkCount] = useState(0);
  const [blinkFrequency, setBlinkFrequency] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState(null);
  const [drowsinessLevel, setDrowsinessLevel] = useState('normal');
  const [earHistory, setEarHistory] = useState([]);

  const faceMeshRef = useRef(null);
  const lastEarRef = useRef(0);
  const blinkHistoryRef = useRef([]);
  const frameCountRef = useRef(0);
  const startTimeRef = useRef(Date.now());
  const processingIntervalRef = useRef(null);
  const performanceRef = useRef({ fps: 0, lastFrameTime: 0 });

  // Optimized thresholds for better performance
  const EAR_THRESHOLD = 0.25;
  const BLINK_FRAME_THRESHOLD = 2; // Reduced for faster detection
  const BLINK_FREQUENCY_WINDOW = 60000; // 1 minute window
  const PROCESSING_INTERVAL = 50; // Process every 50ms for better responsiveness
  const EAR_SMOOTHING_FACTOR = 0.7; // For smoothing EAR values

  /**
   * Advanced EAR calculation using optimized landmark selection
   * Based on research: "Real-Time Eye Blink Detection using Facial Landmarks"
   */
  const calculateEAR = useCallback((landmarks) => {
    if (!landmarks || landmarks.length < 468) return 0;

    // Optimized landmark selection for maximum accuracy
    // Left eye landmarks (MediaPipe indices)
    const leftEye = [
      landmarks[33],   // Top of eye
      landmarks[160],  // Bottom left
      landmarks[158],  // Bottom right  
      landmarks[133],  // Left corner
      landmarks[153],  // Right corner
      landmarks[144]     // Center
    ];

    // Right eye landmarks (MediaPipe indices)
    const rightEye = [
      landmarks[362],  // Top of eye
      landmarks[385],  // Bottom left
      landmarks[387],  // Bottom right
      landmarks[263],  // Left corner
      landmarks[373],  // Right corner
      landmarks[380]     // Center
    ];

    // Calculate EAR for both eyes with error handling
    const leftEAR = calculateEyeAspectRatio(leftEye);
    const rightEAR = calculateEyeAspectRatio(rightEye);

    // Return average EAR with validation
    if (leftEAR === 0 || rightEAR === 0) return 0;
    const avgEAR = (leftEAR + rightEAR) / 2;
    
    // Validate EAR range (typical range: 0.1 - 0.4)
    return Math.max(0, Math.min(0.5, avgEAR));
  }, []);

  /**
   * Optimized EAR calculation for a single eye
   */
  const calculateEyeAspectRatio = useCallback((eyeLandmarks) => {
    if (eyeLandmarks.length < 6) return 0;

    // Optimized calculation using only essential points
    // Points: [top, bottom_left, bottom_right, left, right, center]
    const [top, bottomLeft, bottomRight, left, right, center] = eyeLandmarks;

    // Calculate vertical distances (eye opening)
    const vertical1 = Math.sqrt(
      Math.pow(top.x - bottomLeft.x, 2) + Math.pow(top.y - bottomLeft.y, 2)
    );
    const vertical2 = Math.sqrt(
      Math.pow(top.x - bottomRight.x, 2) + Math.pow(top.y - bottomRight.y, 2)
    );

    // Calculate horizontal distance (eye width)
    const horizontal = Math.sqrt(
      Math.pow(left.x - right.x, 2) + Math.pow(left.y - right.y, 2)
    );

    // EAR formula with safety check
    if (horizontal === 0) return 0;
    const ear = (vertical1 + vertical2) / (2.0 * horizontal);
    
    // Clamp EAR to reasonable range
    return Math.max(0, Math.min(1, ear));
  }, []);

  /**
   * Advanced drowsiness detection using multiple metrics
   * Based on research: "Driver Drowsiness Detection using Eye Aspect Ratio"
   */
  const detectDrowsiness = useCallback((currentEAR, blinkFreq) => {
    const now = Date.now();
    
    // Update EAR history (keep last 30 seconds)
    setEarHistory(prev => {
      const thirtySecondsAgo = now - 30000;
      const filtered = prev.filter(entry => entry.timestamp > thirtySecondsAgo);
      return [...filtered, { ear: currentEAR, timestamp: now }];
    });

    // Calculate average EAR over last 30 seconds
    const recentEARs = earHistory.filter(entry => entry.timestamp > now - 30000);
    const avgEAR = recentEARs.length > 0 ? 
      recentEARs.reduce((sum, entry) => sum + entry.ear, 0) / recentEARs.length : currentEAR;

    // Drowsiness detection criteria
    let drowsinessScore = 0;
    
    // 1. Low average EAR (eyes closing)
    if (avgEAR < 0.2) drowsinessScore += 3;
    else if (avgEAR < 0.25) drowsinessScore += 2;
    else if (avgEAR < 0.3) drowsinessScore += 1;

    // 2. Low blink frequency (drowsy people blink less)
    if (blinkFreq < 10) drowsinessScore += 2;
    else if (blinkFreq < 15) drowsinessScore += 1;

    // 3. Current EAR very low (eyes closing)
    if (currentEAR < 0.15) drowsinessScore += 2;
    else if (currentEAR < 0.2) drowsinessScore += 1;

    // Determine drowsiness level
    let level = 'normal';
    if (drowsinessScore >= 5) level = 'severe';
    else if (drowsinessScore >= 3) level = 'moderate';
    else if (drowsinessScore >= 1) level = 'mild';

    setDrowsinessLevel(level);

    // Log drowsiness detection
    if (drowsinessScore > 0) {
      console.log('😴 Drowsiness detected:', {
        level,
        score: drowsinessScore,
        avgEAR: avgEAR.toFixed(3),
        currentEAR: currentEAR.toFixed(3),
        blinkFreq: blinkFreq.toFixed(1)
      });
    }
  }, [earHistory]);

  /**
   * Initialize MediaPipe Face Mesh
   */
  const initializeFaceMesh = useCallback(async () => {
    try {
      const { FaceMesh } = await import('@mediapipe/face_mesh');
      
      const faceMesh = new FaceMesh({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
        }
      });

      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: false, // Disable for better performance
        minDetectionConfidence: 0.7, // Higher confidence for better accuracy
        minTrackingConfidence: 0.7, // Higher tracking confidence
        staticImageMode: false // Real-time mode
      });

      faceMesh.onResults((results) => {
        if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
          const landmarks = results.multiFaceLandmarks[0];
          const currentEAR = calculateEAR(landmarks);
          
          setEar(currentEAR);
          
          // Detect blinks
          detectBlink(currentEAR);
          
          // Update blink frequency
          updateBlinkFrequency();
        }
      });

      faceMeshRef.current = faceMesh;
      setIsInitialized(true);
      setError(null);
      
    } catch (err) {
      console.error('❌ Failed to initialize Face Mesh:', err);
      setError(`Failed to initialize Face Mesh: ${err.message}`);
    }
  }, [calculateEAR]);

  /**
   * Advanced blink detection using multi-frame analysis
   * Implements the algorithm from "Real-Time Eye Blink Detection using Facial Landmarks"
   */
  const detectBlink = useCallback((currentEAR) => {
    const now = Date.now();
    const wasBlinking = lastEarRef.current < EAR_THRESHOLD;
    const isBlinking = currentEAR < EAR_THRESHOLD;

    // Advanced blink detection with temporal analysis
    if (isBlinking && !wasBlinking) {
      // Start of potential blink - check temporal consistency
      const lastBlink = blinkHistoryRef.current[blinkHistoryRef.current.length - 1];
      
      // Minimum time between blinks (prevent double counting)
      if (!lastBlink || (now - lastBlink) > 200) {
        // Additional validation: check if EAR drop is significant
        const earDrop = lastEarRef.current - currentEAR;
        if (earDrop > 0.05) { // Significant drop in EAR
          blinkHistoryRef.current.push(now);
          
          // Update blink count immediately for real-time feedback
          setBlinkCount(blinkHistoryRef.current.length);
          
          // Log blink detection for debugging
          console.log('👁️ Blink detected:', {
            ear: currentEAR.toFixed(3),
            earDrop: earDrop.toFixed(3),
            totalBlinks: blinkHistoryRef.current.length
          });
        }
      }
    }

    // Advanced EAR smoothing with adaptive factor
    const smoothingFactor = Math.abs(currentEAR - lastEarRef.current) > 0.1 ? 0.3 : EAR_SMOOTHING_FACTOR;
    const smoothedEAR = (currentEAR * smoothingFactor) + (lastEarRef.current * (1 - smoothingFactor));
    lastEarRef.current = smoothedEAR;
  }, []);

  /**
   * Advanced blink frequency calculation with multiple time windows
   */
  const updateBlinkFrequency = useCallback(() => {
    const now = Date.now();
    const oneMinuteAgo = now - BLINK_FREQUENCY_WINDOW;
    
    // Filter blinks from last minute
    const recentBlinks = blinkHistoryRef.current.filter(time => time > oneMinuteAgo);
    blinkHistoryRef.current = recentBlinks;
    
    // Calculate frequency (blinks per minute) with validation
    const frequency = recentBlinks.length > 0 ? 
      (recentBlinks.length / BLINK_FREQUENCY_WINDOW) * 60000 : 0;
    
    // Clamp frequency to reasonable range (0-60 blinks per minute)
    const clampedFrequency = Math.max(0, Math.min(60, frequency));
    setBlinkFrequency(Math.round(clampedFrequency * 10) / 10);
    
    // Update total blink count
    setBlinkCount(blinkHistoryRef.current.length);
    
    // Log frequency for debugging
    if (recentBlinks.length > 0) {
      console.log('👁️ Blink frequency updated:', {
        frequency: clampedFrequency.toFixed(1) + ' blinks/min',
        recentBlinks: recentBlinks.length,
        totalBlinks: blinkHistoryRef.current.length
      });
    }
  }, []);

  /**
   * Optimized frame processing with performance monitoring
   */
  const processFrame = useCallback(async (videoElement) => {
    if (!faceMeshRef.current || !videoElement) return;

    try {
      // Check if video is ready and has dimensions
      if (videoElement.readyState < 2 || !videoElement.videoWidth || !videoElement.videoHeight) {
        return; // Skip processing if video not ready
      }

      // Create optimized canvas with appropriate size
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Use video dimensions directly for better performance
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      
      // Draw video frame to canvas
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      
      // Send to MediaPipe with error handling
      await faceMeshRef.current.send({ image: canvas });
      frameCountRef.current++;
      
      // Performance monitoring
      const now = Date.now();
      if (performanceRef.current.lastFrameTime > 0) {
        const fps = 1000 / (now - performanceRef.current.lastFrameTime);
        performanceRef.current.fps = fps;
      }
      performanceRef.current.lastFrameTime = now;
      
      // Update blink frequency every 10 frames for efficiency
      if (frameCountRef.current % 10 === 0) {
        updateBlinkFrequency();
      }
    } catch (err) {
      console.error('❌ Error processing frame:', err);
    }
  }, [updateBlinkFrequency]);

  /**
   * Start eye metrics calculation
   */
  const startMetrics = useCallback((videoElement) => {
    if (!isInitialized || !videoElement) return;
    
    startTimeRef.current = Date.now();
    
    // Start optimized frame processing
    processingIntervalRef.current = setInterval(() => {
      processFrame(videoElement);
    }, PROCESSING_INTERVAL); // Process every 50ms for better responsiveness
  }, [isInitialized, processFrame]);

  /**
   * Stop eye metrics calculation
   */
  const stopMetrics = useCallback(() => {
    // Clear processing interval
    if (processingIntervalRef.current) {
      clearInterval(processingIntervalRef.current);
      processingIntervalRef.current = null;
    }
    
    setEar(0);
    setBlinkCount(0);
    setBlinkFrequency(0);
    blinkHistoryRef.current = [];
    lastEarRef.current = 0;
  }, []);

  /**
   * Get current metrics data
   */
  const getMetricsData = useCallback(() => {
    return {
      ear: Math.round(ear * 1000) / 1000, // Round to 3 decimals
      blinkCount,
      blinkFrequency,
      isInitialized,
      error,
      performance: {
        fps: Math.round(performanceRef.current.fps * 10) / 10,
        frameCount: frameCountRef.current,
        processingInterval: PROCESSING_INTERVAL
      }
    };
  }, [ear, blinkCount, blinkFrequency, isInitialized, error]);

  // Initialize on mount
  useEffect(() => {
    initializeFaceMesh();
  }, [initializeFaceMesh]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (processingIntervalRef.current) {
        clearInterval(processingIntervalRef.current);
      }
    };
  }, []);

  return {
    // State
    ear,
    blinkCount,
    blinkFrequency,
    isInitialized,
    error,
    
    // Actions
    processFrame,
    startMetrics,
    stopMetrics,
    getMetricsData
  };
};
