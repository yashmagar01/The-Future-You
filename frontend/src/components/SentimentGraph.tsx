import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp, Smile, Heart, Sparkles, Frown, AlertCircle } from 'lucide-react';

interface SentimentData {
  time: string;
  score: number; // 0 to 100
  label: string;
  phrase?: string;
}

interface DetectedEmotion {
  label: string;
  confidence: number;
}

interface SentimentGraphProps {
  data: SentimentData[];
  dominantEmotion?: string;
  emotions?: DetectedEmotion[];
}

// Emotion configuration with colors and icons
const emotionConfig: Record<string, { color: string; bgColor: string; icon: React.ReactNode }> = {
  joy: { color: 'text-yellow-600', bgColor: 'bg-yellow-50 border-yellow-200', icon: <Smile className="w-3 h-3" /> },
  love: { color: 'text-pink-600', bgColor: 'bg-pink-50 border-pink-200', icon: <Heart className="w-3 h-3" /> },
  optimism: { color: 'text-emerald-600', bgColor: 'bg-emerald-50 border-emerald-200', icon: <Sparkles className="w-3 h-3" /> },
  trust: { color: 'text-blue-600', bgColor: 'bg-blue-50 border-blue-200', icon: <Sparkles className="w-3 h-3" /> },
  anticipation: { color: 'text-orange-600', bgColor: 'bg-orange-50 border-orange-200', icon: <Sparkles className="w-3 h-3" /> },
  surprise: { color: 'text-purple-600', bgColor: 'bg-purple-50 border-purple-200', icon: <Sparkles className="w-3 h-3" /> },
  sadness: { color: 'text-indigo-600', bgColor: 'bg-indigo-50 border-indigo-200', icon: <Frown className="w-3 h-3" /> },
  fear: { color: 'text-gray-600', bgColor: 'bg-gray-50 border-gray-200', icon: <AlertCircle className="w-3 h-3" /> },
  pessimism: { color: 'text-slate-600', bgColor: 'bg-slate-50 border-slate-200', icon: <Frown className="w-3 h-3" /> },
  disgust: { color: 'text-lime-600', bgColor: 'bg-lime-50 border-lime-200', icon: <AlertCircle className="w-3 h-3" /> },
  anger: { color: 'text-red-600', bgColor: 'bg-red-50 border-red-200', icon: <AlertCircle className="w-3 h-3" /> },
};

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

const SentimentGraph: React.FC<SentimentGraphProps> = ({ data, dominantEmotion = 'Neutral', emotions = [] }) => {
  // Get config for dominant emotion
  const dominantConfig = emotionConfig[dominantEmotion?.toLowerCase()] || {
    color: 'text-teal-700',
    bgColor: 'bg-teal-50 border-teal-100',
    icon: <Smile className="w-3 h-3" />
  };

  // Sort emotions by confidence and take top 4
  const topEmotions = [...emotions]
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 4);

  return (
    <div className="p-6 lg:p-8 h-full flex flex-col font-sans tracking-tight">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-[22px] font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F4F4F5] flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-gray-700" />
            </div>
            Emotional Tone
          </h3>
          <p className="text-[15px] font-medium text-gray-500 mt-2">Multi-emotion analysis (11 categories)</p>
        </div>
        <div className="text-right">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#EAF8F2] text-[#16C784] font-bold capitalize">
            {dominantConfig.icon}
            {dominantEmotion}
          </div>
          <p className="text-[12px] text-gray-400 font-bold mt-2 uppercase tracking-widest">Dominant Tone</p>
        </div>
      </div>

      {/* Emotion Breakdown Pills */}
      {topEmotions.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          {topEmotions.map((emotion, idx) => {
            const config = emotionConfig[emotion.label.toLowerCase()] || {
              color: 'text-gray-600',
              bgColor: 'bg-gray-50 border-gray-200',
              icon: null
            };
            return (
              <div
                key={idx}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${config.bgColor} ${config.color} text-[13px] font-bold border capitalize`}
              >
                {config.icon}
                {emotion.label}
                <span className="text-[11px] opacity-70">({emotion.confidence}%)</span>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex-1 w-full min-h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorSentiment" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#16C784" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#16C784" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8F0EC" />
            <XAxis 
              dataKey="time" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 13, fill: '#9ca3af', fontWeight: 600 }} 
              interval="preserveStartEnd"
              dy={15}
            />
            <YAxis 
              hide 
              domain={[0, 100]}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#16C784', strokeWidth: 2, strokeDasharray: '4 4' }} />
            <ReferenceLine y={50} stroke="#E8F0EC" strokeDasharray="3 3" />
            <Area 
              type="monotone" 
              dataKey="score" 
              stroke="#16C784" 
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
