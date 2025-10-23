import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { AlertTriangle } from 'lucide-react';

interface SimplePieChartProps {
  data: Array<{
    name: string;
    value: number;
    color: string;
  }>;
}

export const SimplePieChart = ({ data }: SimplePieChartProps) => {
  console.log('🥧 SimplePieChart received data:', data);
  
  // Ensure we have data
  const safeData = data && data.length > 0 ? data : [
    { name: "No Data", value: 1, color: "#808080" }
  ];

  console.log('🥧 SimplePieChart safeData:', safeData);

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={safeData}
            cx="50%"
            cy="50%"
            outerRadius={120}
            innerRadius={40}
            fill="#8884d8"
            dataKey="value"
            strokeWidth={2}
            stroke="white"
          >
            {safeData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color}
                stroke="white"
                strokeWidth={2}
              />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'white', 
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
            formatter={(value, name) => [`${value}`, name]}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
