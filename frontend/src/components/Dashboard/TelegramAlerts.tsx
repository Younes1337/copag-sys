import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, 
  XCircle, 
  Clock,
  Wifi,
  WifiOff,
  RotateCcw
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useTelegramAlerts } from '@/hooks/useTelegramAlerts';
import { telegramService } from '@/services/telegramService';
import { getDetectionData } from '@/utils/detectionStorage';
import { useDetectionStorage } from '@/hooks/useDetectionStorage';

interface TelegramAlertsProps {
  detectionData: any[];
  detectionCounts: any;
  concentration: number;
  videoElement: HTMLVideoElement | null;
}

export const TelegramAlerts = ({ detectionData, detectionCounts, concentration, videoElement }: TelegramAlertsProps) => {
  // Get real-time detection data from storage - same as other components
  const { 
    detectionData: storageData, 
    totalDetections: storageTotal, 
    detectionCounts: storageCounts, 
    refreshData 
  } = useDetectionStorage();
  
  // Use storage data if available, fallback to props - same logic as other components
  const realTimeCounts = (storageCounts && Object.keys(storageCounts).length > 0) ? storageCounts : detectionCounts;
  const realTimeData = storageData || detectionData;


  const {
    isEnabled,
    alertStatus,
    lastAlertTimes,
    toggleAlerts,
    isConnected
  } = useTelegramAlerts(realTimeData, realTimeCounts, concentration, videoElement);

  const getStatusColor = () => {
    if (!isEnabled) return 'gray';
    if (isConnected) return 'green';
    return 'red';
  };

  const getStatusText = () => {
    if (!isEnabled) return 'Disabled';
    if (isConnected) return 'Connected';
    return 'Disconnected';
  };

  const getStatusIcon = () => {
    if (!isEnabled) return <XCircle className="w-4 h-4" />;
    if (isConnected) return <Wifi className="w-4 h-4" />;
    return <WifiOff className="w-4 h-4" />;
  };

  const resetCooldowns = () => {
    telegramService.lastAlertTimes = {};
  };

  const clearPredictionCache = () => {
    // Clear localStorage detection data
    localStorage.removeItem('detection_data');
    localStorage.removeItem('detectionData');
    
    // Clear any other detection-related storage
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('detection') || key.includes('prediction') || key.includes('inference'))) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    console.log('🧹 Prediction cache cleared');
    // Force page reload to reset all state
    window.location.reload();
  };


  return (
    <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg font-semibold text-black">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
            </svg>
            <span className="text-black">Telegram Alerts</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className={`flex items-center gap-1 ${
                getStatusColor() === 'green' ? 'text-green-600 border-green-200' :
                getStatusColor() === 'red' ? 'text-red-600 border-red-200' :
                'text-gray-600 border-gray-200'
              }`}
            >
              {getStatusIcon()}
              {getStatusText()}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Main Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Switch
              checked={isEnabled}
              onCheckedChange={toggleAlerts}
              disabled={!isConnected}
            />
            <div>
              <div className="text-sm font-medium text-black">Enable Alerts</div>
              <div className="text-xs text-black">
                {isEnabled ? 'Alerts are active' : 'Alerts are disabled'}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={clearPredictionCache}
              className="flex items-center gap-1 bg-violet-50 hover:bg-violet-100 text-violet-700 border-violet-200"
            >
              <RotateCcw className="w-3 h-3" />
              Clear Cache
            </Button>
          </div>
        </div>



        {/* Alert Types */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-black">Alert Types</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2 p-2 bg-red-50 rounded-lg">
              <AlertTriangle className="w-3 h-3 text-red-500" />
              <span className="text-black">Sleep Detection</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-orange-50 rounded-lg">
              <AlertTriangle className="w-3 h-3 text-orange-500" />
              <span className="text-black">Low Concentration</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-red-50 rounded-lg">
              <AlertTriangle className="w-3 h-3 text-red-500" />
              <span className="text-black">Dangerous Driving</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-red-50 rounded-lg">
              <AlertTriangle className="w-3 h-3 text-red-500" />
              <span className="text-black">Drinking</span>
            </div>
          </div>
        </div>


        {/* Recent Alerts */}
        {Object.keys(lastAlertTimes).length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-black">Recent Alerts</div>
            <div className="space-y-1">
              {Object.entries(lastAlertTimes).map(([type, timestamp]) => (
                <div key={type} className="flex items-center justify-between text-xs text-black">
                  <span className="capitalize">{type.replace(/([A-Z])/g, ' $1').trim()}</span>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status Indicator */}
        <div className="flex items-center gap-2 text-xs">
          <div className={`w-2 h-2 rounded-full ${
            isEnabled && isConnected ? 'bg-green-500' : 
            isEnabled ? 'bg-red-500' : 'bg-gray-400'
          }`} />
          <span className="text-black">
            {isEnabled && isConnected ? 'Alerts active' : 
             isEnabled ? 'Connection failed' : 'Alerts disabled'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
