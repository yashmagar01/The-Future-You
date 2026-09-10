export interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at?: string;
}

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  description?: string | null;
  category: string;
  frequency: string;
  target_days: number;
  color: string;
  icon: string;
  archived?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface HabitLog {
  id?: string;
  habit_id: string;
  user_id: string;
  completed: boolean;
  note?: string | null;
  logged_date: string;
  created_at?: string | null;
}

export interface HabitStat {
  streak: number;
  completedToday: boolean;
  totalCompletions: number;
}

export interface UserContext {
  name: string;
  bio?: string;
  goals: string[];
  anchors: string[];
  habits: Habit[];
  habitSummary: string;
  recentScores?: {
    overall: number;
    clarity: number;
    pace: number;
    tone: number;
    confidence: number;
    strengths: string[];
    improvements: string[];
  } | null;
  memories: ReflectionMemory[];
}

export interface ReflectionMemory {
  id?: string;
  user_id?: string;
  title: string;
  content: string;
  category?: string;
  tags?: string[];
  created_at?: string;
}

export interface DailyInsights {
  greeting: string;
  habitSummary: string;
  speechScores?: {
    overall: number;
    clarity: number;
    pace: number;
    tone: number;
    confidence: number;
    strengths: string[];
    improvements: string[];
  } | null;
  goals: string[];
  anchors: string[];
  dailyNudge: string;
  reflectionPrompt: string;
}
