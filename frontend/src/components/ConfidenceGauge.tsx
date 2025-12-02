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
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col items-center justify-center relative overflow-hidden">
      <h3 className="text-lg font-semibold text-gray-800 mb-2">Confidence Score</h3>
      
      <div className="h-[200px] w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart 
            cx="50%" 
            cy="50%" 
            innerRadius="70%" 
            outerRadius="100%" 
            barSize={20} 
            data={data} 
            startAngle={180} 
            endAngle={0}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
            <RadialBar
              background
              dataKey="value"
              cornerRadius={10}
              fill="#10b981"
            />
          </RadialBarChart>
        </ResponsiveContainer>
        
        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
          <span className="text-5xl font-bold text-gray-900">{score}</span>
          <span className="text-sm text-gray-500 font-medium uppercase tracking-wider">/ 100</span>
        </div>
      </div>

      <div className="mt-[-20px] text-center">
        <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-bold uppercase tracking-wide border border-green-100">
          {getSocialProof(score)}
        </span>
      </div>
    </div>
  );
};

export default ConfidenceGauge;
