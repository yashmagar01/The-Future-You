import React from 'react';
import { CheckCircle, AlertCircle, Mic, Activity, User, FileText, Zap } from 'lucide-react';
import PacingGraph from './PacingGraph';
import StructureAnalysis from './StructureAnalysis';

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

    <div className="mt-auto text-sm text-gray-600">
      {children}
    </div>
  </div>
);

const AnalysisResults: React.FC<AnalysisResultsProps> = ({ analysis = DEFAULT_ANALYSIS }) => {
  const { overall_score, metrics, transcript_summary } = analysis;

  return (
    <div className="w-full max-w-5xl mx-auto p-6 space-y-8">
      
      {/* Header Section with Overall Score */}
      <div className="relative overflow-hidden bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full -mr-16 -mt-16 opacity-50 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-50 rounded-full -ml-16 -mb-16 opacity-50 blur-3xl"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-center md:text-left space-y-2">
            <h2 className="text-3xl font-bold text-gray-800">Analysis Results</h2>
            <p className="text-gray-500">Here's how you performed in your latest session.</p>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative flex items-center justify-center w-32 h-32">
              {/* Circular Progress Background */}
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-gray-100"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={351.86}
                  strokeDashoffset={351.86 - (351.86 * overall_score) / 100}
                  className={`${getScoreColor(overall_score)} transition-all duration-1000 ease-out`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className={`text-4xl font-bold ${getScoreColor(overall_score)}`}>
                  {overall_score}
                </span>
                <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Overall</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Clarity Card */}
        <ScoreCard title="Clarity" score={metrics.clarity.score} icon={Mic}>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span>Speaking Rate</span>
              <span className="font-medium text-gray-900">{metrics.clarity.wpm} WPM</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Filler Words</span>
              <span className={`font-medium ${metrics.clarity.filler_word_count > 5 ? 'text-red-500' : 'text-green-600'}`}>
                {metrics.clarity.filler_word_count}
              </span>
            </div>
            {metrics.clarity.filler_words_detected && metrics.clarity.filler_words_detected.length > 0 && (
              <div className="text-xs text-gray-400 mt-1">
                Detected: {metrics.clarity.filler_words_detected.join(", ")}
              </div>
            )}
          </div>
        </ScoreCard>

        {/* Pacing Card */}
        <ScoreCard title="Pacing" score={metrics.pacing?.score || 0} icon={Activity}>
          <p className="italic text-gray-600 mb-3">
            "{metrics.pacing?.feedback || "No pacing data available."}"
          </p>
          
          {/* WPM Range Visualization */}
          {metrics.pacing?.words_per_minute !== undefined && (
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-xs text-gray-500">
                <span>WPM: <strong className="text-gray-900">{metrics.pacing.words_per_minute}</strong></span>
                <span className={`font-medium ${
                  metrics.pacing.words_per_minute < 110 ? 'text-orange-600' :
                  metrics.pacing.words_per_minute <= 150 ? 'text-green-600' : 
                  'text-red-600'
                }`}>
                  {metrics.pacing.words_per_minute < 110 ? 'Too Slow' :
                   metrics.pacing.words_per_minute <= 150 ? 'Optimal' : 
                   'Too Fast'}
                </span>
              </div>
              
              {/* Range Slider */}
              <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                {/* Optimal zone (110-150 WPM) */}
                <div className="absolute left-[27.5%] w-[45%] h-full bg-green-200"></div>
                
                {/* Current position marker */}
                <div 
                  className="absolute top-0 w-1 h-full bg-blue-600 transition-all"
                  style={{ 
                    left: `${Math.min(100, Math.max(0, (metrics.pacing.words_per_minute / 200) * 100))}%` 
                  }}
                ></div>
              </div>
              
              <div className="flex justify-between text-[10px] text-gray-400">
                <span>0</span>
                <span className="text-green-600">110-150</span>
                <span>200+</span>
              </div>
            </div>
          )}
        </ScoreCard>

        {/* Posture Card */}
        <ScoreCard title="Posture" score={metrics.posture?.score || 0} icon={User}>
          {metrics.posture?.issues_detected && metrics.posture.issues_detected.length > 0 ? (
            <ul className="space-y-1">
              {metrics.posture.issues_detected.map((issue, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-red-500">
                  <AlertCircle size={12} className="mt-0.5 shrink-0" />
                  {issue}
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle size={16} />
              <span>Great posture maintained!</span>
            </div>
          )}
        </ScoreCard>
        </ScoreCard>

        {/* Structure Analysis Card */}
        <div className="h-full">
           <StructureAnalysis score={metrics.structure_score || 0} />
        </div>
      </div>

      {/* Pacing Graph Section */}
      {metrics.timeline && metrics.timeline.length > 0 && (
        <div className="w-full">
          <PacingGraph data={metrics.timeline} />
        </div>
      )}

      {/* Additional Insights Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Sentiment Analysis */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
              <Zap size={20} />
            </div>
            <h3 className="font-semibold text-gray-700">Sentiment Analysis</h3>
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
