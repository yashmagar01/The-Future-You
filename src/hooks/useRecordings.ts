import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';

// Type aliases for cleaner code
export type Recording = Tables<'recordings'>;
export type Feedback = Tables<'feedback'>;
export type Profile = Tables<'profiles'>;
export type Progress = Tables<'progress'>;

export type RecordingWithFeedback = Recording & {
  feedback: Feedback | null;
};

// ==================== PROFILES ====================

export const useProfile = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data as Profile;
    },
    enabled: !!user,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (updates: Partial<Profile>) => {
      if (!user) throw new Error('Not authenticated');

      // @ts-ignore - Type will be correct after running database migrations
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data as Profile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    },
  });
};

// ==================== RECORDINGS ====================

export const useRecordings = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['recordings', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('recordings')
        .select(`
          *,
          feedback (*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform to flat structure
      const recordings = (data || []) as any[];
      return recordings.map((recording): RecordingWithFeedback => ({
        ...recording,
        feedback: Array.isArray(recording.feedback) && recording.feedback.length > 0 
          ? recording.feedback[0] 
          : null
      }));
    },
    enabled: !!user,
  });
};

export const useRecording = (id: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['recording', id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('recordings')
        .select(`
          *,
          feedback (*)
        `)
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      
      const recording = data as any;
      return {
        ...recording,
        feedback: Array.isArray(recording.feedback) && recording.feedback.length > 0 
          ? recording.feedback[0] 
          : null
      } as RecordingWithFeedback;
    },
    enabled: !!user && !!id,
  });
};

export const useCreateRecording = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (recording: Omit<TablesInsert<'recordings'>, 'user_id'>) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('recordings')
        .insert({
          ...recording,
          user_id: user.id,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data as Recording;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recordings', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['stats', user?.id] });
    },
  });
};

export const useUpdateRecording = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Recording> }) => {
      if (!user) throw new Error('Not authenticated');

      // @ts-ignore - Type will be correct after running database migrations
      const { data, error } = await supabase
        .from('recordings')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data as Recording;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['recordings', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['recording', variables.id] });
    },
  });
};

export const useDeleteRecording = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('recordings')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recordings', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['stats', user?.id] });
    },
  });
};

// ==================== STATS & ANALYTICS ====================

export const useStats = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['stats', user?.id],
    queryFn: async () => {
      if (!user) return null;

      // Get total recordings
      const { count: totalRecordings } = await supabase
        .from('recordings')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Get recordings with feedback for average score
      const { data: recordingsWithFeedback } = await supabase
        .from('recordings')
        .select('id, feedback(overall_score)')
        .eq('user_id', user.id);

      // Calculate average score
      const scores: number[] = [];
      (recordingsWithFeedback || []).forEach((rec: any) => {
        if (Array.isArray(rec.feedback) && rec.feedback.length > 0 && rec.feedback[0].overall_score) {
          scores.push(rec.feedback[0].overall_score);
        }
      });
      const avgScore = scores.length > 0
        ? Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length)
        : 0;

      // Get total duration
      const { data: recordings } = await supabase
        .from('recordings')
        .select('duration_seconds')
        .eq('user_id', user.id);

      const totalSeconds = (recordings || []).reduce((sum: number, r: any) => 
        sum + (r.duration_seconds || 0), 0
      );
      const totalHours = Math.round(totalSeconds / 3600);

      // Get recordings this week
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const { count: thisWeekCount } = await supabase
        .from('recordings')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', oneWeekAgo.toISOString());

      return {
        totalRecordings: totalRecordings || 0,
        averageScore: avgScore,
        totalHours,
        thisWeekRecordings: thisWeekCount || 0,
      };
    },
    enabled: !!user,
  });
};

export const useWeeklyActivity = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['weekly-activity', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data } = await supabase
        .from('recordings')
        .select('created_at, duration_seconds')
        .eq('user_id', user.id)
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: true });

      // Group by day
      const activityByDay = days.map((day, index) => {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() - (6 - index));
        
        const dayRecordings = (data || []).filter((r: any) => {
          const recordingDate = new Date(r.created_at);
          return recordingDate.toDateString() === targetDate.toDateString();
        });

        const totalMinutes = dayRecordings.reduce((sum: number, r: any) => 
          sum + ((r.duration_seconds || 0) / 60), 0
        );

        return {
          day,
          value: Math.round(totalMinutes),
        };
      });

      return activityByDay;
    },
    enabled: !!user,
  });
};

export const usePerformanceTrend = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['performance-trend', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const { data } = await supabase
        .from('recordings')
        .select(`
          created_at,
          feedback (overall_score)
        `)
        .eq('user_id', user.id)
        .gte('created_at', sixMonthsAgo.toISOString())
        .order('created_at', { ascending: true });

      // Group by month and calculate average
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthlyData: { [key: string]: number[] } = {};

      (data || []).forEach((recording: any) => {
        const date = new Date(recording.created_at);
        const monthKey = `${months[date.getMonth()]}`;
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = [];
        }

        const feedback = Array.isArray(recording.feedback) && recording.feedback.length > 0
          ? recording.feedback[0]
          : null;

        if (feedback?.overall_score) {
          monthlyData[monthKey].push(feedback.overall_score);
        }
      });

      return Object.entries(monthlyData).map(([month, scores]) => ({
        month,
        score: scores.length > 0 
          ? Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length)
          : 0,
      }));
    },
    enabled: !!user,
  });
};

// ==================== STORAGE ====================

export const uploadRecording = async (
  file: File,
  userId: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${Date.now()}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from('recordings')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from('recordings')
    .getPublicUrl(data.path);

  return publicUrl;
};

export const deleteRecordingFile = async (url: string): Promise<void> => {
  const path = url.split('/recordings/')[1];
  if (!path) return;

  const { error } = await supabase.storage
    .from('recordings')
    .remove([path]);

  if (error) throw error;
};
