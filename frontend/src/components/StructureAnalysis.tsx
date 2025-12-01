import React from 'react';
import { Brain, CheckCircle, AlertCircle, HelpCircle } from 'lucide-react';

interface StructureAnalysisProps {
  score: number;
}

const StructureAnalysis: React.FC<StructureAnalysisProps> = ({ score }) => {
  // Determine zone and color
  let zone = 'Rambling';
  let colorClass = 'bg-red-500';
  let textColorClass = 'text-red-600';
  let icon = <AlertCircle className="w-6 h-6 text-red-500" />;
  let feedback = "Try shorter sentences and clearer transitions.";

  if (score >= 80) {
    zone = 'Crystal Clear';
    colorClass = 'bg-green-500';
    textColorClass = 'text-green-600';
    icon = <CheckCircle className="w-6 h-6 text-green-500" />;
    feedback = "Great logical flow! Your points connect well.";
  } else if (score >= 60) {
    zone = 'Followable';
    colorClass = 'bg-yellow-500';
    textColorClass = 'text-yellow-600';
    icon = <HelpCircle className="w-6 h-6 text-yellow-500" />;
    feedback = "Good, but watch out for tangents.";
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col h-full justify-between">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-500" />
          Thought Structure
        </h3>
        {icon}
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-end mb-2">
          <span className={`text-2xl font-bold ${textColorClass}`}>{zone}</span>
          <span className="text-sm text-gray-500 font-medium">{score}/100</span>
        </div>
        
        {/* Progress Bar Background */}
        <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
          {/* Progress Bar Fill */}
          <div 
            className={`h-full rounded-full transition-all duration-1000 ease-out ${colorClass}`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>

      <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
        <p className="text-sm text-gray-600 italic">
          "{feedback}"
        </p>
      </div>
    </div>
  );
};

export default StructureAnalysis;
