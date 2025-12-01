import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  Users, 
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
  Star,
  Lock,
  Sparkles
} from "lucide-react";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { useStats, useWeeklyActivity, usePerformanceTrend, useRecordings, useProfile } from "@/hooks/useRecordings";
import { StatCardSkeleton, ChartSkeleton, ListItemSkeleton } from "@/components/LoadingSkeletons";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import AnalysisResults, { AnalysisData, AnalysisMetrics } from "@/components/AnalysisResults";

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
  
  const analysisData: AnalysisData | null = latestFeedback ? {
    overall_score: latestFeedback.overall_score,
    metrics: latestFeedback.key_insights as unknown as AnalysisMetrics,
    transcript_summary: (latestFeedback.key_insights as any)?.transcript || "No transcript available."
  } : null;

  // Gamification: Streak calculation (mock for now)
  const currentStreak = Math.min((stats?.thisWeekRecordings || 0), 7);
  const longestStreak = Math.max(currentStreak, 7); // Mock: would come from backend

  // Gamification: Motivational quotes
  const quotes = [
    { text: "Practice makes progress, not perfection.", author: "Anonymous" },
    { text: "Your voice matters. Keep practicing!", author: "Future You Team" },
    { text: "Every recording is a step toward mastery.", author: "Anonymous" },
    { text: "Confidence is built one session at a time.", author: "Future You Team" }
  ];
  const [currentQuote, setCurrentQuote] = useState(quotes[0]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuote(quotes[Math.floor(Math.random() * quotes.length)]);
    }, 10000); // Change every 10 seconds
    return () => clearInterval(interval);
  }, []);

  // Gamification: Achievement badges
  const achievements = [
    { 
      id: 1, 
      name: "First Steps", 
      description: "Record your first video", 
      icon: Star,
      unlocked: (stats?.totalRecordings || 0) >= 1,
      color: "text-yellow-500"
    },
    { 
      id: 2, 
      name: "Consistent Practitioner", 
      description: "Record 5 videos", 
      icon: Flame,
      unlocked: (stats?.totalRecordings || 0) >= 5,
      color: "text-orange-500"
    },
    { 
      id: 3, 
      name: "Weekly Warrior", 
      description: "Record 3+ videos this week", 
      icon: Trophy,
      unlocked: (stats?.thisWeekRecordings || 0) >= 3,
      color: "text-purple-500"
    },
    { 
      id: 4, 
      name: "Rising Star", 
      description: "Reach 70+ average score", 
      icon: Sparkles,
      unlocked: (stats?.averageScore || 0) >= 70,
      color: "text-blue-500"
    }
  ];

  const statsCards = [
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
  ];

  const progressData = [
    { name: "Communication Skills", value: stats?.averageScore || 0, target: 100 },
    { name: "Weekly Practice", value: Math.min(((stats?.thisWeekRecordings || 0) / 5) * 100, 100), target: 100 },
    { name: "Consistency", value: Math.min(((stats?.totalRecordings || 0) / 30) * 100, 100), target: 100 },
    { name: "Total Progress", value: Math.min((stats?.totalHours || 0), 100), target: 100 }
  ];

  const recentActivity = (recordings || []).slice(0, 4).map(recording => {
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
  });

  // Journey milestones
  const journeyMilestones = [
    { level: "Beginner", minRecordings: 0, icon: "🌱", unlocked: true },
    { level: "Improving", minRecordings: 5, icon: "🚀", unlocked: (stats?.totalRecordings || 0) >= 5 },
    { level: "Confident", minRecordings: 15, icon: "💪", unlocked: (stats?.totalRecordings || 0) >= 15 },
    { level: "Expert", minRecordings: 30, icon: "🏆", unlocked: (stats?.totalRecordings || 0) >= 30 }
  ];

  const currentMilestone = journeyMilestones.filter(m => m.unlocked).pop() || journeyMilestones[0];

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
                  <h3 className="font-semibold text-lg mb-1">Analysis Ready</h3>
                  <p className="text-muted-foreground text-sm">
                    Your recording from {new Date(latestRecording?.created_at || "").toLocaleDateString()} has been processed.
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
                    <span className="text-4xl font-bold">{currentStreak}</span>
                    <span className="text-muted-foreground">days</span>
                    {currentStreak > 0 && <Flame className="h-6 w-6 text-orange-500 animate-pulse" />}
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
              <Progress value={(currentStreak / longestStreak) * 100} className="h-2" />
            </CardContent>
          </Card>

          {/* Journey Map */}
          <Card className="animate-slide-up border-border/50" style={{ animationDelay: '0.1s' }}>
            <CardHeader>
              <CardTitle>Your Journey</CardTitle>
              <CardDescription>Progress through skill levels</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                {journeyMilestones.map((milestone, idx) => (
                  <div key={milestone.level} className="flex flex-col items-center relative flex-1">
                    <div 
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-all duration-300 ${
                        milestone.unlocked 
                          ? 'bg-primary/10 border-2 border-primary scale-110' 
                          : 'bg-muted border-2 border-border opacity-40'
                      }`}
                    >
                      {milestone.unlocked ? milestone.icon : '🔒'}
                    </div>
                    <p className={`text-xs mt-2 font-medium ${milestone.unlocked ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {milestone.level}
                    </p>
                    {idx < journeyMilestones.length - 1 && (
                      <div className={`absolute top-6 left-[60%] w-full h-0.5 ${
                        journeyMilestones[idx + 1].unlocked ? 'bg-primary' : 'bg-border'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
              <p className="text-sm text-center text-muted-foreground">
                You're at <strong className="text-foreground">{currentMilestone.level}</strong> level! 
                {stats?.totalRecordings && stats.totalRecordings < 30 && (
                  <span> Keep going to unlock the next milestone.</span>
                )}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Achievement Badges */}
        <Card className="mb-8 animate-slide-up border-border/50" style={{ animationDelay: '0.2s' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Achievements
            </CardTitle>
            <CardDescription>Earn badges by reaching milestones</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {achievements.map((achievement) => {
                const Icon = achievement.icon;
                return (
                  <div 
                    key={achievement.id}
                    className={`relative p-4 rounded-lg border-2 transition-all duration-300 ${
                      achievement.unlocked 
                        ? 'border-primary/20 bg-primary/5 hover:border-primary/40 hover-lift' 
                        : 'border-border bg-muted/30 opacity-60'
                    }`}
                  >
                    <div className="flex flex-col items-center text-center gap-2">
                      <div className={`p-3 rounded-full ${achievement.unlocked ? 'bg-background' : 'bg-muted'}`}>
                        {achievement.unlocked ? (
                          <Icon className={`h-6 w-6 ${achievement.color}`} />
                        ) : (
                          <Lock className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{achievement.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">{achievement.description}</p>
                      </div>
                      {achievement.unlocked && (
                        <Badge variant="outline" className="mt-1 text-xs border-primary/50 text-primary">
                          Unlocked
                        </Badge>
                      )}
                    </div>
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
