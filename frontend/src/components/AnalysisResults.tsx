import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle, AlertCircle, Mic, Activity, User, FileText, Zap, TrendingUp, TrendingDown, Play, Pause, Volume2, Maximize2 } from 'lucide-react';
import PacingGraph from './PacingGraph';
import StructureAnalysis from './StructureAnalysis';
import MetricCard, { DetailItem } from './MetricCard';
import TranscriptViewer from './TranscriptViewer';
import ConfidenceGauge from './ConfidenceGauge';
import SentimentGraph from './SentimentGraph';
import AICoach from './AICoach';
import confetti from 'canvas-confetti';

// --- Types based on the "Golden JSON" Schema ---

interface ClarityMetrics {
  score: number;
  wpm: number;
  filler_word_count: number;
  filler_words_detected?: string[];
}

interface PacingMetrics {
  score: number;
  feedback: string;
  words_per_minute?: number;
}

interface SentimentMetrics {
  score: string; // e.g., "Positive", "Confident"
  confidence_level?: string;
}

interface PostureMetrics {
  score: number;
  issues_detected?: string[];
}

export interface AnalysisMetrics {
  clarity: ClarityMetrics;
  pacing?: PacingMetrics;
  sentiment?: SentimentMetrics;
  posture?: PostureMetrics;
  structure_score?: number;
  timeline?: { time: string; wpm: number }[];
}

export interface AnalysisData {
  video_id?: string;
  created_at?: string;
  overall_score: number;
  metrics: AnalysisMetrics;
  transcript_summary?: string;
}

interface AnalysisResultsProps {
  analysis?: AnalysisData;
}

// --- Default Mock Data ---
const DEFAULT_ANALYSIS: AnalysisData = {
  overall_score: 82,
  metrics: {
    clarity: { 
      score: 85, 
      wpm: 130, 
      filler_word_count: 3,
      filler_words_detected: ["um", "like"]
    },
    pacing: {
      score: 80,
      feedback: "Perfect pace. You spoke clearly without rushing."
    },
    sentiment: { 
      score: "Confident",
      confidence_level: "High"
    },
    posture: { 
      score: 90,
      issues_detected: []
    },
    structure_score: 75,
    timeline: [
      { time: "0-5s", wpm: 120 },
      { time: "5-10s", wpm: 145 },
      { time: "10-15s", wpm: 135 },
      { time: "15-20s", wpm: 155 },
      { time: "20-25s", wpm: 110 },
      { time: "25-30s", wpm: 140 },
    ]
  },
  transcript_summary: "You discussed your goals for the year with a clear focus on personal growth."
};

// --- Helper Functions ---

const getScoreColor = (score: number) => {
  if (score >= 80) return "text-green-500";
  if (score >= 50) return "text-yellow-500";
  return "text-red-500";
};

const getScoreBg = (score: number) => {
  if (score >= 80) return "bg-green-50 border-green-200";
  if (score >= 50) return "bg-yellow-50 border-yellow-200";
  return "bg-red-50 border-red-200";
};

const getProgressColor = (score: number) => {
  if (score >= 80) return "bg-green-500";
  if (score >= 50) return "bg-yellow-500";
  return "bg-red-500";
};

// Helper to determine status for MetricCard
const getMetricStatus = (score: number): 'excellent' | 'good' | 'average' | 'needs-work' => {
  if (score >= 80) return 'excellent';
  if (score >= 70) return 'good';
  if (score >= 60) return 'average';
  return 'needs-work';
};

// --- Components ---

const ScoreCard = ({ title, score, icon: Icon, children }: { title: string, score: number, icon: any, children?: React.ReactNode }) => (
  <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col h-full">
    <div className="flex justify-between items-start mb-4">
      <div className="flex items-center gap-2">
        <div className="p-2 bg-gray-50 rounded-lg text-gray-600">
          <Icon size={20} />
        </div>
        <h3 className="font-semibold text-gray-700">{title}</h3>
      </div>
      <span className={`text-xl font-bold ${getScoreColor(score)}`}>{score}</span>
    </div>
    
    {/* Progress Bar */}
    <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
      <div 
        className={`h-2 rounded-full transition-all duration-1000 ${getProgressColor(score)}`} 
        style={{ width: `${score}%` }}
      />
    </div>

          <div className="flex items-center gap-4">
            <div className="px-4 py-2 bg-purple-100 text-purple-700 rounded-full font-medium">
              {metrics.sentiment?.score || "Neutral"}
            </div>
            {metrics.sentiment?.confidence_level && (
              <span className="text-sm text-gray-500">
                Confidence: {metrics.sentiment.confidence_level}
              </span>
            )}
          </div>
        </div>

        {/* Transcript */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-gray-100 col-span-1 md:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <FileText size={20} />
            </div>
            <h3 className="font-semibold text-gray-700">Transcript</h3>
          </div>
          <div className="max-h-96 overflow-y-auto pr-2 custom-scrollbar">
            <p className="text-gray-700 text-sm leading-loose whitespace-pre-wrap capitalize">
              {transcript_summary || "No transcript available for this session."}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AnalysisResults;
