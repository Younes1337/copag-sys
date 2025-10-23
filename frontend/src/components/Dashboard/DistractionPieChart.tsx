import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { AlertTriangle, Eye, Zap, Activity, Shield, Coffee } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

interface DistractionPieChartProps {
  distractionData: Array<{
    name: string;
    value: number;
    color: string;
    icon: React.ComponentType<any>;
  }>;
}

export const DistractionPieChart = ({ distractionData }: DistractionPieChartProps) => {
  // Ensure all values are valid numbers
  const safeData = distractionData.map(item => ({
    ...item,
    value: isNaN(Number(item.value)) ? 0 : Number(item.value)
  }));
  
  const totalDistractions = safeData.reduce((sum, item) => sum + item.value, 0);
  const [selectedSegment, setSelectedSegment] = useState(safeData[0] || null);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Update selected segment when data changes
  useEffect(() => {
    if (safeData.length > 0 && (!selectedSegment || selectedSegment.value === 0)) {
      // Find the first segment with data, or default to first
      const firstWithData = safeData.find(item => item.value > 0) || safeData[0];
      setSelectedSegment(firstWithData);
    }
  }, [safeData, selectedSegment]);
  
  // Debug: Log the data being received
  useEffect(() => {
    console.log('🥧 Pie chart received data:', safeData);
    console.log('🥧 Total distractions:', totalDistractions);
    console.log('🥧 Selected segment:', selectedSegment);
  }, [safeData, totalDistractions, selectedSegment]);

  // Add visual feedback when data updates
  useEffect(() => {
    setIsUpdating(true);
    const timer = setTimeout(() => setIsUpdating(false), 500);
    return () => clearTimeout(timer);
  }, [distractionData]);
  
  const renderCustomLabel = () => {
    return null; // Remove individual segment labels
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percent = ((data.value / totalDistractions) * 100).toFixed(1);
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <div className="flex items-center gap-2">
            <data.icon className="w-4 h-4" style={{ color: data.color }} />
            <span className="font-medium">{data.name}</span>
          </div>
          <div className="text-sm text-gray-600">
            {data.value} incidents ({percent}%)
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <h3 className="text-lg font-semibold">Distraction Analysis</h3>
        </div>
        {isUpdating && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-1 text-xs text-blue-600"
          >
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <span>Live</span>
          </motion.div>
        )}
      </div>
      
      <div className="h-80 relative">
        <motion.div
          animate={{ 
            scale: isUpdating ? 1.02 : 1,
            opacity: isUpdating ? 0.9 : 1 
          }}
          transition={{ duration: 0.3 }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={safeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomLabel}
                outerRadius={120}
                innerRadius={40}
                fill="#8884d8"
                dataKey="value"
                strokeWidth={2}
                stroke="white"
                onClick={(data) => {
                  if (data) {
                    setSelectedSegment(data);
                  }
                }}
              >
              {safeData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color}
                  stroke="white"
                  strokeWidth={2}
                  style={{ cursor: 'pointer' }}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        </motion.div>
        
        {/* Center Label */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            {totalDistractions > 0 && selectedSegment && selectedSegment.value > 0 ? (
              <div className="text-xl font-bold text-black">
                {(() => {
                  const percentage = (selectedSegment.value / totalDistractions) * 100;
                  return isNaN(percentage) || !isFinite(percentage) ? '0.0%' : percentage.toFixed(1) + '%';
                })()}
              </div>
            ) : (
              <div className="text-center">
                <div className="text-sm text-gray-500 mb-1">No detections yet</div>
                <div className="text-xs text-gray-400">Start monitoring to see data</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mt-6 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Total Detections:</span>
          <span className="text-lg font-bold text-red-600">{totalDistractions}</span>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {safeData.map((item, index) => {
            const percent = totalDistractions > 0 ? ((item.value / totalDistractions) * 100).toFixed(1) : '0.0';
            return (
              <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: item.color }}
                />
                <div className="flex-1">
                  <div className="text-xs font-medium">{item.name}</div>
                  <div className="text-xs text-gray-500">{percent}%</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
