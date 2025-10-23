import React from 'react';
import { AlertTriangle, Eye, Activity, Zap, Brain, CheckCircle } from 'lucide-react';

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

interface DetectionStatusProps {
  detections: Detection[];
  getClassConfig: (className: string) => { color: string; label: string };
}

/**
 * Detection Status Component
 * Shows current detections as button-style indicators
 */
export const DetectionStatus: React.FC<DetectionStatusProps> = ({
  detections,
  getClassConfig
}) => {
  // Group detections by class
  const detectionGroups = detections.reduce((groups, detection) => {
    const className = detection.class;
    if (!groups[className]) {
      groups[className] = [];
    }
    groups[className].push(detection);
    return groups;
  }, {} as Record<string, Detection[]>);

  // Get unique detection classes
  const uniqueClasses = Object.keys(detectionGroups);

  // If no detections, show safe driving
  if (uniqueClasses.length === 0) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <span className="text-sm font-medium text-green-700">Safe Driving</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {uniqueClasses.map((className) => {
        const classConfig = getClassConfig(className);
        const classDetections = detectionGroups[className];
        const avgConfidence = classDetections.reduce((sum, det) => sum + det.confidence, 0) / classDetections.length;
        const confidencePercent = Math.round(avgConfidence * 100);

        return (
          <div
            key={className}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border"
            style={{
              backgroundColor: `${classConfig.color}15`,
              borderColor: classConfig.color,
              color: classConfig.color
            }}
          >
            <div 
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: classConfig.color }}
            />
            <span className="text-sm font-medium">
              {classConfig.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};
