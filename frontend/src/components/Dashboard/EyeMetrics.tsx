import React, { useEffect, useState, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';
import { Eye, Activity, PieChart as PieChartIcon } from 'lucide-react';
import { useEyeMetrics } from '@/hooks/useEyeMetrics';
import { useInference } from '@/hooks/useInference';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const EyeMetrics = ({ isActive, videoElement }) => {
  const {
    ear,
    blinkCount,
    blinkFrequency,
    isInitialized,
    error,
    processFrame,
    startMetrics,
    stopMetrics
  } = useEyeMetrics();

  // Inference hook for detection data
  const {
    detections,
    detectionCounts,
    isInitialized: inferenceInitialized,
    getClassConfig
  } = useInference();


  // Data arrays for charts
  const [earData, setEarData] = useState([]);
  const [frequencyData, setFrequencyData] = useState([]);
  const [pieChartData, setPieChartData] = useState([]);

  // Update data arrays when metrics change
  useEffect(() => {
    if (!isActive) return;

    const now = new Date();
    const timeString = now.toLocaleTimeString();

    // Update EAR data
    setEarData(prev => {
      const newData = [...prev, { time: timeString, ear }];
      return newData.slice(-30); // Keep last 30 data points
    });

    // Update frequency data
    setFrequencyData(prev => {
      const newData = [...prev, { time: timeString, frequency: blinkFrequency }];
      return newData.slice(-30);
    });
  }, [ear, blinkFrequency, isActive]);

  // Update pie chart data based on detection counts
  useEffect(() => {
    if (!inferenceInitialized || !detectionCounts) return;

    const totalDetections = Object.values(detectionCounts).reduce((sum, count) => sum + count, 0);
    
    if (totalDetections === 0) {
      setPieChartData([]);
      return;
    }

    const pieData = Object.entries(detectionCounts).map(([className, count]) => {
      const classConfig = getClassConfig(className);
      return {
        name: classConfig.label || className,
        value: count,
        color: classConfig.color || '#808080',
        percentage: Math.round((count / totalDetections) * 100)
      };
    });

    setPieChartData(pieData);
  }, [detectionCounts, inferenceInitialized, getClassConfig]);

  // Start/stop metrics based on camera state
  useEffect(() => {
    if (isActive && videoElement && isInitialized) {
      startMetrics(videoElement);
    } else {
      stopMetrics();
    }
  }, [isActive, videoElement, isInitialized, startMetrics, stopMetrics]);

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="w-5 h-5 text-red-500" />
            <h3 className="text-lg font-semibold text-red-700">Eye Metrics Error</h3>
          </div>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className="space-y-6">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="w-5 h-5 text-gray-500" />
            <h3 className="text-lg font-semibold text-gray-700">Initializing Eye Metrics...</h3>
          </div>
          <p className="text-gray-600">Loading face detection model...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Real-time Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Eye Aspect Ratio (EAR) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />
              Eye Aspect Ratio (EAR)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={earData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="time" 
                    tick={{ fontSize: 10 }}
                    tickLine={{ stroke: '#e5e7eb' }}
                    interval="preserveStartEnd"
                  />
                  <YAxis 
                    tick={{ fontSize: 10 }}
                    tickLine={{ stroke: '#e5e7eb' }}
                    domain={[0, 0.4]}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    formatter={(value) => [value.toFixed(3), 'EAR']}
                    labelFormatter={(label) => `Time: ${label}`}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="ear" 
                    stroke="#3b82f6" 
                    fill="#3b82f6" 
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-muted-foreground">Current EAR: {ear.toFixed(3)}</span>
              </div>
              <div className="text-muted-foreground">
                <span className="font-medium">Normal:</span> 0.25-0.35 | <span className="font-medium">Alert:</span> &lt;0.20
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Blink Frequency */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-orange-500" />
              Blink Frequency
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={frequencyData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="time" 
                    tick={{ fontSize: 10 }}
                    tickLine={{ stroke: '#e5e7eb' }}
                    interval="preserveStartEnd"
                  />
                  <YAxis 
                    tick={{ fontSize: 10 }}
                    tickLine={{ stroke: '#e5e7eb' }}
                    label={{ value: 'Blinks/min', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    formatter={(value) => [value.toFixed(1), 'Blinks/min']}
                    labelFormatter={(label) => `Time: ${label}`}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="frequency" 
                    stroke="#f59e0b" 
                    fill="#f59e0b" 
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span className="text-muted-foreground">Current Rate: {blinkFrequency.toFixed(1)} blinks/min</span>
              </div>
              <div className="text-muted-foreground">
                <span className="font-medium">Normal:</span> 15-20/min | <span className="font-medium">Fatigue:</span> &gt;25/min
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detection Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-purple-500" />
              Detection Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {pieChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                      formatter={(value, name, props) => [
                        `${value} detections (${props.payload.percentage}%)`, 
                        props.payload.name
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <PieChartIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No detections yet</p>
                    <p className="text-xs">Start camera to see real-time data</p>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-4 flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                <span className="text-muted-foreground">
                  Total: {Object.values(detectionCounts).reduce((sum, count) => sum + count, 0)} detections
                </span>
              </div>
              <div className="text-muted-foreground">
                <span className="font-medium">Real-time</span> AI detection
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
};