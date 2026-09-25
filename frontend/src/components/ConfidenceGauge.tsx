import React from 'react';
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { Trophy } from 'lucide-react';

interface ConfidenceGaugeProps {
  score: number;
}

const ConfidenceGauge: React.FC<ConfidenceGaugeProps> = ({ score }) => {
  const data = [{ name: 'Confidence', value: score, fill: '#10b981' }];

  const getSocialProof = (s: number) => {
    if (s >= 90) return "Top 5% of speakers";
    if (s >= 80) return "Top 15% of speakers";
    if (s >= 70) return "Better than average";
    return "Room for growth";
  };

  return (
    <div className="bg-white rounded-[20px] border border-[#E8F0EC] shadow-sm p-6 lg:p-8 h-full flex flex-col justify-between relative overflow-hidden font-sans tracking-tight">
      <div className="absolute top-0 left-0 w-full h-[3px] bg-[#16C784]"></div>
      
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-[22px] font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EAF8F2] flex items-center justify-center">
              <Trophy className="w-5 h-5 text-[#16C784]" />
            </div>
            Confidence Score
          </h3>
          <p className="text-[15px] font-medium text-gray-500 mt-2">Overall Performance</p>
        </div>
      </div>
      
      <div className="h-[200px] w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart 
            cx="50%" 
            cy="50%" 
            innerRadius="75%" 
            outerRadius="100%" 
            barSize={20} 
            data={data} 
            startAngle={180} 
            endAngle={0}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
            <RadialBar
              background={{ fill: '#FAFBFA' }}
              dataKey="value"
              cornerRadius={10}
              fill="#16C784"
            />
          </RadialBarChart>
        </ResponsiveContainer>
        
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
          <span className="text-[56px] font-black text-gray-900 tracking-tighter leading-none">{score}</span>
          <span className="text-[13px] text-gray-400 font-bold uppercase tracking-widest mt-1">/ 100</span>
        </div>
      </div>

      <div className="mt-[-20px] text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#EAF8F2] text-[#16C784] font-bold uppercase tracking-widest text-[12px] shadow-sm border border-[#2BCB8A]/30">
          {getSocialProof(score)}
        </div>
      </div>
    </div>
  );
};

export default ConfidenceGauge;
