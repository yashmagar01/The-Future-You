import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  Activity, 
  Award,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Zap,
  Clock,
  CheckCircle2,
  Loader2,
  Flame,
  Trophy,
  Sparkles
} from "lucide-react";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { PLAY_LEVELS, hasBadge } from "@/data/playLevels";
import { usePlay } from "@/contexts/PlayContext";
import { useStats, useWeeklyActivity, usePerformanceTrend, useRecordings, useProfile } from "@/hooks/useRecordings";
import { StatCardSkeleton, ChartSkeleton } from "@/components/LoadingSkeletons";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import AnalysisResults, { AnalysisData, AnalysisMetrics, AdvancedMetrics } from "@/components/AnalysisResults";

// ponytail: stable ref outside render so 10s quote tick doesn't recreate data
const QUOTES = [
  { text: "Practice makes progress, not perfection.", author: "Anonymous" },
  { text: "Your voice matters. Keep practicing!", author: "Future You Team" },
  { text: "Every recording is a step toward mastery.", author: "Anonymous" },
  { text: "Confidence is built one session at a time.", author: "Future You Team" }
];

const Dashboard = () => {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: stats, isLoading: statsLoading } = useStats();
  const { data: weeklyData, isLoading: weeklyLoading } = useWeeklyActivity();
  const { data: performanceData, isLoading: performanceLoading } = usePerformanceTrend();
  const { data: recordings } = useRecordings();

  // --- Latest Analysis Logic ---
  const latestRecording = recordings?.[0];
  const latestFeedback = latestRecording?.feedback;

  // ponytail: memo derived objects so cards/charts skip rerender unless own data changes
  const analysisData: AnalysisData | null = useMemo(() => latestFeedback ? {
    overall_score: latestFeedback.overall_score,
    metrics: latestFeedback.key_insights as unknown as AnalysisMetrics,
    advanced_metrics: latestFeedback.advanced_metrics as unknown as AdvancedMetrics,
    transcript_summary: (latestFeedback.key_insights as any)?.transcript || "No transcript available."
  } : null, [latestFeedback]);

  const [currentQuote, setCurrentQuote] = useState(QUOTES[0]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
    }, 10000); // Change every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const statsCards = useMemo(() => [
    {
      title: "Total Recordings",
      value: stats?.totalRecordings?.toString() || "0",
      change: `+${stats?.thisWeekRecordings || 0} this week`,
      trend: "up" as const,
      icon: Activity,
      color: "text-primary"
    },
    {
      title: "Average Score",
      value: stats?.averageScore?.toString() || "0",
      change: "Overall performance",
      trend: "up" as const,
      icon: TrendingUp,
      color: "text-accent"
    },
    {
      title: "Time Invested",
      value: `${stats?.totalHours || 0}h`,
      change: "Total practice time",
      trend: "up" as const,
      icon: Clock,
      color: "text-success"
    },
    {
      title: "This Week",
      value: stats?.thisWeekRecordings?.toString() || "0",
      change: "New recordings",
      trend: "up" as const,
      icon: Award,
      color: "text-warning"
    }
  ], [stats?.totalRecordings, stats?.averageScore, stats?.totalHours, stats?.thisWeekRecordings]);

  const progressData = useMemo(() => [
    { name: "Communication Skills", value: stats?.averageScore || 0, target: 100 },
    { name: "Weekly Practice", value: Math.min(((stats?.thisWeekRecordings || 0) / 5) * 100, 100), target: 100 },
    { name: "Consistency", value: Math.min(((stats?.totalRecordings || 0) / 30) * 100, 100), target: 100 },
    { name: "Total Progress", value: Math.min((stats?.totalHours || 0), 100), target: 100 }
  ], [stats?.averageScore, stats?.thisWeekRecordings, stats?.totalRecordings, stats?.totalHours]);

  const recentActivity = useMemo(() => (recordings || []).slice(0, 4).map(recording => {
    const isPending = recording.status === 'processing';
    const isCompleted = recording.status === 'completed';
    
    return {
      title: recording.title || 'New Recording',
      time: new Date(recording.created_at).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      }),
      status: recording.status,
      icon: isPending ? Loader2 : isCompleted ? CheckCircle2 : Target,
      color: isPending ? "text-accent" : isCompleted ? "text-success" : "text-muted-foreground",
      animated: isPending
    };
  }), [recordings]);

  // 10-Level Gamification & Play Mode
  const { xp, streak, longestStreak, badges, allBadges, playerLevel, getStatus, streakMultiplier } = usePlay();
  const currentPlayLevel = PLAY_LEVELS.find((l) => {
    const s = getStatus(l);
    return s.status === 'available';
  }) ?? PLAY_LEVELS[PLAY_LEVELS.length - 1];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Welcome Section */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold mb-2">
            Welcome back{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : (user?.email ? `, ${user.email.split('@')[0]}` : '')}
          </h1>
          <p className="text-muted-foreground text-lg">
            Here's your performance overview and insights
          </p>
        </div>

        {/* 10-Level Gamification Journey Hub */}
        <div className="mb-8 animate-fade-in">
          <Card className="bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-white border border-emerald-500/30 overflow-hidden relative shadow-lg">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
            <CardContent className="p-6 relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-3 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                    <span>{playerLevel.currentRank.emoji}</span> Level {playerLevel.level}: {playerLevel.currentRank.title}
                  </span>
                  <span className="inline-flex items-center gap-1 bg-orange-500/20 text-orange-300 border border-orange-400/30 px-2.5 py-1 rounded-full text-xs font-bold">
                    <Flame className="h-3.5 w-3.5 text-orange-400" /> {streak} Day Streak
                  </span>
                  <span className="inline-flex items-center gap-1 bg-amber-500/20 text-amber-300 border border-amber-400/30 px-2.5 py-1 rounded-full text-xs font-bold">
                    <Zap className="h-3.5 w-3.5 text-amber-400" /> {xp} XP
                  </span>
                  <span className="inline-flex items-center gap-1 bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 px-2.5 py-1 rounded-full text-xs font-bold">
                    <Trophy className="h-3.5 w-3.5 text-indigo-400" /> {badges.length} Badges
                  </span>
                </div>

                <div>
                  <h2 className="text-xl md:text-2xl font-extrabold text-white">
                    Current Challenge: Level {currentPlayLevel.level} — {currentPlayLevel.title}
                  </h2>
                  <p className="text-emerald-100/80 text-sm mt-1 max-w-2xl">
                    {currentPlayLevel.tagline} · Target: {currentPlayLevel.durationTargetSec}s · Clear at {currentPlayLevel.unlockAfterScore}+ score
                  </p>
                </div>

                <div className="max-w-md space-y-1.5 pt-1">
                  <div className="flex justify-between text-xs text-emerald-200">
                    <span>Progress to Level {playerLevel.nextRank ? playerLevel.nextRank.level : 10}</span>
                    <span className="font-bold">{playerLevel.progressPercent}%</span>
                  </div>
                  <Progress value={playerLevel.progressPercent} className="h-2 bg-black/40" />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 min-w-[240px]">
                <Button asChild className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-md shadow-emerald-500/30 flex-1">
                  <Link to={`/record?level=${currentPlayLevel.id}`}>
                    Play Level {currentPlayLevel.level}
                  </Link>
                </Button>
                <Button asChild variant="outline" className="border-white/20 bg-white/10 hover:bg-white/20 text-white font-semibold">
                  <Link to="/play">
                    View 10 Levels
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Motivational Quote */}
        <Card className="mb-8 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 border-primary/20 animate-fade-in">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Sparkles className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-lg font-medium mb-2 text-foreground">"{currentQuote.text}"</p>
                <p className="text-sm text-muted-foreground">— {currentQuote.author}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Latest Analysis Results (If Available) */}
        {analysisData && (
          <div className="mb-8 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Latest Analysis</h2>
              <Badge variant="outline" className="text-primary border-primary/50">
                {new Date(latestRecording?.created_at || "").toLocaleDateString()}
              </Badge>
            </div>
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg mb-1">{latestRecording?.title || 'Video Analysis'}</h3>
                  <p className="text-muted-foreground text-sm">
                    Recorded {new Date(latestRecording?.created_at || "").toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right hidden sm:block">
                    <div className="text-2xl font-bold text-primary">{analysisData.overall_score}</div>
                    <div className="text-xs text-muted-foreground">Overall Score</div>
                  </div>
                  <Button asChild>
                    <Link to={`/analysis/${latestRecording?.id}`}>
                      View Full Report
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {statsLoading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <StatCardSkeleton key={index} />
            ))
          ) : (
            statsCards.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card 
                  key={stat.title} 
                  className="hover-lift animate-scale-in border-border/50"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </CardTitle>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold mb-1">{stat.value}</div>
                    <div className="flex items-center text-sm">
                      {stat.trend === "up" ? (
                        <ArrowUpRight className="h-4 w-4 text-success mr-1" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-destructive mr-1" />
                      )}
                      <span className={stat.trend === "up" ? "text-success" : "text-destructive"}>
                        {stat.change}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Streak & Journey */}
        <div className="grid gap-6 lg:grid-cols-2 mb-8">
          {/* Streak Counter */}
          <Card className="animate-slide-up border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-500" />
                Your Streak
              </CardTitle>
              <CardDescription>Keep the momentum going!</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Current Streak</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-4xl font-bold">{streak}</span>
                    <span className="text-muted-foreground">days</span>
                    {streak > 0 && <Flame className="h-6 w-6 text-orange-500 animate-pulse" />}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Longest</p>
                  <div className="flex items-center gap-2 mt-1 justify-end">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    <span className="text-2xl font-bold text-muted-foreground">{longestStreak}</span>
                  </div>
                </div>
              </div>
              <Progress value={longestStreak > 0 ? (streak / longestStreak) * 100 : 0} className="h-2" />
              <p className="text-xs font-medium text-muted-foreground">
                {streakMultiplier > 1
                  ? `🔥 Streak bonus active: +${Math.round((streakMultiplier - 1) * 100)}% XP on everything you earn.`
                  : 'Reach a 3-day streak for +10% XP, and 7 days for +20% XP.'}
              </p>
            </CardContent>
          </Card>

          {/* Journey Map */}
          <Card className="animate-slide-up border-border/50" style={{ animationDelay: '0.1s' }}>
            <CardHeader>
              <CardTitle>Your Journey</CardTitle>
              <CardDescription>Progress through skill levels</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4 overflow-x-auto pb-2">
                {PLAY_LEVELS.map((level, idx) => {
                  const status = getStatus(level);
                  const isDone = status.status === 'completed';
                  const isCurrent = status.status === 'available';
                  const isLocked = status.status === 'locked';
                  return (
                    <div key={level.id} className="flex flex-col items-center relative flex-1 min-w-[90px]">
                      <div 
                        className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-all duration-300 ${
                          isDone 
                            ? 'bg-emerald-500/10 border-2 border-emerald-500 scale-110' 
                            : isLocked 
                              ? 'bg-muted border-2 border-border opacity-40'
                              : 'bg-primary/10 border-2 border-primary scale-110'
                        }`}
                      >
                        {isDone ? '✓' : isLocked ? '🔒' : level.emoji}
                      </div>
                      <p className={`text-xs mt-2 font-medium ${isDone || isCurrent ? 'text-foreground' : 'text-muted-foreground'}`}>
                        L{level.level}
                      </p>
                      {idx < PLAY_LEVELS.length - 1 && (
                        <div className={`absolute top-6 left-[60%] w-full h-0.5 ${
                          getStatus(PLAY_LEVELS[idx + 1]).status !== 'locked' ? 'bg-emerald-500' : 'bg-border'
                        }`} />
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="text-sm text-center text-muted-foreground">
                You're on <strong className="text-foreground">Level {currentPlayLevel.level}</strong> of {PLAY_LEVELS.length} in Play Mode!
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Trophy Case Preview */}
        <Card className="mb-8 animate-slide-up border-border/50" style={{ animationDelay: '0.2s' }}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Trophy Case
                </CardTitle>
                <CardDescription>Collect badges across quests, streaks, and mastery</CardDescription>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link to="/play">View All Badges</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                <span className="font-bold text-foreground">{badges.length}</span> / {allBadges.length} badges unlocked
              </p>
              <Badge variant="outline" className="border-amber-400/60 text-amber-600">
                Level {playerLevel.level} · {playerLevel.currentRank.title}
              </Badge>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-8 gap-2">
              {allBadges.slice(0, 16).map((badge) => {
                const earned = hasBadge(badges, badge);
                return (
                  <div
                    key={badge.id}
                    className={`relative flex flex-col items-center justify-center rounded-xl border p-2 text-center transition-all ${
                      earned
                        ? 'bg-amber-500/5 border-amber-400/40'
                        : 'bg-muted/30 border-border/60 opacity-40'
                    }`}
                    title={earned ? badge.title : 'Locked'}
                  >
                    <span className="text-xl">{badge.emoji}</span>
                    <p className="mt-1 text-[9px] font-semibold leading-tight line-clamp-1">{badge.title}</p>
                    {earned && <CheckCircle2 className="mt-1 h-3 w-3 text-emerald-600" />}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2 mb-8">
          {/* Performance Chart */}
          {performanceLoading ? (
            <ChartSkeleton />
          ) : (
            <Card className="animate-slide-up border-border/50" style={{ animationDelay: '0.3s' }}>
              <CardHeader>
                <CardTitle>Performance Trend</CardTitle>
                <CardDescription>Your progress over the last 6 months</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    score: {
                    label: "Score",
                    color: "hsl(var(--primary))",
                  },
                }}
                className="h-[250px]"
              >
                <AreaChart data={performanceData}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="month" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area 
                    type="monotone" 
                    dataKey="score" 
                    stroke="hsl(var(--primary))" 
                    fill="url(#colorScore)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>
          )}

          {/* Weekly Activity */}
          {weeklyLoading ? (
            <ChartSkeleton />
          ) : (
          <Card className="animate-slide-up border-border/50" style={{ animationDelay: '0.4s' }}>
            <CardHeader>
              <CardTitle>Weekly Activity</CardTitle>
              <CardDescription>Your daily engagement this week</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  value: {
                    label: "Activity",
                    color: "hsl(var(--accent))",
                  },
                }}
                className="h-[250px]"
              >
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="day" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar 
                    dataKey="value" 
                    fill="hsl(var(--accent))" 
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
          )}
        </div>


        <div className="grid gap-6 lg:grid-cols-3 mb-8">
          {/* Progress Tracking */}
          <Card className="lg:col-span-2 animate-slide-up border-border/50" style={{ animationDelay: '0.5s' }}>
            <CardHeader>
              <CardTitle>Progress Tracking</CardTitle>
              <CardDescription>Your current goals and achievements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {progressData.map((item, index) => (
                <div key={item.name} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{item.name}</span>
                    <span className="text-muted-foreground">{item.value}%</span>
                  </div>
                  <Progress value={item.value} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="animate-slide-up border-border/50" style={{ animationDelay: '0.6s' }}>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest achievements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity, index) => {
                  const Icon = activity.icon;
                  return (
                    <div 
                      key={index} 
                      className="flex items-start gap-3 pb-4 border-b border-border/50 last:border-0 last:pb-0"
                    >
                      <div className={`p-2 rounded-lg bg-muted ${activity.color}`}>
                        <Icon className={`h-4 w-4 ${activity.animated ? 'animate-spin' : ''}`} />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium leading-none">
                            {activity.title}
                          </p>
                          {activity.status === 'processing' && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-accent/20 text-accent">
                              Processing
                            </span>
                          )}
                          {activity.status === 'completed' && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-success/20 text-success">
                              Ready
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {activity.time}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No recent activity yet
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
