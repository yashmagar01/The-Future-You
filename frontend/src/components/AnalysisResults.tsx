import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle, AlertCircle, Mic, Activity, User, FileText, Zap, TrendingUp, TrendingDown, Play, Pause, Volume2, Maximize2 } from 'lucide-react';
import PacingGraph from './PacingGraph';
import StructureAnalysis from './StructureAnalysis';
import MetricCard, { DetailItem } from './MetricCard';
import ConfidenceGauge from './ConfidenceGauge';
import SentimentGraph from './SentimentGraph';
import AICoach from './AICoach';
import confetti from 'canvas-confetti';
import CoherenceGraph from './CoherenceGraph';
import AuthenticityStatus from './AuthenticityStatus';
import ConfidenceWave from './ConfidenceWave';

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
  score: string; // e.g., "Positive", "Confident", "Joy"
  confidence_level?: string;
  structure_score?: number;
  emotions?: { label: string; confidence: number }[];
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

export interface AdvancedMetrics {
  coherence?: {
    flow_score: number;
    coherence_timeline: number[];
  };
  fusion?: {
    incongruence_index: number;
    authenticity_warning: boolean;
    normalized_scores: {
      pitch_stability: number;
      voice_quality: number;
      text_sentiment: number;
      body_openness: number;
    };
  };
  // Phase 3 Extensions
  audio?: {
    pitch_timeline?: number[];
  };
  video?: {
    gesture_timeline?: number[];
  };
}

export interface AnalysisData {
  video_id?: string;
  created_at?: string;
  overall_score: number;
  metrics: AnalysisMetrics;
  advanced_metrics?: AdvancedMetrics;
  transcript_summary?: string;
}

interface AnalysisResultsProps {
  analysis?: AnalysisData;
  onSeek?: (time: number) => void;
  videoNode?: React.ReactNode;
  transcriptNode?: React.ReactNode;
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
  if (score >= 60) return 'average';
  return 'needs-work';
};

// Helper: Generate Coach Advice based on metrics
const getCoachAdvice = (metrics: AnalysisMetrics, advanced?: AdvancedMetrics): string[] => {
  const advice: string[] = [];

  // 1. Incongruence / Authenticity
  if (advanced?.fusion) {
    if (advanced.fusion.authenticity_warning) {
      advice.push("We detected a mismatch between your tone and your words. Try to align your facial expressions with your message.");
    } else if (advanced.fusion.incongruence_index < 0.05) {
      advice.push("Your delivery was incredibly authentic! Your voice, body, and words were perfectly aligned.");
    }
  }

  // 2. Coherence / Logic Flow
  if (advanced?.coherence) {
    const score = advanced.coherence.flow_score;
    if (score > 0.8) {
      advice.push("Your logical flow was excellent. Ideas connected smoothly from one to the next.");
    } else if (score < 0.4) {
      advice.push("The logical connection between sentences seemed a bit loose. Try using more transition words.");
    }
  }

  // 3. Clarity & Pacing
  if (metrics.clarity.score > 90) {
    advice.push("Crystal clear delivery! You minimized filler words effectively.");
  } else if (metrics.clarity.filler_word_count > 5) {
    advice.push(`We caught a few filler words (${metrics.clarity.filler_word_count}). Pausing is better than saying 'um'.`);
  }

  if (metrics.pacing && metrics.pacing.score < 60) {
    advice.push(metrics.pacing.feedback || "Watch your pacing. Try to keep a steady rhythm.");
  }

  // Fallback defaults if analysis is sparse
  if (advice.length === 0) {
    advice.push("Great effort! Keep practicing to improve your confidence score.");
    advice.push("Focus on maintaining strong eye contact throughout your recording.");
    advice.push("Try to vary your pitch to keep the audience engaged.");
  }

  return advice.slice(0, 4); // Return top 4 tips
};

