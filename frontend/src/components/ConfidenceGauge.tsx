import React from 'react';
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts';

interface ConfidenceGaugeProps {
  score: number;
}

const ConfidenceGauge: React.FC<ConfidenceGaugeProps> = ({ score }) => {
  const data = [{ name: 'Confidence', value: score, fill: '#10b981' }]; // Brand green

  // Determine social proof text based on score
  const getSocialProof = (s: number) => {
    if (s >= 90) return "Top 5% of speakers";
    if (s >= 80) return "Top 15% of speakers";
    if (s >= 70) return "Better than average";
    return "Room for growth";
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-emerald-500" />
      
      <h3 className="text-lg font-bold text-gray-800 mb-1">Confidence Score</h3>
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-4">Overall Performance</p>
      
      <div className="h-[220px] w-full relative -mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart 
            cx="50%" 
            cy="50%" 
            innerRadius="65%" 
            outerRadius="100%" 
            barSize={24} 
            data={data} 
            startAngle={180} 
            endAngle={0}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
            <RadialBar
              background={{ fill: '#f3f4f6' }}
              dataKey="value"
              cornerRadius={12}
              fill="#10b981"
            />
          </RadialBarChart>
        </ResponsiveContainer>
        
        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-10">
          <span className="text-6xl font-black text-gray-900 tracking-tight">{score}</span>
          <span className="text-sm text-gray-400 font-bold uppercase tracking-widest mt-1">/ 100</span>
        </div>
      </div>

      <div className="mt-[-30px] text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wide">{getSocialProof(score)}</span>
        </div>
      </div>
    </div>
  );
};

export default ConfidenceGauge;
