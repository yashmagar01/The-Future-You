import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
  Label
} from 'recharts';

interface PacingData {
  time: string;
  wpm: number;
}

interface PacingGraphProps {
  data: PacingData[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 shadow-lg rounded-lg">
        <p className="text-sm font-medium text-gray-900">{`Time: ${label}`}</p>
        <p className="text-sm text-blue-600">{`Speed: ${payload[0].value} WPM`}</p>
      </div>
    );
  }
  return null;
};

const PacingGraph: React.FC<PacingGraphProps> = ({ data }) => {
  return (
    <div className="w-full h-64 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Speaking Pace (Heartbeat)</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
          <XAxis 
            dataKey="time" 
            tick={{ fontSize: 12, fill: '#6b7280' }} 
            axisLine={false}
            tickLine={false}
          />
          <YAxis 
            tick={{ fontSize: 12, fill: '#6b7280' }} 
            axisLine={false}
            tickLine={false}
            domain={[0, 'auto']}
          />
          
          {/* The "Goldilocks Zone" - Optimal Speed */}
          <ReferenceArea 
            y1={130} 
            y2={160} 
            fill="#dcfce7" 
            fillOpacity={0.5}
          >
            <Label value="Optimal Zone" position="insideTopRight" fill="#166534" fontSize={12} />
          </ReferenceArea>

          <Tooltip content={<CustomTooltip />} />
          
          <Line
            type="monotone"
            dataKey="wpm"
            stroke="#2563eb"
            strokeWidth={3}
            dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 6, strokeWidth: 0 }}
            animationDuration={1500}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PacingGraph;
