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

  // --- Mock Data for Glass Cockpit ---
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Mock Transcript
  const mockTranscript = [
    { time: 0, text: "Alright, uh, today I'd like to talk to you about how to build an MVP or a Minimum Viable Product." },
    { time: 5, text: "So if you haven't seen this before, this is a meme that we love to talk about when trying to help founders with their MVP." },
    { time: 12, text: "It's called the Midwitt Meme. The person who is the Jedi, the super intelligent, the founder who's doing all the best things and knows all the best things," },
    { time: 20, text: "and the idiot, the first time founder, the founder who has no idea what's going on." },
    { time: 25, text: "Many times, these two founders will actually come to the right decision before the founder who is really smart and is trying to work really hard and do everything right." },
    { time: 35, text: "And so, in this situation with the MVP, the best advice is to actually launch something quickly and iterate." },
    { time: 42, text: "Get a product into the hands of your customers and then learn whether it helps them or doesn't and then iterate it and improve it over time." },
    { time: 50, text: "The wrong answer is to do a hundred surveys and 600 user interviews and contact every single one of the competitors and spend a year fundraising and hire 100 people and all these other things that you can distract yourself with that it might appear like other smart things." },
    { time: 65, text: "But in reality, they really don't highlight the most important point about an MVP, which is you'd only really start learning when you put a product in front of a customer." },
  ];

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

  // Simulate video playing
  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime(prev => (prev >= 70 ? 0 : prev + 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const handleSeek = (time: number) => {
    setCurrentTime(time);
    setIsPlaying(true);
  };

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
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-8 font-sans text-gray-900">
      <div className="max-w-[1800px] mx-auto grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: THE STAGE (40%) */}
        <div className="xl:col-span-5 flex flex-col gap-6 sticky top-8">
          {/* Video Player Container */}
          <div className="bg-black rounded-2xl overflow-hidden shadow-2xl shadow-blue-900/20 aspect-video relative group border border-gray-800">
            {/* Placeholder for Video */}
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
              <span className="text-gray-500">Video Player Placeholder</span>
            </div>
            
            {/* Custom Controls Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
              {/* Heatmap Timeline */}
              <div className="h-1 bg-gray-600 rounded-full mb-4 relative cursor-pointer" onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const percent = (e.clientX - rect.left) / rect.width;
                handleSeek(percent * 70);
              }}>
                <div 
                  className="absolute top-0 left-0 h-full bg-blue-500 rounded-full" 
                  style={{ width: `${(currentTime / 70) * 100}%` }}
                />
                {/* Heatmap spots (mock) */}
                <div className="absolute top-0 left-[30%] w-[10%] h-full bg-yellow-500/50 blur-[1px]" />
                <div className="absolute top-0 left-[70%] w-[15%] h-full bg-red-500/50 blur-[1px]" />
              </div>

              <div className="flex justify-between items-center text-white">
                <button onClick={() => setIsPlaying(!isPlaying)} className="hover:text-blue-400">
                  {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                </button>
                <span className="text-xs font-mono">
                  {Math.floor(currentTime / 60)}:{(currentTime % 60).toString().padStart(2, '0')} / 1:10
                </span>
                <div className="flex gap-3">
                  <Volume2 size={18} />
                  <Maximize2 size={18} />
                </div>
              </div>
            </div>
          </div>

          {/* Synced Transcript */}
          <div className="flex-1 overflow-hidden">
            <TranscriptViewer 
              transcript={mockTranscript} 
              currentTime={currentTime} 
              onSeek={handleSeek} 
            />
          </div>
        </div>

        {/* MIDDLE COLUMN: THE METRICS LAB (35%) */}
        <div className="xl:col-span-4 flex flex-col gap-6">
          {/* Hero Card: Confidence */}
          <ConfidenceGauge score={overall_score} />

          {/* Pace & Tone Chart */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-800">Speaking Pace</h3>
              <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">Target: 130-150 WPM</span>
            </div>
            <PacingGraph data={metrics.timeline || []} />
          </div>

          {/* Sentiment Wave */}
          <SentimentGraph data={mockSentimentData} />

          {/* Metric Cards Grid (Compact) */}
          <div className="grid grid-cols-2 gap-4">
             <MetricCard
              icon={<Mic size={18} />}
              title="Clarity"
              score={metrics.clarity.score}
              status={getMetricStatus(metrics.clarity.score)}
              details={[]}
            />
             <MetricCard
              icon={<User size={18} />}
              title="Posture"
              score={metrics.posture?.score || 0}
              status={getMetricStatus(metrics.posture?.score || 0)}
              details={[]}
            />
          </div>
        </div>

        {/* RIGHT COLUMN: THE AI COACH (25%) */}
        <div className="xl:col-span-3 flex flex-col gap-6 sticky top-8">
          <AICoach 
            takeaways={mockTakeaways} 
            actionItems={mockActionItems} 
            onSeek={handleSeek} 
          />
          
          {/* Structure Analysis (Compact) */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <h3 className="font-semibold text-gray-800 mb-4">Structure</h3>
            <StructureAnalysis score={metrics.structure_score || 0} />
          </div>
        </div>

      </div>
    </div>
  );
};

export default AnalysisResults;
