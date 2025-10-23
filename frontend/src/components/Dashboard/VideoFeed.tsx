import { Video, Play, Brain } from "lucide-react";
import { motion } from "framer-motion";
import { CameraControls } from "./CameraControls";
import { useRef, useEffect, useState } from "react";
import { useInference } from "@/hooks/useInference";
import { DetectionOverlay } from "./DetectionOverlay";
import { DetectionStatus } from "./DetectionStatus";

interface VideoFeedProps {
  isActive: boolean;
  onStartCamera?: () => void;
  onStopCamera?: () => void;
  isConnected?: boolean;
  onVideoElement?: (videoElement: HTMLVideoElement | null) => void;
}

export const VideoFeed = ({ isActive, onStartCamera, onStopCamera, isConnected, onVideoElement }: VideoFeedProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // Initialize Inference.js hook
  const {
    isInitialized,
    isLoading,
    error,
    detections,
    detectionCounts,
    fps,
    initializeModel,
    startInference,
    stopInference,
    getDetectionStats,
    getClassConfig,
    getPerformanceStats
  } = useInference();

  // Initialize model on component mount
  useEffect(() => {
    if (!isInitialized && !isLoading) {
      initializeModel();
    }
  }, [isInitialized, isLoading, initializeModel]);

  // Pass video element to parent
  useEffect(() => {
    if (onVideoElement) {
      onVideoElement(videoRef.current);
    }
  }, [onVideoElement]);

  useEffect(() => {
    if (isActive && videoRef.current) {
      // Start camera when active
      navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 }, 
          height: { ideal: 720 },
          facingMode: 'user'
        } 
      }).then(stream => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().then(() => {
            // Start inference when video is ready
            if (isInitialized && videoRef.current) {
              startInference(videoRef.current);
            }
          });
        }
      }).catch(error => {
        console.error('Error accessing camera:', error);
        alert('Camera access denied. Please allow camera access and try again.');
      });
    } else if (!isActive && streamRef.current) {
      // Stop camera and inference when not active
      stopInference();
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  }, [isActive, isInitialized, startInference, stopInference]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopInference();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [stopInference]);
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card p-6 glow-primary"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Video className="w-5 h-5 text-primary" />
          Live Video Feed
        </h2>
        <div className="flex items-center gap-4">
          {/* AI Model Status Button */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
            isInitialized ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
          }`}>
            <div className={`w-2 h-2 rounded-full animate-pulse ${
              isInitialized ? 'bg-green-500' : 'bg-yellow-500'
            }`}></div>
            <Brain className={`w-4 h-4 ${
              isInitialized ? 'text-green-600' : 'text-yellow-600'
            }`} />
            <span className={`text-sm font-medium ${
              isInitialized ? 'text-green-700' : 'text-yellow-700'
            }`}>
              {isLoading ? 'Loading Model...' : 
               isInitialized ? 'AI Model Live (driver-behaviour-ge5cr/1)' : 
               'Model Not Ready'}
            </span>
          </div>
          
          {isActive && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-destructive animate-pulse-glow" />
              <span className="text-sm text-destructive font-medium">LIVE</span>
            </div>
          )}
          {onStartCamera && onStopCamera && (
            <CameraControls
              isActive={isActive}
              onStartCamera={onStartCamera}
              onStopCamera={onStopCamera}
              isConnected={isConnected}
            />
          )}
        </div>
      </div>

      <div className="relative aspect-video bg-secondary/50 rounded-lg overflow-hidden border border-primary/20">
        {isActive ? (
          <>
            {/* Live Video Feed */}
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              muted
              playsInline
            />
            
            {/* Detection Overlay Canvas */}
            <DetectionOverlay
              detections={detections}
              videoElement={videoRef.current}
              getClassConfig={getClassConfig}
              isActive={isActive && isInitialized}
            />
            
            {/* Debug Info */}
            {isActive && isInitialized && (
              <div className="absolute bottom-3 left-3 px-3 py-1 bg-blue-500/80 backdrop-blur-sm text-white text-xs rounded">
                Detections: {detections.length} | FPS: {fps}
              </div>
            )}
            
            {/* Camera Overlay Info */}
            <div className="absolute top-3 left-3 px-3 py-1 bg-black/50 backdrop-blur-sm text-white text-xs rounded">
              Camera 1 (Driver Face Cam) - Casablanca, Morocco
            </div>
            <div className="absolute top-3 right-3 px-3 py-1 bg-black/50 backdrop-blur-sm text-white text-xs rounded">
              {new Date().toLocaleDateString('en-GB')} {new Date().toLocaleTimeString()}
            </div>

            {/* AI Detection Status */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
              <div className="glass-card px-4 py-2">
                <span className="text-sm font-medium text-success">
                  ✓ AI Detection {isInitialized ? "Active" : "Inactive"} 
                  {isLoading && " (Loading...)"}
                </span>
              </div>
              {detections.length > 0 && (
                <div className="glass-card px-4 py-2">
                  <span className="text-sm font-medium text-blue-500">
                    Detections: {detections.length} | FPS: {fps}
                  </span>
                </div>
              )}
            </div>

            {/* Error Display */}
            {error && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="bg-red-500 text-white px-4 py-2 rounded-lg">
                  <p className="text-sm font-medium">Model Error:</p>
                  <p className="text-xs">{error}</p>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Play className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">Click Start Camera to begin monitoring</p>
              {!isInitialized && !isLoading && (
                <p className="text-muted-foreground text-sm mt-2">
                  {error ? `Error: ${error}` : 'Initializing AI model...'}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Detection Status */}
      {isActive && isInitialized && (
        <div className="mt-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Current Detections:</h3>
          <DetectionStatus
            detections={detections}
            getClassConfig={getClassConfig}
          />
        </div>
      )}
    </motion.div>
  );
};
