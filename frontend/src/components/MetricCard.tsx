import React, { useState } from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { Check, ChevronDown, ChevronUp, Info } from 'lucide-react';

export interface DetailItem {
  label: string;
  value: string | number;
  unit?: string;
  tooltip?: string;
  good?: boolean;
}

export interface MetricCardProps {
  icon: React.ReactNode;
  title: string;
  score: number;
  maxScore?: number;
  status: 'excellent' | 'good' | 'average' | 'needs-work';
  details: DetailItem[];
  expandedContent?: React.ReactNode;
  onDrillDown?: () => void;
}

const getStatusColors = (status: MetricCardProps['status']) => {
  const colorMap = {
    excellent: {
      text: 'text-green-600',
      bg: 'bg-green-500',
      bgLight: 'bg-green-50',
      border: 'border-green-200',
      gradient: 'from-green-400 to-green-600',
      badge: 'bg-green-100 text-green-700',
    },
    good: {
      text: 'text-blue-600',
      bg: 'bg-blue-500',
      bgLight: 'bg-blue-50',
      border: 'border-blue-200',
      gradient: 'from-blue-400 to-blue-600',
      badge: 'bg-blue-100 text-blue-700',
    },
    average: {
      text: 'text-amber-600',
      bg: 'bg-amber-500',
      bgLight: 'bg-amber-50',
      border: 'border-amber-200',
      gradient: 'from-amber-400 to-amber-600',
      badge: 'bg-amber-100 text-amber-700',
    },
    'needs-work': {
      text: 'text-red-600',
      bg: 'bg-red-500',
      bgLight: 'bg-red-50',
      border: 'border-red-200',
      gradient: 'from-red-400 to-red-600',
      badge: 'bg-red-100 text-red-700',
    },
  };
  return colorMap[status];
};

const getStatusLabel = (status: MetricCardProps['status']) => {
  const labelMap = {
    excellent: 'Excellent',
    good: 'Good',
    average: 'Average',
    'needs-work': 'Needs Work',
  };
  return labelMap[status];
};

const getScoreColor = (score: number) => {
  if (score >= 90) return 'text-green-600';
  if (score >= 75) return 'text-blue-600';
  if (score >= 60) return 'text-amber-600';
  return 'text-red-600';
};

const MetricCard: React.FC<MetricCardProps> = ({
  icon,
  title,
  score,
  maxScore = 100,
  status,
  details,
  expandedContent,
  onDrillDown,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const colors = getStatusColors(status);
  const percentage = (score / maxScore) * 100;

  const getStatusStyles = (status: 'excellent' | 'good' | 'average' | 'needs-work') => {
    switch (status) {
      case 'excellent':
        return {
          bg: 'bg-white',
          border: 'border-[#E8F0EC]',
          accent: 'bg-[#16C784]',
          text: 'text-[#16C784]'
        };
      case 'good':
        return {
          bg: 'bg-white',
          border: 'border-[#E8F0EC]',
          accent: 'bg-[#16C784]',
          text: 'text-[#16C784]'
        };
      case 'average':
        return {
          bg: 'bg-white',
          border: 'border-[#E8F0EC]',
          accent: 'bg-amber-500',
          text: 'text-amber-600'
        };
      case 'needs-work':
        return {
          bg: 'bg-white',
          border: 'border-[#E8F0EC]',
          accent: 'bg-[#EF4444]',
          text: 'text-[#EF4444]'
        };
      default:
        return {
          bg: 'bg-white',
          border: 'border-[#E8F0EC]',
          accent: 'bg-gray-400',
          text: 'text-gray-700'
        };
    }
  };

  const styles = getStatusStyles(status);

  return (
    <Tooltip.Provider>
      <div className={`rounded-[20px] border ${styles.border} shadow-sm ${styles.bg} p-6 relative overflow-hidden transition-all duration-300 hover:shadow-md h-full flex flex-col justify-between`}>
        <div className={`absolute top-0 left-0 w-full h-[2px] ${styles.accent}`}></div>

        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50/50 border border-gray-100 ${styles.text}`}>
              {icon}
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg leading-tight">{title}</h3>
              <span className={`text-[11px] font-bold uppercase tracking-widest ${styles.text}`}>
                {status.replace('-', ' ')}
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className={`text-[32px] leading-none font-black ${getScoreColor(score)}`}>
              {score}
            </span>
          </div>
        </div>

        <div className="w-full bg-[#FAFBFA] rounded-full h-[6px] mb-6 overflow-hidden border border-[#E8F0EC]">
          <div
            className={`h-full bg-gradient-to-r ${colors.gradient} rounded-full transition-all duration-1500 ease-out`}
            style={{ width: `${percentage}%` }}
          />
        </div>

        <div className="mt-auto space-y-2">
          {details.map((detail, idx) => (
            <Tooltip.Root key={idx} delayDuration={300}>
              <Tooltip.Trigger asChild>
                <div className="flex justify-between items-center text-sm group/detail p-2.5 rounded-xl border border-transparent hover:border-gray-100 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 font-medium text-[15px]">{detail.label}</span>
                    {detail.tooltip && (
                      <Info className="w-3.5 h-3.5 text-gray-400 opacity-0 group-hover/detail:opacity-100 transition-opacity" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900 text-[15px]">
                      {detail.value}
                      {detail.unit && <span className="text-gray-500 ml-1 font-normal text-[13px]">{detail.unit}</span>}
                    </span>
                    {detail.good && (
                      <Check className="w-4 h-4 text-[#16C784]" strokeWidth={3} />
                    )}
                  </div>
                </div>
              </Tooltip.Trigger>
              {detail.tooltip && (
                <Tooltip.Portal>
                  <Tooltip.Content
                    className="bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg max-w-xs z-50"
                    sideOffset={5}
                  >
                    {detail.tooltip}
                    <Tooltip.Arrow className="fill-gray-900" />
                  </Tooltip.Content>
                </Tooltip.Portal>
              )}
            </Tooltip.Root>
          ))}
        </div>

        {expandedContent && (
          <button
            className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            <span>{isExpanded ? 'Show Less' : 'View Details'}</span>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        )}

        {isExpanded && expandedContent && (
          <div className="mt-4 pt-4 border-t border-gray-100 animate-in slide-in-from-top-2 fade-in duration-300">
            {expandedContent}
          </div>
        )}

        {onDrillDown && (
          <button
            className={`mt-4 w-full py-2 rounded-lg text-sm font-medium transition-colors ${colors.bgLight} ${colors.text} hover:${colors.bg} hover:text-white`}
            onClick={(e) => {
              e.stopPropagation();
              onDrillDown();
            }}
          >
            View Full Report
          </button>
        )}
      </div>
    </Tooltip.Provider>
  );
};

export default MetricCard;
