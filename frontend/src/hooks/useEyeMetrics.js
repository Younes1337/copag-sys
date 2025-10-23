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

  const faceMeshRef = useRef(null);
  const lastEarRef = useRef(0);
  const blinkHistoryRef = useRef([]);
  const frameCountRef = useRef(0);
  const startTimeRef = useRef(Date.now());
  const processingIntervalRef = useRef(null);

  // EAR threshold for blink detection
  const EAR_THRESHOLD = 0.25;
  const BLINK_FRAME_THRESHOLD = 3; // Minimum frames for a blink
  const BLINK_FREQUENCY_WINDOW = 60000; // 1 minute window

  /**
   * Calculate Eye Aspect Ratio (EAR) from face landmarks
   */
  const calculateEAR = useCallback((landmarks) => {
    if (!landmarks || landmarks.length < 468) return 0;

    // Left eye landmarks (MediaPipe face mesh indices)
    const leftEye = [
      landmarks[33], landmarks[7], landmarks[163], landmarks[144],
      landmarks[145], landmarks[153], landmarks[154], landmarks[155],
      landmarks[133], landmarks[173], landmarks[157], landmarks[158],
      landmarks[159], landmarks[160], landmarks[161], landmarks[246]
    ];

    // Right eye landmarks
    const rightEye = [
      landmarks[362], landmarks[382], landmarks[381], landmarks[380],
      landmarks[374], landmarks[373], landmarks[390], landmarks[249],
      landmarks[263], landmarks[466], landmarks[388], landmarks[387],
      landmarks[386], landmarks[385], landmarks[384], landmarks[398]
    ];

    // Calculate EAR for both eyes
    const leftEAR = calculateEyeAspectRatio(leftEye);
    const rightEAR = calculateEyeAspectRatio(rightEye);

    // Return average EAR
    return (leftEAR + rightEAR) / 2;
  }, []);

  /**
   * Calculate EAR for a single eye
   */
  const calculateEyeAspectRatio = useCallback((eyeLandmarks) => {
    if (eyeLandmarks.length < 6) return 0;

    // Vertical distances
    const vertical1 = Math.sqrt(
      Math.pow(eyeLandmarks[1].x - eyeLandmarks[5].x, 2) +
      Math.pow(eyeLandmarks[1].y - eyeLandmarks[5].y, 2)
    );
    const vertical2 = Math.sqrt(
      Math.pow(eyeLandmarks[2].x - eyeLandmarks[4].x, 2) +
      Math.pow(eyeLandmarks[2].y - eyeLandmarks[4].y, 2)
    );

    // Horizontal distance
    const horizontal = Math.sqrt(
      Math.pow(eyeLandmarks[0].x - eyeLandmarks[3].x, 2) +
      Math.pow(eyeLandmarks[0].y - eyeLandmarks[3].y, 2)
    );

    // EAR formula
    const ear = (vertical1 + vertical2) / (2.0 * horizontal);
    return ear;
  }, []);

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
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
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
      
      console.log('✅ Face Mesh initialized successfully');
    } catch (err) {
      console.error('❌ Failed to initialize Face Mesh:', err);
      setError(`Failed to initialize Face Mesh: ${err.message}`);
    }
  }, [calculateEAR]);

  /**
   * Detect blinks based on EAR threshold
   */
  const detectBlink = useCallback((currentEAR) => {
    const wasBlinking = lastEarRef.current < EAR_THRESHOLD;
    const isBlinking = currentEAR < EAR_THRESHOLD;

    if (isBlinking && !wasBlinking) {
      // Start of blink
      blinkHistoryRef.current.push(Date.now());
    }

    lastEarRef.current = currentEAR;
  }, []);

  /**
   * Update blink frequency
   */
  const updateBlinkFrequency = useCallback(() => {
    const now = Date.now();
    const oneMinuteAgo = now - BLINK_FREQUENCY_WINDOW;
    
    // Filter blinks from last minute
    const recentBlinks = blinkHistoryRef.current.filter(time => time > oneMinuteAgo);
    blinkHistoryRef.current = recentBlinks;
    
    // Calculate frequency (blinks per minute)
    const frequency = (recentBlinks.length / BLINK_FREQUENCY_WINDOW) * 60000;
    setBlinkFrequency(Math.round(frequency * 10) / 10); // Round to 1 decimal
    
    // Update total blink count
    setBlinkCount(blinkHistoryRef.current.length);
  }, []);

  /**
   * Process video frame for eye metrics
   */
  const processFrame = useCallback(async (videoElement) => {
    if (!faceMeshRef.current || !videoElement) return;

    try {
      // Create a canvas to capture the current frame
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = videoElement.videoWidth || videoElement.clientWidth;
      canvas.height = videoElement.videoHeight || videoElement.clientHeight;
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      
      // Send the canvas to MediaPipe
      await faceMeshRef.current.send({ image: canvas });
      frameCountRef.current++;
    } catch (err) {
      console.error('❌ Error processing frame:', err);
    }
  }, []);

  /**
   * Start eye metrics calculation
   */
  const startMetrics = useCallback((videoElement) => {
    if (!isInitialized || !videoElement) return;

    console.log('🚀 Started real-time eye metrics calculation');
    startTimeRef.current = Date.now();
    
    // Start continuous frame processing
    processingIntervalRef.current = setInterval(() => {
      processFrame(videoElement);
    }, 100); // Process every 100ms
  }, [isInitialized, processFrame]);

  /**
   * Stop eye metrics calculation
   */
  const stopMetrics = useCallback(() => {
    console.log('🛑 Stopped eye metrics calculation');
    
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
      error
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
