import { supabase } from '@/integrations/supabase/client';
import { UserContext, Habit, ReflectionMemory } from './types';

export async function assembleClientContext(userId: string): Promise<UserContext> {
  const context: UserContext = {
    name: 'User',
    bio: '',
    goals: [],
    anchors: [],
    habits: [],
    habitSummary: 'No habit data recorded yet.',
    recentScores: null,
    memories: [],
  };

  if (!userId) return context;

  try {
    // 1. Profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, bio, goals, anchors')
      .eq('id', userId)
      .single();

    if (profile) {
      context.name = profile.full_name || 'User';
      context.bio = profile.bio || '';
      context.goals = Array.isArray(profile.goals) ? (profile.goals as string[]) : [];
      context.anchors = Array.isArray(profile.anchors) ? (profile.anchors as string[]) : [];
    }

    // 2. Habits
    const { data: habitsData } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId)
      .eq('archived', false);

    if (habitsData && habitsData.length > 0) {
      context.habits = habitsData as unknown as Habit[];
      const todayStr = new Date().toISOString().split('T')[0];
      const habitIds = habitsData.map((h) => h.id);

      const { data: todayLogs } = await supabase
        .from('habit_logs')
        .select('habit_id, completed')
        .in('habit_id', habitIds)
        .eq('logged_date', todayStr);

      const completedCount = todayLogs ? todayLogs.filter((l) => l.completed).length : 0;
      context.habitSummary = `Tracking ${habitsData.length} habits. Completed today: ${completedCount}/${habitsData.length}. Habits: ${habitsData.map((h) => h.name).join(', ')}`;
    }

    // 3. Latest feedback
    const { data: recentRecordings } = await supabase
      .from('recordings')
      .select('id, created_at, feedback (overall_score, clarity_score, pace_score, tone_score, confidence_score, strengths, improvements)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (
      recentRecordings &&
      recentRecordings.length > 0 &&
      recentRecordings[0].feedback &&
      (recentRecordings[0].feedback as any[]).length > 0
    ) {
      const fb = (recentRecordings[0].feedback as any[])[0];
      context.recentScores = {
        overall: fb.overall_score || 0,
        clarity: fb.clarity_score || 0,
        pace: fb.pace_score || 0,
        tone: fb.tone_score || 0,
        confidence: fb.confidence_score || 0,
        strengths: fb.strengths || [],
        improvements: fb.improvements || [],
      };
    }

    // 4. Saved reflection memories
    const { data: memoriesData } = await supabase
      .from('reflections_memories')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (memoriesData) {
      context.memories = memoriesData as unknown as ReflectionMemory[];
    }
  } catch (error) {
    console.error('Error assembling client context:', error);
  }

  return context;
}
