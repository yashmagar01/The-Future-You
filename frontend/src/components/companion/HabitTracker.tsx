import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Habit, HabitLog, HabitStat } from '@/lib/companion/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  CheckCircle2, 
  Circle, 
  Flame, 
  Plus, 
  Sparkles, 
  Calendar, 
  Trophy, 
  Trash2,
  TrendingUp,
  Loader2
} from 'lucide-react';

interface HabitTrackerProps {
  onHabitsUpdated?: () => void;
}

const CATEGORIES = [
  { id: 'all', label: 'All Habits' },
  { id: 'growth', label: 'Personal Growth' },
  { id: 'speech', label: 'Communication' },
  { id: 'mindfulness', label: 'Mindfulness' },
  { id: 'fitness', label: 'Health' },
];

const PRESET_HABITS = [
  { name: 'Daily 60s Video Reflection', category: 'speech', color: '#10B981' },
  { name: 'Morning Meditation (5 mins)', category: 'mindfulness', color: '#6366F1' },
  { name: 'Read 10 pages of growth book', category: 'growth', color: '#F59E0B' },
  { name: 'Conscious Pause Practice', category: 'speech', color: '#EC4899' },
];

export function HabitTracker({ onHabitsUpdated }: HabitTrackerProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [stats, setStats] = useState<Record<string, HabitStat>>({});
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');

  // New Habit Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitCategory, setNewHabitCategory] = useState('growth');
  const [newHabitTargetDays, setNewHabitTargetDays] = useState(7);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadHabitsData();
  }, [user]);

  const loadHabitsData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      // 1. Fetch habits
      const { data: habitsData, error: habitsError } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id)
        .eq('archived', false)
        .order('created_at', { ascending: true });

      if (habitsError) throw habitsError;

      // Seed preset habits if user has no habits yet
      if (!habitsData || habitsData.length === 0) {
        await seedPresetHabits();
        return;
      }

      setHabits(habitsData as unknown as Habit[]);

      // 2. Fetch past 14 days of logs
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
      const startDateStr = fourteenDaysAgo.toISOString().split('T')[0];

      const habitIds = habitsData.map((h) => h.id);
      const { data: logsData, error: logsError } = await supabase
        .from('habit_logs')
        .select('*')
        .in('habit_id', habitIds)
        .gte('logged_date', startDateStr);

      if (logsError) throw logsError;

      const loadedLogs = (logsData || []) as unknown as HabitLog[];
      setLogs(loadedLogs);

      // Compute statistics
      computeStats(habitsData as unknown as Habit[], loadedLogs);
    } catch (err) {
      console.error('Error loading habits:', err);
    } finally {
      setLoading(false);
    }
  };

  const seedPresetHabits = async () => {
    if (!user) return;
    try {
      const inserts = PRESET_HABITS.map((p) => ({
        user_id: user.id,
        name: p.name,
        category: p.category,
        color: p.color,
        frequency: 'daily',
        target_days: 7,
        archived: false,
      }));

      const { data, error } = await supabase.from('habits').insert(inserts).select();
      if (!error && data) {
        setHabits(data as unknown as Habit[]);
        computeStats(data as unknown as Habit[], []);
      }
    } catch (err) {
      console.error('Error seeding habits:', err);
    }
  };

  const computeStats = (habitList: Habit[], logList: HabitLog[]) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const newStats: Record<string, HabitStat> = {};

    habitList.forEach((habit) => {
      const habitLogs = logList.filter((l) => l.habit_id === habit.id && l.completed);
      const isCompletedToday = habitLogs.some((l) => l.logged_date === todayStr);

      let streak = 0;
      const checkDate = new Date();
      if (!isCompletedToday) {
        checkDate.setDate(checkDate.getDate() - 1);
      }

      for (let i = 0; i < 30; i++) {
        const dStr = checkDate.toISOString().split('T')[0];
        const hasLog = habitLogs.some((l) => l.logged_date === dStr);
        if (hasLog) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }

      newStats[habit.id] = {
        streak,
        completedToday: isCompletedToday,
        totalCompletions: habitLogs.length,
      };
    });

    setStats(newStats);
  };

  const toggleHabitToday = async (habitId: string) => {
    if (!user) return;
    const todayStr = new Date().toISOString().split('T')[0];
    const currentCompleted = stats[habitId]?.completedToday || false;
    const newStatus = !currentCompleted;

    // Optimistic UI update
    setStats((prev) => ({
      ...prev,
      [habitId]: {
        ...prev[habitId],
        completedToday: newStatus,
        streak: newStatus ? (prev[habitId]?.streak || 0) + 1 : Math.max(0, (prev[habitId]?.streak || 1) - 1),
      },
    }));

    try {
      const { error } = await supabase.from('habit_logs').upsert(
        {
          user_id: user.id,
          habit_id: habitId,
          completed: newStatus,
          logged_date: todayStr,
        },
        { onConflict: 'habit_id,logged_date' }
      );

      if (error) throw error;

      toast({
        title: newStatus ? 'Habit Completed! 🎉' : 'Habit Unchecked',
        description: newStatus ? 'Great job staying consistent today!' : 'Updated status for today.',
      });

      // Reload fresh logs
      const { data: updatedLogs } = await supabase
        .from('habit_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('logged_date', new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0]);

      if (updatedLogs) {
        setLogs(updatedLogs as unknown as HabitLog[]);
        computeStats(habits, updatedLogs as unknown as HabitLog[]);
      }

      onHabitsUpdated?.();
    } catch (err) {
      console.error('Error updating habit log:', err);
      toast({
        title: 'Error updating habit',
        description: 'Could not sync habit completion.',
        variant: 'destructive',
      });
      loadHabitsData(); // Rollback
    }
  };

  const handleCreateHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newHabitName.trim()) return;

    try {
      setIsSubmitting(true);
      const { data, error } = await supabase
        .from('habits')
        .insert({
          user_id: user.id,
          name: newHabitName.trim(),
          category: newHabitCategory,
          target_days: newHabitTargetDays,
          color: '#10B981',
          frequency: 'daily',
          archived: false,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Habit Created!',
        description: `"${newHabitName}" is now active in your daily routine.`,
      });

      setNewHabitName('');
      setIsAddOpen(false);
      loadHabitsData();
      onHabitsUpdated?.();
    } catch (err) {
      console.error('Error creating habit:', err);
      toast({
        title: 'Failed to create habit',
        description: 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteHabit = async (habitId: string, habitName: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('habits')
        .update({ archived: true })
        .eq('id', habitId);

      if (error) throw error;

      toast({
        title: 'Habit Archived',
        description: `"${habitName}" was removed from your active list.`,
      });

      setHabits((prev) => prev.filter((h) => h.id !== habitId));
      onHabitsUpdated?.();
    } catch (err) {
      console.error('Error archiving habit:', err);
    }
  };

  // Helper to get past 7 days dates
  const past7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return {
      dateStr: d.toISOString().split('T')[0],
      dayName: d.toLocaleDateString('en-US', { weekday: 'narrow' }),
      isToday: i === 6,
    };
  });

  const filteredHabits = habits.filter((h) =>
    activeCategory === 'all' ? true : h.category === activeCategory
  );

  const totalCompletedToday = Object.values(stats).filter((s) => s.completedToday).length;
  const completionPercentage = habits.length > 0 ? Math.round((totalCompletedToday / habits.length) * 100) : 0;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-gray-200">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mb-3" />
        <p className="text-sm text-gray-500">Loading your habit streaks...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards Header */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-emerald-100 text-xs">Today's Completion</CardDescription>
            <CardTitle className="text-2xl font-bold flex items-center justify-between">
              <span>{totalCompletedToday} / {habits.length}</span>
              <span className="text-sm font-medium bg-white/20 px-2 py-0.5 rounded-full">
                {completionPercentage}%
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="w-full bg-white/20 rounded-full h-2 mt-1 overflow-hidden">
              <div
                className="bg-white h-2 rounded-full transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs text-gray-500">Longest Active Streak</CardDescription>
            <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Flame className="h-6 w-6 text-amber-500 fill-amber-500" />
              <span>{Math.max(0, ...Object.values(stats).map((s) => s.streak))} Days</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-gray-500">
            Consistency breeds confidence in communication.
          </CardContent>
        </Card>

        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs text-gray-500">Active Habits</CardDescription>
            <CardTitle className="text-2xl font-bold text-gray-900 flex items-center justify-between">
              <span>{habits.length} Tracking</span>
              <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs">
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    New Habit
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Daily Growth Habit</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateHabit} className="space-y-4 py-2">
                    <div>
                      <Label htmlFor="habitName" className="text-xs">Habit Name</Label>
                      <Input
                        id="habitName"
                        value={newHabitName}
                        onChange={(e) => setNewHabitName(e.target.value)}
                        placeholder="e.g., 2-Minute Vocal Warmup"
                        required
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="category" className="text-xs">Category</Label>
                      <select
                        id="category"
                        value={newHabitCategory}
                        onChange={(e) => setNewHabitCategory(e.target.value)}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                      >
                        <option value="speech">Communication & Speaking</option>
                        <option value="growth">Personal Growth</option>
                        <option value="mindfulness">Mindfulness & Reflection</option>
                        <option value="fitness">Physical Health</option>
                      </select>
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsAddOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSubmitting || !newHabitName.trim()}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        {isSubmitting ? 'Creating...' : 'Create Habit'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-gray-500">
            Target: 7 days/week routine
          </CardContent>
        </Card>
      </div>

      {/* Category Pills Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
              activeCategory === cat.id
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Habits List */}
      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 shadow-sm overflow-hidden">
        {filteredHabits.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            No habits found in this category. Click &quot;New Habit&quot; above to create one!
          </div>
        ) : (
          filteredHabits.map((habit) => {
            const isCompleted = stats[habit.id]?.completedToday || false;
            const streak = stats[habit.id]?.streak || 0;

            return (
              <div
                key={habit.id}
                className="flex items-center justify-between p-4 hover:bg-gray-50/70 transition-colors"
              >
                {/* Left: Checkbox & Name */}
                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                  <button
                    onClick={() => toggleHabitToday(habit.id)}
                    aria-label={isCompleted ? `Mark ${habit.name} not done` : `Mark ${habit.name} done`}
                    className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 transition-transform active:scale-95 relative before:absolute before:-inset-[10px] before:content-['']"
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-6 w-6 text-emerald-600 fill-emerald-100" />
                    ) : (
                      <Circle className="h-6 w-6 text-gray-300 hover:text-emerald-500" />
                    )}
                  </button>

                  <div className="min-w-0">
                    <h4
                      className={`text-sm font-medium transition-all ${
                        isCompleted ? 'text-gray-400 line-through' : 'text-gray-900'
                      }`}
                    >
                      {habit.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">
                        {habit.category}
                      </span>
                      {streak > 0 && (
                        <span className="flex items-center text-[11px] text-amber-600 font-medium">
                          <Flame className="h-3 w-3 mr-0.5 fill-amber-500 text-amber-500" />
                          {streak}d streak
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Past 7 Days Dots Matrix & Actions */}
                <div className="flex items-center gap-4">
                  {/* 7-Day History Matrix */}
                  <div className="hidden sm:flex items-center gap-1.5">
                    {past7Days.map((day, idx) => {
                      const hasLog = logs.some(
                        (l) => l.habit_id === habit.id && l.logged_date === day.dateStr && l.completed
                      );

                      return (
                        <div key={idx} className="flex flex-col items-center">
                          <span className="text-[9px] text-gray-400 mb-0.5 font-medium">
                            {day.dayName}
                          </span>
                          <div
                            className={`h-4 w-4 rounded-full flex items-center justify-center transition-all ${
                              hasLog
                                ? 'bg-emerald-500 text-white'
                                : day.isToday
                                ? 'border border-emerald-400 bg-emerald-50'
                                : 'bg-gray-100 border border-gray-200'
                            }`}
                          >
                            {hasLog && <div className="h-1.5 w-1.5 bg-white rounded-full" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDeleteHabit(habit.id, habit.name)}
                    className="text-gray-300 hover:text-red-500 p-1.5 rounded-lg transition-colors"
                    title="Archive habit"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
