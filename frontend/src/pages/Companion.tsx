import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { assembleClientContext } from '@/lib/companion/contextAssembler';
import { UserContext } from '@/lib/companion/types';
import { CompanionChat } from '@/components/companion/CompanionChat';
import { HabitTracker } from '@/components/companion/HabitTracker';
import { GoalsAndAnchors } from '@/components/companion/GoalsAndAnchors';
import { MemoriesList } from '@/components/companion/MemoriesList';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  MessageSquare, 
  CheckSquare, 
  Target, 
  Bookmark, 
  Video, 
  TrendingUp, 
  Mic2,
  Loader2 
} from 'lucide-react';

export default function Companion() {
  const { user } = useAuth();
  const [context, setContext] = useState<UserContext>({
    name: 'User',
    bio: '',
    goals: [],
    anchors: [],
    habits: [],
    habitSummary: 'Loading...',
    recentScores: null,
    memories: [],
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('chat');

  useEffect(() => {
    loadContext();
  }, [user]);

  const loadContext = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const ctx = await assembleClientContext(user.id);
      setContext(ctx);
    } catch (err) {
      console.error('Error loading context for companion:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-xs text-xs font-semibold px-2.5 py-0.5 rounded-full">
              <Sparkles className="h-3.5 w-3.5" />
              AI Reflection Companion
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              Welcome to Your Reflection Hub, {context.name}
            </h1>
            <p className="text-emerald-100 text-sm max-w-xl leading-relaxed">
              Your personalized AI coach synthesizes your speech clarity, daily habit consistency, and life anchors to keep your growth steady.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {context.recentScores && (
              <div className="bg-white/10 backdrop-blur-xs border border-white/20 rounded-xl px-4 py-2.5 text-center">
                <span className="text-[11px] text-emerald-100 uppercase tracking-wider block font-medium">
                  Latest Speech Score
                </span>
                <span className="text-xl font-bold">{context.recentScores.overall}/100</span>
              </div>
            )}

            <Button asChild className="bg-white text-emerald-800 hover:bg-emerald-50 font-semibold shadow-sm text-xs">
              <Link to="/record">
                <Video className="h-4 w-4 mr-1.5 text-emerald-700" />
                Record Reflection Video
              </Link>
            </Button>
          </div>
        </div>

        {/* Unified Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white border border-gray-200 p-1 rounded-xl grid grid-cols-2 md:grid-cols-4 h-auto shadow-2xs">
            <TabsTrigger
              value="chat"
              className="flex items-center gap-2 py-2.5 text-xs font-medium rounded-lg data-[state=active]:bg-emerald-600 data-[state=active]:text-white transition-all"
            >
              <MessageSquare className="h-4 w-4" />
              <span>AI Coach Chat</span>
            </TabsTrigger>

            <TabsTrigger
              value="habits"
              className="flex items-center gap-2 py-2.5 text-xs font-medium rounded-lg data-[state=active]:bg-emerald-600 data-[state=active]:text-white transition-all"
            >
              <CheckSquare className="h-4 w-4" />
              <span>Daily Habits</span>
            </TabsTrigger>

            <TabsTrigger
              value="goals"
              className="flex items-center gap-2 py-2.5 text-xs font-medium rounded-lg data-[state=active]:bg-emerald-600 data-[state=active]:text-white transition-all"
            >
              <Target className="h-4 w-4" />
              <span>Goals & Anchors</span>
            </TabsTrigger>

            <TabsTrigger
              value="memories"
              className="flex items-center gap-2 py-2.5 text-xs font-medium rounded-lg data-[state=active]:bg-emerald-600 data-[state=active]:text-white transition-all"
            >
              <Bookmark className="h-4 w-4" />
              <span>Reflections Library</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="mt-0 focus-visible:outline-none">
            <CompanionChat context={context} onRefreshContext={loadContext} />
          </TabsContent>

          <TabsContent value="habits" className="mt-0 focus-visible:outline-none">
            <HabitTracker onHabitsUpdated={loadContext} />
          </TabsContent>

          <TabsContent value="goals" className="mt-0 focus-visible:outline-none">
            <GoalsAndAnchors context={context} onUpdated={loadContext} />
          </TabsContent>

          <TabsContent value="memories" className="mt-0 focus-visible:outline-none">
            <MemoriesList onMemoriesUpdated={loadContext} />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
