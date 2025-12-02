import React, { useState } from 'react';
import { Brain, CheckCircle, AlertCircle, HelpCircle, ChevronDown, ChevronUp, TrendingUp, TrendingDown } from 'lucide-react';

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

  // Determine zone and color
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

  // Calculate change from previous
  const change = previousScore ? score - previousScore : 0;
  const changePercent = previousScore ? ((change / previousScore) * 100).toFixed(1) : '0';

              cy="80"
              r={radius}
              stroke="#e5e7eb"
              strokeWidth="12"
              fill="transparent"
            />
            
            {/* Progress circle with gradient */}
            <defs>
              <linearGradient id={`gradient-${score}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" className={colorClasses.bg.replace('bg-', 'stop-')} />
                <stop offset="100%" className={colorClasses.bg.replace('bg-', 'stop-')} style={{stopOpacity: 0.7}} />
              </linearGradient>
            </defs>
            
            <circle
              cx="80"
              cy="80"
              r={radius}
              stroke={score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444'}
              strokeWidth="12"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="transition-all duration-2000 ease-out"
              style={{
                filter: score >= 80 ? 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.5))' : '',
                transitionDuration: '2s'
              }}
            />
          </svg>
          
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-5xl font-bold ${colorClasses.text}`}>
              {score}
            </span>
            <span className="text-sm text-gray-400 font-semibold uppercase tracking-wider mt-1">
              / 100
            </span>
          </div>
        </div>

        {/* Zone Info */}
        <div className="flex-1 text-center md:text-left">
          <div className={`inline-flex items-center px-4 py-2 rounded-xl ${colorClasses.bgLight} ${colorClasses.border} border mb-4`}>
            <span className={`text-2xl font-bold ${colorClasses.text}`}>{zone}</span>
          </div>
          
          <div className={`p-4 ${colorClasses.bgLight} rounded-lg border ${colorClasses.border}`}>
            <p className="text-sm text-gray-600 italic leading-relaxed">
              "{feedback}"
            </p>
          </div>

          {/* Trend indicator */}
          {previousScore && (
            <div className="mt-4 flex items-center gap-2 text-sm">
              {change >= 0 ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500" />
              )}
              <span className={change >= 0 ? 'text-green-600' : 'text-red-600'}>
                {change >= 0 ? '+' : ''}{change} points ({change >= 0 ? '+' : ''}{changePercent}%)
              </span>
              <span className="text-gray-400">vs last session</span>
            </div>
          )}
        </div>
      </div>

      {/* Expandable Details */}
      <div className="border-t border-gray-100 pt-4">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
        >
          <span className="flex items-center gap-2">
            <Brain className="w-4 h-4" />
            Detailed Analysis
          </span>
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {expanded && (
          <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
            {/* Metrics Breakdown */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Avg Sentence Length</span>
                <span className="font-semibold text-gray-900">
                  {details.sentenceLength || 18} words {details.sentenceLength && details.sentenceLength <= 15 ? '✓' : ''}
                </span>
              </div>
              
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full bg-gradient-to-r ${colorClasses.gradient} transition-all duration-1000`}
                  style={{ width: `${Math.min(100, ((details.sentenceLength || 18) / 25) * 100)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Transition Words</span>
                <span className="font-semibold text-gray-900">
                  {details.transitions || 8} used {details.transitions && details.transitions >= 15 ? '✓' : ''}
                </span>
              </div>
              
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full bg-gradient-to-r ${colorClasses.gradient} transition-all duration-1000`}
                  style={{ width: `${Math.min(100, ((details.transitions || 8) / 20) * 100)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Filler Phrases</span>
                <span className="font-semibold text-gray-900">
                  {details.fillerPhrases || 23} detected {details.fillerPhrases && details.fillerPhrases < 10 ? '✓' : ''}
                </span>
              </div>
              
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-red-400 to-red-600 transition-all duration-1000"
                  style={{ width: `${Math.min(100, ((details.fillerPhrases || 23) / 50) * 100)}%` }}
                />
              </div>
            </div>

            {/* Action Items */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">💡 Quick Tips to Improve</h4>
              {tips.map((tip, idx) => (
                <div key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className={`mt-0.5 w-1.5 h-1.5 rounded-full ${colorClasses.bg} flex-shrink-0`} />
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StructureAnalysis;
