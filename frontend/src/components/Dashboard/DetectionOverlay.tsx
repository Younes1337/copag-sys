import React, { useEffect, useRef, useCallback } from 'react';

interface Detection {
  id: string;
  class: string;
  confidence: number;
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  timestamp: number;
}

interface DetectionOverlayProps {
  detections: Detection[];
  videoElement: HTMLVideoElement | null;
  getClassConfig: (className: string) => { color: string; label: string };
  isActive: boolean;
}

/**
 * Canvas overlay component for drawing detection bounding boxes
 * Renders on top of video element with real-time detection visualization
 */
export const DetectionOverlay: React.FC<DetectionOverlayProps> = ({
  detections,
  videoElement,
  getClassConfig,
  isActive
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  /**
   * Draw bounding boxes and labels on canvas
   */
  const drawDetections = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !videoElement || !isActive) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set canvas size to match video
    const videoRect = videoElement.getBoundingClientRect();
    canvas.width = videoRect.width;
    canvas.height = videoRect.height;

    // Draw each detection
    detections.forEach((detection) => {
      const { bbox, class: className, confidence } = detection;
      const classConfig = getClassConfig(className);
      
      // Calculate scaled coordinates
      const scaleX = canvas.width / videoElement.videoWidth;
      const scaleY = canvas.height / videoElement.videoHeight;
      
      const x = bbox.x * scaleX;
      const y = bbox.y * scaleY;
      const width = bbox.width * scaleX;
      const height = bbox.height * scaleY;

      // Draw bounding box
      ctx.strokeStyle = classConfig.color;
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, width, height);

      // Draw background for label
      const labelText = `${classConfig.label} (${(confidence * 100).toFixed(1)}%)`;
      const labelMetrics = ctx.measureText(labelText);
      const labelHeight = 20;
      const labelPadding = 8;
      
      ctx.fillStyle = classConfig.color;
      ctx.fillRect(
        x, 
        y - labelHeight - labelPadding, 
        labelMetrics.width + labelPadding * 2, 
        labelHeight + labelPadding
      );

      // Draw label text
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(labelText, x + labelPadding, y - labelHeight);

      // Draw confidence bar
      const barWidth = width;
      const barHeight = 4;
      const confidenceWidth = (confidence * barWidth);
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(x, y + height, barWidth, barHeight);
      
      ctx.fillStyle = classConfig.color;
      ctx.fillRect(x, y + height, confidenceWidth, barHeight);
    });
  }, [detections, videoElement, getClassConfig, isActive]);

  /**
   * Animation loop for smooth rendering
   */
  const animate = useCallback(() => {
    drawDetections();
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [drawDetections]);

  /**
   * Start/stop animation based on active state
   */
  useEffect(() => {
    if (isActive && detections.length > 0) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      animationFrameRef.current = requestAnimationFrame(animate);
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      // Clear canvas when not active
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isActive, detections.length, animate]);

  /**
   * Handle video resize
   */
  useEffect(() => {
    const handleResize = () => {
      if (videoElement && canvasRef.current) {
        const videoRect = videoElement.getBoundingClientRect();
        const canvas = canvasRef.current;
        canvas.width = videoRect.width;
        canvas.height = videoRect.height;
        drawDetections();
      }
    };

    if (videoElement) {
      videoElement.addEventListener('resize', handleResize);
      window.addEventListener('resize', handleResize);
      
      return () => {
        videoElement.removeEventListener('resize', handleResize);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [videoElement, drawDetections]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-10"
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover'
      }}
    />
  );
};
