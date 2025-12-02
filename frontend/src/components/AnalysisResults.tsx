import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle, AlertCircle, Mic, Activity, User, FileText, Zap, TrendingUp, TrendingDown, Play, Pause, Volume2, Maximize2 } from 'lucide-react';
import PacingGraph from './PacingGraph';
import StructureAnalysis from './StructureAnalysis';
import MetricCard, { DetailItem } from './MetricCard';
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
  onSeek?: (time: number) => void;
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

// Helper to determine status for MetricCard
const getMetricStatus = (score: number): 'excellent' | 'good' | 'average' | 'needs-work' => {
  if (score >= 80) return 'excellent';
  if (score >= 70) return 'good';
  if (score >= 60) return 'average';
  return 'needs-work';
};

const AnalysisResults: React.FC<AnalysisResultsProps> = ({ analysis = DEFAULT_ANALYSIS, onSeek }) => {
  const { overall_score, metrics, transcript_summary } = analysis;
  const [displayScore, setDisplayScore] = useState(0);
  const confettiTriggered = useRef(false);

  // Helper to get gradient colors based on score
  const getGradientColors = (score: number) => {
    if (score >= 80) return { start: '#10b981', end: '#059669' }; // Green
    if (score >= 60) return { start: '#3b82f6', end: '#2563eb' }; // Blue
    if (score >= 40) return { start: '#f59e0b', end: '#d97706' }; // Amber
    return { start: '#ef4444', end: '#dc2626' }; // Red
  };

  const gradientColors = getGradientColors(overall_score);

  // Mock Sentiment Data
  const mockSentimentData = [
    { time: '0:00', score: 30, label: 'Neutral', phrase: "Alright, uh, today..." },
    { time: '0:10', score: 45, label: 'Positive', phrase: "meme that we love" },
    { time: '0:20', score: 60, label: 'Positive', phrase: "super intelligent" },
    { time: '0:30', score: 80, label: 'High Energy', phrase: "really smart" },
    { time: '0:40', score: 50, label: 'Neutral', phrase: "launch something quickly" },
    { time: '0:50', score: 20, label: 'Concern', phrase: "wrong answer is to do" },
    { time: '1:00', score: 40, label: 'Neutral', phrase: "distract yourself" },
    { time: '1:10', score: 70, label: 'Positive', phrase: "start learning" },
  ];

  // Mock AI Coach Data
  const mockTakeaways = [
    "You started strong with a clear hook about the 'Midwitt Meme'.",
    "Great use of contrast between the 'Jedi' and the 'Idiot' founders.",
    "The conclusion about 'launching quickly' was delivered with high conviction."
  ];

  const mockActionItems = [
    { id: '1', text: "Replace 'actually' with a pause for emphasis.", timestamp: 35, completed: false },
    { id: '2', text: "Slow down when explaining the 'wrong answer' list.", timestamp: 50, completed: false },
    { id: '3', text: "Maintain eye contact during the transition.", timestamp: 12, completed: true },
  ];

  // Trigger confetti for high scores
  useEffect(() => {
    if (overall_score >= 80 && !confettiTriggered.current) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#3b82f6', '#8b5cf6'],
        ticks: 300,
      });
      confettiTriggered.current = true;
    }
  }, [overall_score]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* SECTION 1: OVERALL PERFORMANCE & KEY TAKEAWAYS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Confidence Score */}
        <div className="lg:col-span-5">
          <ConfidenceGauge score={overall_score} />
        </div>

        {/* Key Takeaways */}
        <div className="lg:col-span-7">
          <div className="bg-[#f7fdf9] rounded-2xl border border-[rgba(16,185,129,0.12)] border-l-4 border-l-[#10b981] shadow-[0_4px_24px_rgba(0,0,0,0.04)] p-8 h-full">
            <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2 text-lg">
              <Zap className="w-5 h-5 text-[#10b981]" />
              Key Takeaways
            </h3>
            <ul className="space-y-4">
              {mockTakeaways.map((takeaway, idx) => (
                <li key={idx} className="flex gap-3 text-base text-gray-700 bg-white/60 p-3 rounded-lg border border-[#10b981]/10">
                  <span className="text-[#10b981] font-bold">•</span>
                  {takeaway}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* SECTION 2: CORE METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          icon={<Mic className="w-5 h-5" />}
          title="Clarity"
          score={metrics.clarity.score}
          status={getMetricStatus(metrics.clarity.score)}
          details={[
            { label: 'WPM', value: metrics.clarity.wpm, unit: 'words/min' },
            { label: 'Fillers', value: metrics.clarity.filler_word_count, good: metrics.clarity.filler_word_count < 5 }
          ]}
        />
        <MetricCard
          icon={<Activity className="w-5 h-5" />}
          title="Pacing"
          score={metrics.pacing?.score || 0}
          status={getMetricStatus(metrics.pacing?.score || 0)}
          details={[
            { label: 'Pace', value: 'Steady', good: true },
          ]}
        />
        <MetricCard
          icon={<User className="w-5 h-5" />}
          title="Posture"
          score={metrics.posture?.score || 0}
          status={getMetricStatus(metrics.posture?.score || 0)}
          details={[
            { label: 'Eye Contact', value: 'Good', good: true },
          ]}
        />
      </div>

      {/* SECTION 3: SENTIMENT & STRUCTURE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SentimentGraph data={mockSentimentData} />
        <StructureAnalysis score={metrics.structure_score || 0} />
      </div>

      {/* SECTION 4: ACTIONABLE FIXES (New) */}
      <div className="bg-[#fef2f2] rounded-2xl border border-[rgba(239,68,68,0.15)] shadow-[0_4px_24px_rgba(0,0,0,0.05)] p-8">
        <div className="flex items-center justify-between mb-8">
          <h3 className="font-bold text-gray-900 flex items-center gap-3 text-xl">
            <div className="bg-[rgba(239,68,68,0.1)] p-2 rounded-lg">
              <Zap className="w-6 h-6 text-red-600" />
            </div>
            Actionable Fixes
          </h3>
          <span className="text-sm text-red-700 font-bold bg-white px-4 py-1.5 rounded-full border border-red-100 shadow-sm">
            {mockActionItems.filter(i => !i.completed).length} Priority Items
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockActionItems.map((item) => (
            <div 
              key={item.id} 
              className="group bg-white hover:bg-[#fff5f5] border border-[rgba(239,68,68,0.1)] hover:border-[rgba(239,68,68,0.3)] shadow-sm hover:shadow-md transition-all duration-200 rounded-xl p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-red-400 bg-red-50 px-2 py-1 rounded">
                    Fix #{item.id}
                  </span>
                  {item.completed ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  )}
                </div>
                <p className="text-gray-900 font-medium text-base leading-relaxed mb-6">
                  "{item.text}"
                </p>
              </div>
              
              <button
                onClick={() => onSeek && onSeek(item.timestamp)}
                className="w-full flex items-center justify-center gap-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 py-3 rounded-lg transition-colors"
              >
                <Play className="w-3 h-3 fill-current" />
                Jump to {Math.floor(item.timestamp / 60)}:{(item.timestamp % 60).toString().padStart(2, '0')}
              </button>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default AnalysisResults;
