import { useState, useEffect, useCallback, useRef } from 'react';

interface PerformanceMetrics {
  fps: number;
  processingTime: number;
  memoryUsage: number;
  frameSkip: number;
  slowFrames: number;
  totalFrames: number;
}

interface PerformanceOptimizationOptions {
  targetFPS?: number;
  maxProcessingTime?: number;
  adaptiveFrameSkip?: boolean;
  memoryThreshold?: number;
}

export const usePerformanceOptimization = (options: PerformanceOptimizationOptions = {}) => {
  const {
    targetFPS = 10,
    maxProcessingTime = 100,
    adaptiveFrameSkip = true,
    memoryThreshold = 50
  } = options;

  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 0,
    processingTime: 0,
    memoryUsage: 0,
    frameSkip: 1,
    slowFrames: 0,
    totalFrames: 0
  });

  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(Date.now());
  const processingTimesRef = useRef<number[]>([]);
  const frameSkipRef = useRef(1);
  const performanceObserverRef = useRef<PerformanceObserver | null>(null);

  // Calculate FPS
  const updateFPS = useCallback(() => {
    const now = Date.now();
    const deltaTime = now - lastTimeRef.current;
    
    if (deltaTime >= 1000) {
      const fps = Math.round((frameCountRef.current * 1000) / deltaTime);
      setMetrics(prev => ({ ...prev, fps }));
      
      frameCountRef.current = 0;
      lastTimeRef.current = now;
    }
  }, []);

  // Track processing time
  const trackProcessingTime = useCallback((startTime: number) => {
    const processingTime = performance.now() - startTime;
    
    // Update processing times array
    processingTimesRef.current.push(processingTime);
    if (processingTimesRef.current.length > 10) {
      processingTimesRef.current.shift();
    }

    // Calculate average processing time
    const avgProcessingTime = processingTimesRef.current.reduce((sum, time) => sum + time, 0) / processingTimesRef.current.length;
    
    setMetrics(prev => ({
      ...prev,
      processingTime: Math.round(avgProcessingTime * 100) / 100
    }));

    // Adaptive frame skipping
    if (adaptiveFrameSkip) {
      if (processingTime > maxProcessingTime) {
        frameSkipRef.current = Math.min(frameSkipRef.current + 1, 5);
        setMetrics(prev => ({ ...prev, frameSkip: frameSkipRef.current }));
      } else if (processingTime < maxProcessingTime / 2 && frameSkipRef.current > 1) {
        frameSkipRef.current = Math.max(frameSkipRef.current - 1, 1);
        setMetrics(prev => ({ ...prev, frameSkip: frameSkipRef.current }));
      }
    }

    // Track slow frames
    if (processingTime > maxProcessingTime) {
      setMetrics(prev => ({
        ...prev,
        slowFrames: prev.slowFrames + 1
      }));
    }

    frameCountRef.current++;
    setMetrics(prev => ({ ...prev, totalFrames: prev.totalFrames + 1 }));
  }, [maxProcessingTime, adaptiveFrameSkip]);

  // Monitor memory usage
  const updateMemoryUsage = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
      setMetrics(prev => ({ ...prev, memoryUsage: usedMB }));
    }
  }, []);

  // Performance optimization wrapper
  const withPerformanceTracking = useCallback(<T extends any[], R>(
    fn: (...args: T) => R
  ) => {
    return (...args: T): R => {
      const startTime = performance.now();
      const result = fn(...args);
      trackProcessingTime(startTime);
      return result;
    };
  }, [trackProcessingTime]);

  // Should process frame based on performance
  const shouldProcessFrame = useCallback(() => {
    return frameCountRef.current % frameSkipRef.current === 0;
  }, []);

  // Get performance recommendations
  const getPerformanceRecommendations = useCallback(() => {
    const recommendations: string[] = [];
    
    if (metrics.fps < targetFPS * 0.8) {
      recommendations.push('Consider reducing processing frequency or frame resolution');
    }
    
    if (metrics.processingTime > maxProcessingTime) {
      recommendations.push('Processing time is high - consider optimizing calculations');
    }
    
    if (metrics.memoryUsage > memoryThreshold) {
      recommendations.push('Memory usage is high - consider clearing data buffers');
    }
    
    if (metrics.slowFrames / metrics.totalFrames > 0.2) {
      recommendations.push('High percentage of slow frames - consider adaptive frame skipping');
    }
    
    return recommendations;
  }, [metrics, targetFPS, maxProcessingTime, memoryThreshold]);

  // Reset performance metrics
  const resetMetrics = useCallback(() => {
    setMetrics({
      fps: 0,
      processingTime: 0,
      memoryUsage: 0,
      frameSkip: 1,
      slowFrames: 0,
      totalFrames: 0
    });
    frameCountRef.current = 0;
    lastTimeRef.current = Date.now();
    processingTimesRef.current = [];
    frameSkipRef.current = 1;
  }, []);

  // Performance monitoring effect
  useEffect(() => {
    const interval = setInterval(() => {
      updateFPS();
      updateMemoryUsage();
    }, 1000);

    return () => clearInterval(interval);
  }, [updateFPS, updateMemoryUsage]);

  // Performance observer for detailed metrics
  useEffect(() => {
    if (typeof PerformanceObserver !== 'undefined') {
      try {
        performanceObserverRef.current = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.entryType === 'measure') {
              console.log(`Performance measure: ${entry.name} - ${entry.duration}ms`);
            }
          });
        });
        
        performanceObserverRef.current.observe({ entryTypes: ['measure'] });
      } catch (error) {
        console.warn('PerformanceObserver not supported:', error);
      }
    }

    return () => {
      if (performanceObserverRef.current) {
        performanceObserverRef.current.disconnect();
      }
    };
  }, []);

  return {
    metrics,
    withPerformanceTracking,
    shouldProcessFrame,
    getPerformanceRecommendations,
    resetMetrics,
    frameSkip: frameSkipRef.current
  };
};
