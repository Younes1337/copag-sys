import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, AlertTriangle, CheckCircle, Clock, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { useDetectionStorage } from '@/hooks/useDetectionStorage';

interface ConcentrationGaugeProps {
  detectionCounts: Record<string, number>;
  totalDetections: number;
}

export const ConcentrationGauge = ({ detectionCounts, totalDetections }: ConcentrationGaugeProps) => {
  // Use real-time data from storage
  const { detectionData, totalDetections: storageTotal, storageCounts, refreshData } = useDetectionStorage();
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Use storage data if available, fallback to props
  const realTimeCounts = (storageCounts && Object.keys(storageCounts).length > 0) ? storageCounts : detectionCounts;
  const realTimeTotal = storageTotal > 0 ? storageTotal : totalDetections;
  
  // Visual feedback for real-time updates
  useEffect(() => {
    if (detectionData && Array.isArray(detectionData) && detectionData.length > 0) {
      setIsUpdating(true);
      const timer = setTimeout(() => setIsUpdating(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [detectionData, storageCounts]);
  
  // Calculate concentration based on detection classes using the provided formula
  const calculateConcentration = () => {
    if (realTimeTotal === 0) return 100; // No detections = perfect concentration
    
    const safeDriving = (realTimeCounts && realTimeCounts['SafeDriving']) || 0;
    const dangerousDriving = (realTimeCounts && realTimeCounts['DangerousDriving']) || 0;
    const distracted = (realTimeCounts && realTimeCounts['Distracted']) || 0;
    const drinking = (realTimeCounts && realTimeCounts['Drinking']) || 0;
    const yawn = (realTimeCounts && realTimeCounts['Yawn']) || 0;
    const sleepyDriving = (realTimeCounts && realTimeCounts['SleepyDriving']) || 0;
    
    // Calculate total using the formula with all real classes:
    // NTotal = NSafe + NDangerous + NDistracted + NDrinking + NYawn + NSleepyDriving
    const calculatedTotal = safeDriving + dangerousDriving + distracted + drinking + yawn + sleepyDriving;
    
    // If calculated total is 0, return 100% concentration
    if (calculatedTotal === 0) return 100;
    
    // Concentration = (Safe Driving / Total) * 100
    const concentration = (safeDriving / calculatedTotal) * 100;
    return Math.round(concentration);
  };

  const concentration = calculateConcentration();
  
  // Determine concentration level and color
  const getConcentrationLevel = () => {
    if (concentration >= 76) {
      return {
        level: 'Good',
        color: '#10B981', // Green
        icon: CheckCircle,
        description: 'Excellent concentration'
      };
    } else if (concentration >= 26) {
      return {
        level: 'Acceptable',
        color: '#F59E0B', // Amber
        icon: Clock,
        description: 'Moderate concentration'
      };
    } else {
      return {
        level: 'Critical',
        color: '#EF4444', // Red
        icon: AlertTriangle,
        description: 'Low concentration'
      };
    }
  };

  const concentrationLevel = getConcentrationLevel();
  const IconComponent = concentrationLevel.icon;

  return (
    <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg font-semibold text-gray-800">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            Driver Concentration
          </div>
          <div className="flex items-center gap-2">
            {isUpdating && (
              <div className="flex items-center gap-1 text-xs text-blue-600">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>Updating...</span>
              </div>
            )}
            <button
              onClick={refreshData}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title="Refresh data"
            >
              <RefreshCw className="w-4 h-4 text-gray-500 hover:text-blue-600" />
            </button>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Simple Circular Progress */}
        <div className="flex justify-center">
          <div className="relative w-32 h-32">
            {/* Background Circle */}
            <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-gray-200"
                stroke="currentColor"
                strokeWidth="3"
                fill="none"
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              {/* Progress Circle */}
              <path
                className="transition-all duration-500 ease-in-out"
                style={{ color: concentrationLevel.color }}
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
                strokeDasharray={`${concentration}, 100`}
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            
            {/* Center Content */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div 
                  className="text-2xl font-bold"
                  style={{ color: concentrationLevel.color }}
                >
                  {concentration}%
                </div>
                <div className="text-xs text-gray-500">Concentration</div>
              </div>
            </div>
          </div>
        </div>

        {/* Concentration Level */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-center"
        >
          <div className="flex items-center justify-center gap-2 mb-1">
            <IconComponent 
              className="w-4 h-4" 
              style={{ color: concentrationLevel.color }}
            />
            <span 
              className="text-sm font-semibold"
              style={{ color: concentrationLevel.color }}
            >
              {concentrationLevel.level}
            </span>
          </div>
          <div className="text-xs text-gray-500">
            {concentrationLevel.description}
          </div>
        </motion.div>

        {/* Zone Indicators */}
        <div className="flex justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <span>Critical</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-amber-500"></div>
            <span>Acceptable</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span>Good</span>
          </div>
        </div>

      </CardContent>
    </Card>
  );
};