const AnalysisResults: React.FC<AnalysisResultsProps> = ({ analysis = DEFAULT_ANALYSIS, onSeek, videoNode, transcriptNode }) => {
  const { overall_score, metrics, advanced_metrics, transcript_summary } = analysis;
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

  // Dynamic AI Coach Data
  const takeaways = getCoachAdvice(metrics, advanced_metrics);

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
    <div className="space-y-7 animate-in fade-in duration-500 font-sans tracking-tight">
      
      {/* SECTION 1: HERO (Video | Confidence | Takeaways) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Left: Video Player */}
        <div className="col-span-1 h-full">
          {videoNode}
        </div>

        {/* Center: Confidence Score */}
        <div className="col-span-1">
          <ConfidenceGauge score={overall_score} />
        </div>

        {/* Right: Key Takeaways */}
        <div className="col-span-1 border border-[#E8F0EC] shadow-sm rounded-[20px] bg-white p-5 lg:p-6 h-full">
          <h3 className="font-bold text-gray-900 mb-5 flex items-center gap-2 text-lg">
            <div className="w-8 h-8 rounded-full bg-[#EAF8F2] flex items-center justify-center">
              <Zap className="w-4 h-4 text-[#16C784]" />
            </div>
            Key Takeaways
          </h3>
          <ul className="space-y-3">
            {takeaways.map((takeaway, idx) => (
              <li key={idx} className="flex gap-3 text-[15px] font-medium text-gray-700 bg-gray-50/50 p-3 rounded-xl border border-gray-100 items-start">
                <span className="text-[#16C784] font-black mt-0.5">•</span>
                <span className="leading-snug">{takeaway}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* SECTION 1.5: ADVANCED INSIGHTS (Phase 2 & 3 extensions, optional for now, we'll keep them flowing naturally if they exist) */}
      {advanced_metrics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {advanced_metrics.coherence && (
            <div className="h-[250px] bg-white rounded-[20px] border border-[#E8F0EC] shadow-sm overflow-hidden">
               <CoherenceGraph 
                  timeline={advanced_metrics.coherence.coherence_timeline} 
                  averageScore={advanced_metrics.coherence.flow_score}
               />
            </div>
          )}
          {advanced_metrics.fusion && (
             <div className="h-[250px] bg-white rounded-[20px] border border-[#E8F0EC] shadow-sm overflow-hidden">
                <AuthenticityStatus 
                  incongruenceIndex={advanced_metrics.fusion.incongruence_index}
                  hasWarning={advanced_metrics.fusion.authenticity_warning}
                  breakdown={advanced_metrics.fusion.normalized_scores}
                />
             </div>
          )}
        </div>
      )}

      {/* SECTION 2: CORE METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <MetricCard
          icon={<Mic className="w-5 h-5 text-[#7C6BFF]" />}
          title="Clarity"
          score={metrics.clarity.score}
          status={getMetricStatus(metrics.clarity.score)}
          details={[
            { label: 'WPM', value: metrics.clarity.wpm, unit: 'wpm' },
            { label: 'Fillers', value: metrics.clarity.filler_word_count, good: metrics.clarity.filler_word_count < 5 }
          ]}
        />
        <MetricCard
          icon={<Activity className="w-5 h-5 text-blue-500" />}
          title="Pacing"
          score={metrics.pacing?.score || 0}
          status={getMetricStatus(metrics.pacing?.score || 0)}
          details={[
            { label: 'Pace', value: 'Steady', good: true },
          ]}
        />
        <MetricCard
          icon={<User className="w-5 h-5 text-amber-500" />}
          title="Posture"
          score={metrics.posture?.score || 0}
          status={getMetricStatus(metrics.posture?.score || 0)}
          details={[
            { label: 'Eye Contact', value: 'Good', good: true },
          ]}
        />
      </div>

      {/* SECTION 3: SENTIMENT & TRANSCRIPT (45/55 split) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-5 flex flex-col h-[500px]">
          {transcriptNode}
        </div>
        <div className="lg:col-span-7 bg-white rounded-[20px] border border-[#E8F0EC] shadow-sm h-[500px]">
          <SentimentGraph 
            data={mockSentimentData} 
            dominantEmotion={metrics.sentiment?.score || 'Neutral'}
            emotions={metrics.sentiment?.emotions || []}
          />
        </div>
      </div>

      {/* SECTION 4: THOUGHT STRUCTURE */}
      <div className="w-full bg-white rounded-[20px] border border-[#E8F0EC] shadow-sm">
        <StructureAnalysis score={metrics.structure_score || 0} />
      </div>

      {/* SECTION 5: ACTIONABLE FIXES */}
      <div className="bg-[#FAFBFA] rounded-[20px] border border-[#E8F0EC] shadow-sm p-6 lg:p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-gray-900 flex items-center gap-3 text-[22px]">
            <div className="bg-[#FEF2F2] p-2 rounded-xl">
              <Zap className="w-5 h-5 text-[#EF4444]" />
            </div>
            Actionable Fixes
          </h3>
          <span className="text-[13px] text-[#EF4444] font-bold bg-white px-3 py-1.5 rounded-full border border-red-100 shadow-sm transition-all duration-200 uppercase tracking-widest">
            {mockActionItems.filter(i => !i.completed).length} Priority
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {mockActionItems.map((item) => (
            <div 
              key={item.id} 
              className="group bg-white border border-[#E8F0EC] shadow-sm hover:shadow-md transition-all duration-200 rounded-[20px] p-5 lg:p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-4">
                  <span className={`text-[12px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ${
                    item.completed ? 'text-[#16C784] bg-[#EAF8F2]' : 'text-[#EF4444] bg-[#FEF2F2]'
                  }`}>
                    Fix #{item.id}
                  </span>
                  {item.completed ? (
                    <CheckCircle className="w-5 h-5 text-[#16C784]" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-[#EF4444]" />
                  )}
                </div>
                <p className="text-[#111827] font-medium text-[15px] leading-relaxed mb-6">
                  {item.text}
                </p>
              </div>
              
              <button
                onClick={() => onSeek && onSeek(item.timestamp)}
                className={`w-full flex items-center justify-center gap-2 text-[14px] font-semibold py-3 rounded-xl transition-colors ${
                  item.completed 
                    ? 'text-[#16C784] bg-[#EAF8F2] hover:bg-[#D4F1E4]' 
                    : 'text-white bg-[#EF4444] hover:bg-red-600 shadow-sm'
                }`}
              >
                <Play className="w-4 h-4 fill-current" />
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
