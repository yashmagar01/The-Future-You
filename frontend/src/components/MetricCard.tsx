import React, { useState } from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { Check, ChevronDown, ChevronUp, Info } from 'lucide-react';

// Types
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

// Helper to get color classes based on status
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

  return (
    <Tooltip.Provider>
      <article
        className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-md border border-gray-100 flex flex-col h-full transition-all duration-200 hover:shadow-xl hover:-translate-y-1 cursor-pointer group"
        onClick={() => expandedContent && setIsExpanded(!isExpanded)}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-label={`${title} metric card, score ${score} out of ${maxScore}`}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 ${colors.bgLight} rounded-lg ${colors.text} transition-transform group-hover:scale-110`}>
              {icon}
            </div>
            <h3 className="font-semibold text-gray-800 text-lg">{title}</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-4xl font-bold ${colors.text} transition-all`}>
              {score}
            </span>
          </div>
        </div>

        {/* Status Badge */}
        <div className="mb-4">
          <span className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-semibold uppercase tracking-wide ${colors.badge}`}>
            {getStatusLabel(status)}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-100 rounded-full h-3 mb-6 overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${colors.gradient} rounded-full transition-all duration-1500 ease-out-cubic relative`}
            style={{ width: `${percentage}%` }}
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
          </div>
        </div>

        {/* Details */}
        <div className="mt-auto space-y-3">
          {details.map((detail, idx) => (
            <Tooltip.Root key={idx} delayDuration={300}>
              <Tooltip.Trigger asChild>
                <div className="flex justify-between items-center text-sm group/detail hover:bg-gray-50 p-2 rounded-lg transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">{detail.label}</span>
                    {detail.tooltip && (
                      <Info className="w-3 h-3 text-gray-400 opacity-0 group-hover/detail:opacity-100 transition-opacity" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">
                      {detail.value}
                      {detail.unit && <span className="text-gray-500 ml-1 font-normal">{detail.unit}</span>}
                    </span>
                    {detail.good && (
                      <Check className="w-4 h-4 text-green-500" />
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

        {/* Expand/Collapse Button */}
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

        {/* Expanded Content */}
        {isExpanded && expandedContent && (
          <div className="mt-4 pt-4 border-t border-gray-100 animate-in slide-in-from-top-2 fade-in duration-300">
            {expandedContent}
          </div>
        )}

        {/* Drill Down Action */}
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
      </article>
    </Tooltip.Provider>
  );
};

export default MetricCard;
