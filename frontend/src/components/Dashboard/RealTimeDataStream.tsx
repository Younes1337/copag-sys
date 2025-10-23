import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Activity, Download, Play, Pause, RotateCcw, Database } from 'lucide-react';

interface DataPoint {
  timestamp: number;
  time: string;
  ear: number;
  blinkCount: number;
  blinkFrequency: number;
  fatigueLevel: string;
  alertStatus: string;
  sessionDuration: number;
}

interface RealTimeDataStreamProps {
  isActive: boolean;
  ear: number;
  blinkCount: number;
  blinkFrequency: number;
  fatigueLevel: string;
  onDataExport?: (data: DataPoint[]) => void;
}

export const RealTimeDataStream = ({ 
  isActive, 
  ear, 
  blinkCount, 
  blinkFrequency, 
  fatigueLevel,
  onDataExport 
}: RealTimeDataStreamProps) => {
  const [dataStream, setDataStream] = useState<DataPoint[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamStats, setStreamStats] = useState({
    totalPoints: 0,
    averageEAR: 0,
    maxBlinkRate: 0,
    alertCount: 0,
    sessionStart: null as number | null
  });

  // Real-time data capture
  useEffect(() => {
    if (!isActive || !isStreaming) return;

    const now = Date.now();
    const timeString = new Date(now).toLocaleTimeString();
    
    const alertStatus = ear < 0.20 ? 'High Alert' : ear < 0.25 ? 'Warning' : 'Normal';
    const sessionDuration = streamStats.sessionStart ? Math.round((now - streamStats.sessionStart) / 1000) : 0;

    const dataPoint: DataPoint = {
      timestamp: now,
      time: timeString,
      ear: Math.round(ear * 1000) / 1000,
      blinkCount,
      blinkFrequency: Math.round(blinkFrequency * 10) / 10,
      fatigueLevel,
      alertStatus,
      sessionDuration
    };

    setDataStream(prev => {
      const newStream = [...prev, dataPoint];
      // Keep last 200 data points for performance
      return newStream.slice(-200);
    });

    // Update stream statistics
    setStreamStats(prev => ({
      ...prev,
      totalPoints: prev.totalPoints + 1,
      averageEAR: prev.averageEAR === 0 ? ear : (prev.averageEAR + ear) / 2,
      maxBlinkRate: Math.max(prev.maxBlinkRate, blinkFrequency),
      alertCount: prev.alertCount + (alertStatus !== 'Normal' ? 1 : 0)
    }));

  }, [isActive, isStreaming, ear, blinkCount, blinkFrequency, fatigueLevel, streamStats.sessionStart]);

  // Start streaming
  const startStreaming = useCallback(() => {
    setIsStreaming(true);
    setStreamStats(prev => ({
      ...prev,
      sessionStart: prev.sessionStart || Date.now()
    }));
  }, []);

  // Stop streaming
  const stopStreaming = useCallback(() => {
    setIsStreaming(false);
  }, []);

  // Reset stream
  const resetStream = useCallback(() => {
    setDataStream([]);
    setIsStreaming(false);
    setStreamStats({
      totalPoints: 0,
      averageEAR: 0,
      maxBlinkRate: 0,
      alertCount: 0,
      sessionStart: null
    });
  }, []);

  // Export data
  const exportStreamData = useCallback(() => {
    if (onDataExport) {
      onDataExport(dataStream);
    } else {
      // Default export functionality
      const exportData = {
        streamInfo: {
          sessionStart: streamStats.sessionStart ? new Date(streamStats.sessionStart).toISOString() : null,
          totalPoints: streamStats.totalPoints,
          averageEAR: Math.round(streamStats.averageEAR * 1000) / 1000,
          maxBlinkRate: Math.round(streamStats.maxBlinkRate * 10) / 10,
          alertCount: streamStats.alertCount
        },
        dataPoints: dataStream
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `real-time-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, [dataStream, streamStats, onDataExport]);

  // Get current session duration
  const getSessionDuration = () => {
    if (!streamStats.sessionStart) return 0;
    return Math.round((Date.now() - streamStats.sessionStart) / 1000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" />
            Real-Time Data Stream
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={isStreaming ? "destructive" : "default"}
              size="sm"
              onClick={isStreaming ? stopStreaming : startStreaming}
              disabled={!isActive}
              className="flex items-center gap-2"
            >
              {isStreaming ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isStreaming ? 'Stop Stream' : 'Start Stream'}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={exportStreamData}
              disabled={dataStream.length === 0}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={resetStream}
              className="flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </Button>
          </div>
        </CardTitle>
        <CardDescription>
          {isStreaming ? (
            <div className="flex items-center gap-4">
              <Badge variant="default" className="bg-green-500">
                <Activity className="w-3 h-3 mr-1" />
                Streaming Active
              </Badge>
              <span>Session: {getSessionDuration()}s | Points: {streamStats.totalPoints}</span>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Badge variant="secondary">
                <Pause className="w-3 h-3 mr-1" />
                Stream Paused
              </Badge>
              <span>Click Start Stream to begin data collection</span>
            </div>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-lg font-bold text-blue-600">{streamStats.totalPoints}</div>
            <div className="text-xs text-blue-600">Data Points</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-lg font-bold text-green-600">{Math.round(streamStats.averageEAR * 1000) / 1000}</div>
            <div className="text-xs text-green-600">Avg EAR</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-lg font-bold text-orange-600">{Math.round(streamStats.maxBlinkRate * 10) / 10}</div>
            <div className="text-xs text-orange-600">Max Blink Rate</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="text-lg font-bold text-red-600">{streamStats.alertCount}</div>
            <div className="text-xs text-red-600">Alerts</div>
          </div>
        </div>

        {/* Recent Data Points */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Recent Data Points</h4>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {dataStream.slice(-10).reverse().map((point, index) => (
              <div key={point.timestamp} className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded">
                <div className="flex items-center gap-2">
                  <span className="font-mono">{point.time}</span>
                  <Badge variant={point.alertStatus === 'High Alert' ? 'destructive' : 
                               point.alertStatus === 'Warning' ? 'secondary' : 'default'}>
                    {point.alertStatus}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <span>EAR: {point.ear}</span>
                  <span>Blinks: {point.blinkCount}</span>
                  <span>Rate: {point.blinkFrequency}/min</span>
                </div>
              </div>
            ))}
            {dataStream.length === 0 && (
              <div className="text-center text-muted-foreground py-4">
                No data points yet. Start streaming to see real-time data.
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
