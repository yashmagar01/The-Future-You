import React, { useRef } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
  ReferenceLine,
  Label
} from 'recharts';
import { Download } from 'lucide-react';
import html2canvas from 'html2canvas';

interface PacingData {
  time: string;
  wpm: number;
  confidence?: number;
}

interface PacingGraphProps {
  data: PacingData[];
}

// Enhanced custom tooltip with status badge
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const wpm = payload[0].value;
    let status = 'Optimal';
    let statusColor = 'text-green-600 bg-green-50';
    
    if (wpm < 110) {
      status = 'Too Slow';
      statusColor = 'text-amber-600 bg-amber-50';
    } else if (wpm > 150) {
      status = 'Too Fast';
      statusColor = 'text-red-600 bg-red-50';
    }

    return (
      <div className="bg-white p-4 border border-gray-200 shadow-xl rounded-xl backdrop-blur-sm">
        <p className="text-xs font-medium text-gray-500 mb-2">Time Range</p>
        <p className="text-sm font-bold text-gray-900 mb-3">{label}</p>
        
        <div className="flex items-center justify-between gap-4 mb-2">
          <span className="text-xs text-gray-500">Speaking Rate</span>
          <span className="text-lg font-bold text-blue-600">{wpm} WPM</span>
        </div>
        
        <div className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold ${statusColor}`}>
          {status}
        </div>
        
        {payload[0].payload.confidence && (
          <div className="mt-2 pt-2 border-t border-gray-100">
            <span className="text-xs text-gray-400">Confidence: {payload[0].payload.confidence}%</span>
          </div>
        )}
      </div>
    );
  }
  return null;
};

const PacingGraph: React.FC<PacingGraphProps> = ({ data }) => {
  const chartRef = useRef<HTMLDivElement>(null);

  const exportToPNG = async () => {
    if (chartRef.current) {
      try {
        const canvas = await html2canvas(chartRef.current, {
          backgroundColor: '#ffffff',
          scale: 2, // Higher quality
        });
        
        const link = document.createElement('a');
        link.download = `pacing-analysis-${new Date().toISOString().split('T')[0]}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      } catch (error) {
        console.error('Failed to export chart:', error);
      }
    }
  };

  return (
    <div 
      ref={chartRef}
      className="w-full bg-white p-6 rounded-2xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow duration-300"
    >
      {/* Header with Export Button */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-800">Speaking Pace (Heartbeat)</h3>
          <p className="text-sm text-gray-500 mt-1">Your speaking rate over time</p>
        </div>
        
        <button
          onClick={exportToPNG}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200 border border-gray-200"
          title="Export as PNG"
        >
          <Download size={16} />
          <span className="hidden sm:inline">Export</span>
        </button>
      </div>

      {/* Chart Container */}
      <ResponsiveContainer width="100%" height={400}>
        <LineChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 10,
            bottom: 20,
          }}
        >
          {/* Grid */}
          <CartesianGrid 
            strokeDasharray="3 3" 
            vertical={false} 
            stroke="rgba(0,0,0,0.05)" 
          />
          
          {/* Axes */}
          <XAxis 
            dataKey="time" 
            tick={{ fontSize: 11, fill: '#6b7280' }} 
            axisLine={false}
            tickLine={false}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis 
            tick={{ fontSize: 12, fill: '#6b7280', fontWeight: 500 }} 
            axisLine={false}
            tickLine={false}
            domain={[0, 'auto']}
            label={{ 
              value: 'Words Per Minute', 
              angle: -90, 
              position: 'insideLeft',
              style: { fontSize: 12, fill: '#6b7280', fontWeight: 600 }
            }}
          />
          
          {/* Optimal Zone - Green Shaded Area */}
          <ReferenceArea 
            y1={130} 
            y2={160} 
            fill="#10b981" 
            fillOpacity={0.08}
            stroke="#10b981"
            strokeOpacity={0.2}
            strokeWidth={1}
          >
            <Label 
              value="Optimal Zone (130-160 WPM)" 
              position="insideTopRight" 
              fill="#059669" 
              fontSize={11}
              fontWeight={600}
              offset={10}
            />
          </ReferenceArea>

          {/* Threshold Lines */}
          <ReferenceLine 
            y={110} 
            stroke="#f59e0b" 
            strokeDasharray="5 5" 
            strokeWidth={2}
            strokeOpacity={0.6}
          >
            <Label 
              value="Slow (110)" 
              position="right" 
              fill="#d97706" 
              fontSize={10}
              fontWeight={600}
            />
          </ReferenceLine>
          
          <ReferenceLine 
            y={150} 
            stroke="#ef4444" 
            strokeDasharray="5 5" 
            strokeWidth={2}
            strokeOpacity={0.6}
          >
            <Label 
              value="Fast (150)" 
              position="right" 
              fill="#dc2626" 
              fontSize={10}
              fontWeight={600}
            />
          </ReferenceLine>

          {/* Tooltip */}
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#2563eb', strokeWidth: 1, strokeDasharray: '5 5' }} />
          
          {/* Main Line */}
          <Line
            type="monotone"
            dataKey="wpm"
            stroke="url(#blueGradient)"
            strokeWidth={3}
            dot={{ 
              r: 5, 
              fill: '#2563eb', 
              strokeWidth: 2, 
              stroke: '#fff',
            }}
            activeDot={{ 
              r: 7, 
              strokeWidth: 3,
              stroke: '#2563eb',
              fill: '#fff',
              style: { filter: 'drop-shadow(0 0 6px rgba(37, 99, 235, 0.5))' }
            }}
            animationDuration={2000}
            animationEasing="ease-in-out"
          />
          
          {/* Gradient definition */}
          <defs>
            <linearGradient id="blueGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="50%" stopColor="#2563eb" />
              <stop offset="100%" stopColor="#1d4ed8" />
            </linearGradient>
          </defs>
        </LineChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-0.5 bg-gradient-to-r from-blue-400 to-blue-600 rounded"></div>
          <span className="text-xs text-gray-600 font-medium">Your Pace</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-3 bg-green-500 bg-opacity-10 border border-green-500 border-opacity-20 rounded"></div>
          <span className="text-xs text-gray-600 font-medium">Optimal Zone</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-0.5 border-t-2 border-dashed border-amber-500 rounded"></div>
          <span className="text-xs text-gray-600 font-medium">Slow Threshold</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-0.5 border-t-2 border-dashed border-red-500 rounded"></div>
          <span className="text-xs text-gray-600 font-medium">Fast Threshold</span>
        </div>
      </div>
    </div>
  );
};

export default PacingGraph;
