import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp } from 'lucide-react';

interface SentimentData {
  time: string;
  score: number; // 0 to 100
  label: string;
}

interface SentimentGraphProps {
  data: SentimentData[];
}

const SentimentGraph: React.FC<SentimentGraphProps> = ({ data }) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 relative overflow-hidden">
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
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#ffffff', 
                border: '1px solid #e5e7eb', 
                borderRadius: '8px', 
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                color: '#1f2937',
                fontSize: '12px',
                fontWeight: 600
              }}
              itemStyle={{ color: '#0d9488' }}
              cursor={{ stroke: '#14b8a6', strokeWidth: 2, strokeDasharray: '4 4' }}
            />
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
