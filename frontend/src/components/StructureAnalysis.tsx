import React, { useState } from 'react';
import { Brain, CheckCircle, AlertCircle, HelpCircle, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Sparkles } from 'lucide-react';

interface StructureAnalysisProps {
  score: number;
  previousScore?: number;
  details?: {
    sentenceLength?: number;
    transitions?: number;
    fillerPhrases?: number;
  };
}

const StructureAnalysis: React.FC<StructureAnalysisProps> = ({ 
  score, 
  previousScore,
  details = {}
}) => {
  const [expanded, setExpanded] = useState(true);

  let zone = 'Rambling';
  let colorClasses = {
    bg: 'bg-red-500',
    text: 'text-red-600',
    bgLight: 'bg-red-50',
    border: 'border-red-200',
    gradient: 'from-red-400 to-red-600',
  };
  let icon = <AlertCircle className="w-6 h-6 text-red-500" />;
  let feedback = "Try shorter sentences and clearer transitions.";
  let tips = [
    "Break long sentences into 2-3 shorter ones",
    "Use transitional phrases like 'However', 'Moreover', 'Furthermore'",
    "Aim for 12-15 words per sentence on average"
  ];

  if (score >= 80) {
    zone = 'Crystal Clear';
    colorClasses = {
      bg: 'bg-green-500',
      text: 'text-green-600',
      bgLight: 'bg-green-50',
      border: 'border-green-200',
      gradient: 'from-green-400 to-green-600',
    };
    icon = <CheckCircle className="w-6 h-6 text-green-500" />;
    feedback = "Great logical flow! Your points connect well.";
    tips = [
      "Maintain this excellent structure",
      "Your transitions are smooth and natural",
      "Keep using clear, concise language"
    ];
  } else if (score >= 60) {
    zone = 'Followable';
    colorClasses = {
      bg: 'bg-yellow-500',
      text: 'text-yellow-600',
      bgLight: 'bg-yellow-50',
      border: 'border-yellow-200',
      gradient: 'from-yellow-400 to-yellow-600',
    };
    icon = <HelpCircle className="w-6 h-6 text-yellow-500" />;
    feedback = "Good structure, but watch out for tangents.";
    tips = [
      "Reduce tangential thoughts by 20-30%",
      "Add transitions between major topics",
      "Tighten sentence structure slightly"
    ];
  }

  const change = previousScore ? score - previousScore : 0;
  const changePercent = previousScore ? ((change / previousScore) * 100).toFixed(1) : '0';

  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="bg-white rounded-[20px] p-6 lg:p-8 relative overflow-hidden font-sans tracking-tight">
      <div className="absolute top-0 left-0 w-full h-[3px] bg-[#16C784]"></div>

      <div className="flex justify-between items-start mb-10">
        <div>
          <h3 className="text-[22px] font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EAF8F2] flex items-center justify-center">
              <Brain className="w-5 h-5 text-[#16C784]" />
            </div>
            Thought Structure
          </h3>
          <p className="text-[15px] font-medium text-gray-500 mt-2">Coherence & Logic Flow</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-10 mb-8">
        <div className="relative w-48 h-48 flex-shrink-0 mx-auto md:mx-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
            <circle
              cx="80"
              cy="80"
              r={radius}
              stroke="#FAFBFA"
              strokeWidth="10"
              fill="transparent"
            />
            
            <circle
              cx="80"
              cy="80"
              r={radius}
              stroke={score >= 80 ? '#16C784' : score >= 60 ? '#F59E0B' : '#EF4444'}
              strokeWidth="10"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="transition-all duration-2000 ease-out"
            />
          </svg>
          
          <div className="absolute inset-0 flex flex-col items-center justify-center pb-2">
            <span className={`text-[46px] font-black tracking-tighter ${colorClasses.text}`}>
              {score}
            </span>
          </div>
        </div>

        <div className="flex-1 text-center md:text-left">
          <div className={`inline-flex flex-col md:flex-row md:items-center gap-3 mb-5`}>
            <span className={`text-[24px] font-black ${colorClasses.text}`}>{zone}</span>
            <span className={`px-3 py-1 text-[13px] font-bold rounded-lg ${colorClasses.bgLight} ${colorClasses.text}`}>
              {icon} 
              <span className="ml-2 uppercase tracking-wide">Status Update</span>
            </span>
          </div>
          
          <div className="p-5 bg-[#FAFBFA] rounded-2xl border border-[#E8F0EC]">
            <p className="text-[16px] text-gray-700 font-medium leading-relaxed">
              "{feedback}"
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-[#E8F0EC] pt-8">
         <h4 className="font-bold text-gray-900 mb-6 flex items-center gap-2 text-[18px]">
           <Sparkles className="w-5 h-5 text-[#6366f1]" />
           Detailed Analysis
         </h4>
         
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column: Metrics */}
            <div className="space-y-6">
              <div className="bg-[#FAFBFA] border border-[#E8F0EC] p-5 rounded-2xl space-y-5">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[15px]">
                    <span className="text-gray-600 font-medium">Avg Sentence Length</span>
                    <span className="font-bold text-gray-900">
                      {details.sentenceLength || 18} words {details.sentenceLength && details.sentenceLength <= 15 ? '✓' : ''}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full bg-gradient-to-r ${colorClasses.gradient} transition-all duration-1000`}
                      style={{ width: `${Math.min(100, ((details.sentenceLength || 18) / 25) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[15px]">
                    <span className="text-gray-600 font-medium">Transition Words</span>
                    <span className="font-bold text-gray-900">
                      {details.transitions || 8} used {details.transitions && details.transitions >= 15 ? '✓' : ''}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full bg-gradient-to-r ${colorClasses.gradient} transition-all duration-1000`}
                      style={{ width: `${Math.min(100, ((details.transitions || 8) / 20) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[15px]">
                    <span className="text-gray-600 font-medium">Filler Phrases</span>
                    <span className="font-bold text-gray-900">
                      {details.fillerPhrases || 23} detected {details.fillerPhrases && details.fillerPhrases < 10 ? '✓' : ''}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#EF4444] transition-all duration-1000"
                      style={{ width: `${Math.min(100, ((details.fillerPhrases || 23) / 50) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Tips */}
            <div className="bg-[#EAF8F2] border border-[#2BCB8A]/30 rounded-2xl p-6 h-full">
              <h4 className="text-[15px] font-bold text-[#16C784] mb-4 uppercase tracking-widest">💡 Quick Tips</h4>
              <div className="space-y-4">
                {tips.map((tip, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-[15px] font-medium text-gray-800">
                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-[#16C784] flex-shrink-0" />
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default StructureAnalysis;
