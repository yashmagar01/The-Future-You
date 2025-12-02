import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp } from 'lucide-react';

interface SentimentData {
  time: string;
  score: number; // 0 to 100
  label: string;
  phrase?: string;
}

interface SentimentGraphProps {
  data: SentimentData[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white border border-gray-200 p-3 rounded-xl shadow-lg max-w-[200px]">
        <p className="text-sm font-bold text-gray-900 mb-1">{data.time}</p>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-teal-500"></div>
          <p className="text-sm text-teal-700 font-medium">
            {data.label} ({data.score})
          </p>
        </div>
        {data.phrase && (
          <p className="text-xs text-gray-500 italic border-t border-gray-100 pt-2">
            "{data.phrase}"
          </p>
        )}
      </div>
    );
  }
  return null;
};

const SentimentGraph: React.FC<SentimentGraphProps> = ({ data }) => {
  return (
    <div className="bg-[#faf7ff] rounded-2xl border border-[rgba(139,92,246,0.12)] shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6 relative overflow-hidden">
      {/* Top Accent Line */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-[#8b5cf6]"></div>

      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-teal-500" />
            Emotional Tone
          </h3>
          <p className="text-sm text-gray-500 mt-1">Sentiment analysis over time</p>
        </div>
        <div className="text-right">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-100 text-sm font-bold">
            Positive
          </div>
          <p className="text-xs text-gray-400 font-medium mt-1 uppercase tracking-wide">Dominant Tone</p>
        </div>
      </div>

      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorSentiment" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis 
              dataKey="time" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: '#9ca3af', fontWeight: 500 }} 
              interval="preserveStartEnd"
              dy={10}
            />
            <YAxis 
              hide 
              domain={[0, 100]}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#14b8a6', strokeWidth: 2, strokeDasharray: '4 4' }} />
            <ReferenceLine y={50} stroke="#e5e7eb" strokeDasharray="3 3" label={{ value: 'Neutral', position: 'insideLeft', fill: '#9ca3af', fontSize: 10 }} />
            <Area 
              type="monotone" 
              dataKey="score" 
              stroke="#14b8a6" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorSentiment)" 
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SentimentGraph;
