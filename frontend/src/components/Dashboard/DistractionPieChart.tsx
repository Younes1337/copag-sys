import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { AlertTriangle, Eye, Zap, Activity, Shield, Coffee, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useDetectionStorage } from '@/hooks/useDetectionStorage';

interface DistractionPieChartProps {
  distractionData?: Array<{
    name: string;
    value: number;
    color: string;
    icon?: React.ComponentType<{ className?: string }>;
  }>;
}

export const DistractionPieChart = ({ distractionData }: DistractionPieChartProps) => {
  // Use detection storage for real-time data
  const {
    detectionData,
    totalDetections,
    detectionCounts: storageCounts,
    refreshData
  } = useDetectionStorage();

  // Class configuration mapping with professional colors
  const getClassConfig = (className) => {
    const configs = {
      'DangerousDriving': { color: '#EF4444', label: 'Dangerous Driving' },
      'Distracted': { color: '#F59E0B', label: 'Distracted' },
      'Drinking': { color: '#8B5CF6', label: 'Drinking' },
      'SafeDriving': { color: '#10B981', label: 'Safe Driving' },
      'Yawn': { color: '#EC4899', label: 'Yawning' },
      'SleepyDriving': { color: '#6366F1', label: 'Sleepy Driving' }
    };
    return configs[className] || { color: '#6B7280', label: className };
  };

  // Generate pie chart data
  const pieChartData = () => {
    console.log('🥧 Generating pie chart data');
    console.log('🥧 detectionData:', detectionData);
    console.log('🥧 storageCounts:', storageCounts);
    console.log('🥧 totalDetections:', totalDetections);
    console.log('🥧 distractionData prop:', distractionData);

    // If we have storage data, use it
    if (detectionData && storageCounts && Object.keys(storageCounts).length > 0) {
      const counts = storageCounts || {};
      const total = totalDetections || 0;
      
      if (total === 0) {
        console.log('🥧 No detections in storage, using props data');
        return distractionData || [];
      }

      console.log('🥧 Using storage data');
      return Object.entries(counts).map(([className, count]) => {
        const classConfig = getClassConfig(className);
        return {
          name: classConfig.label || className,
          value: count,
          color: classConfig.color || '#808080'
        };
      });
    }

    // Fallback to props data
    console.log('🥧 Using props data as fallback');
    return distractionData || [];
  };

  const data = pieChartData();
  console.log('🥧 Final data for pie chart:', data);

  // Ensure we have data - force some test data if empty
  const safeData = data && data.length > 0 ? data : [
    { name: "Test Data", value: 5, color: "#FF0000" },
    { name: "Sample", value: 3, color: "#00FF00" },
    { name: "Demo", value: 2, color: "#0000FF" }
  ];

  console.log('🥧 Safe data for rendering:', safeData);
  console.log('🥧 Safe data values:', safeData.map(item => ({ name: item.name, value: item.value, color: item.color })));
  
  const totalDistractions = safeData.reduce((sum, item) => sum + (Number(item.value) || 0), 0);
  const [selectedSegment, setSelectedSegment] = useState(safeData[0] || null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Calculate percentage of selected segment
  const getSelectedPercentage = () => {
    if (!selectedSegment || totalDistractions === 0) return 0;
    return Math.round((Number(selectedSegment.value) / totalDistractions) * 100);
  };

  // Add visual feedback when data updates
  useEffect(() => {
    if (detectionData && storageCounts) {
      setIsUpdating(true);
      const timer = setTimeout(() => setIsUpdating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [detectionData, storageCounts]);

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { value: number; name: string; color: string } }> }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percent = ((data.value / totalDistractions) * 100).toFixed(1);
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <div className="flex items-center gap-2 mb-1">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: data.color }}
            />
            <span className="font-semibold text-gray-800 text-sm">{data.name}</span>
          </div>
          <div className="text-xs text-gray-600">
            <div className="font-medium">{data.value} incidents</div>
            <div className="text-gray-500">{percent}% of total</div>
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
        <div className="flex items-center gap-2">
          {isUpdating && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-1 text-xs text-green-600"
            >
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>Updating...</span>
            </motion.div>
          )}
          <button
            onClick={refreshData}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh data from storage"
          >
            <RefreshCw className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>
      
      <div className="relative">
        {safeData.length > 0 ? (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <motion.div
              animate={{ 
                scale: isUpdating ? 1.01 : 1,
                opacity: isUpdating ? 0.95 : 1 
              }}
              transition={{ duration: 0.2 }}
              className="relative"
            >
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
              <Pie
                data={safeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={120}
                innerRadius={80}
                fill="#8884d8"
                dataKey="value"
                strokeWidth={0}
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
                        stroke="none"
                        style={{ 
                          cursor: 'pointer',
                          filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.1))'
                        }}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
            
            {/* Center Label */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                {totalDistractions > 0 && selectedSegment ? (
                  <div className="bg-white rounded-full p-4 shadow-lg border border-gray-100">
                    <div className="text-2xl font-bold" style={{ color: selectedSegment.color }}>
                      {getSelectedPercentage()}%
                    </div>
                    <div className="text-xs text-gray-500 font-medium">{selectedSegment.name}</div>
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
        ) : (
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
            <div className="flex items-center justify-center h-72">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8 text-gray-400" />
                </div>
                <div className="text-lg font-semibold text-gray-600 mb-2">No Data Available</div>
                <div className="text-sm text-gray-500">Start monitoring to see pie chart</div>
              </div>
            </div>
          </div>
        )}
      </div>


      {/* Summary Stats */}
      <div className="mt-6 space-y-3">
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <span className="text-sm font-medium text-gray-700">Total Detections:</span>
          <span className="text-xl font-bold text-gray-900">{totalDetections || totalDistractions}</span>
        </div>
        
        {selectedSegment && (
          <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: selectedSegment.color }}
              />
              <span className="text-sm font-medium text-gray-700">{selectedSegment.name}:</span>
            </div>
            <span className="text-lg font-bold" style={{ color: selectedSegment.color }}>
              {getSelectedPercentage()}%
            </span>
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-2">
          {safeData.map((item, index) => {
            const total = totalDetections || totalDistractions;
            const percent = total > 0 ? (((Number(item.value) || 0) / total) * 100).toFixed(1) : '0.0';
            return (
              <div key={index} className="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded-lg">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: item.color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-gray-800 truncate">{item.name}</div>
                  <div className="text-xs text-gray-500">{percent}%</div>
                </div>
                <div className="text-sm font-bold text-gray-700">{Number(item.value)}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
