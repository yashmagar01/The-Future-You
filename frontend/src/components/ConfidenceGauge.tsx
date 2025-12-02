import React from 'react';
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { Trophy } from 'lucide-react';

interface ConfidenceGaugeProps {
  score: number;
}

const ConfidenceGauge: React.FC<ConfidenceGaugeProps> = ({ score }) => {
  const data = [{ name: 'Confidence', value: score, fill: '#10b981' }]; // Brand green

  // Determine social proof text based on score
  const getSocialProof = (s: number) => {
    if (s >= 90) return "Top 5% of speakers";
            outerRadius="100%" 
            barSize={20} 
            data={data} 
            startAngle={180} 
            endAngle={0}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
            <RadialBar
              background={{ fill: '#f3f4f6' }}
              dataKey="value"
              cornerRadius={10}
              fill="#10b981"
            />
          </RadialBarChart>
        </ResponsiveContainer>
        
        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
          <span className="text-5xl font-black text-gray-900 tracking-tight">{score}</span>
          <span className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">/ 100</span>
        </div>
      </div>

      <div className="mt-[-20px] text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-sm font-semibold">
          {getSocialProof(score)}
        </div>
      </div>
    </div>
  );
};

export default ConfidenceGauge;
