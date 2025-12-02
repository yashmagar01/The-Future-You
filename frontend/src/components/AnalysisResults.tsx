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

const AnalysisResults: React.FC<AnalysisResultsProps> = ({ analysis = DEFAULT_ANALYSIS }) => {
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
    { time: '0:00', score: 30, label: 'Neutral' },
    { time: '0:10', score: 45, label: 'Positive' },
    { time: '0:20', score: 60, label: 'Positive' },
    { time: '0:30', score: 80, label: 'High Energy' },
    { time: '0:40', score: 50, label: 'Neutral' },
    { time: '0:50', score: 20, label: 'Concern' },
    { time: '1:00', score: 40, label: 'Neutral' },
    { time: '1:10', score: 70, label: 'Positive' },
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
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 h-full">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              Key Takeaways
            </h3>
            <ul className="space-y-3">
              {mockTakeaways.map((takeaway, idx) => (
                <li key={idx} className="flex gap-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                  <span className="text-teal-500 font-bold">•</span>
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

    </div>
  );
};

export default AnalysisResults;
