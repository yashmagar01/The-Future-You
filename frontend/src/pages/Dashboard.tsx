import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
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
  Loader2
} from "lucide-react";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { useStats, useWeeklyActivity, usePerformanceTrend, useRecordings } from "@/hooks/useRecordings";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

const Dashboard = () => {
  const { user } = useAuth();
  const { data: stats, isLoading: statsLoading } = useStats();
  const { data: weeklyData, isLoading: weeklyLoading } = useWeeklyActivity();
  const { data: performanceData, isLoading: performanceLoading } = usePerformanceTrend();
  const { data: recordings } = useRecordings();

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
    const isPending = recording.status === 'pending' || recording.status === 'processing';
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

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Welcome Section */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold mb-2">
            Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}
          </h1>
          <p className="text-muted-foreground text-lg">
            Here's your performance overview and insights
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {statsLoading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <Card key={index} className="border-border/50">
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-4 w-32" />
                </CardContent>
              </Card>
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

        <div className="grid gap-6 lg:grid-cols-2 mb-8">
          {/* Performance Chart */}
          <Card className="animate-slide-up border-border/50">
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

          {/* Weekly Activity */}
          <Card className="animate-slide-up border-border/50" style={{ animationDelay: '0.1s' }}>
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
        </div>

        <div className="grid gap-6 lg:grid-cols-3 mb-8">
          {/* Progress Tracking */}
          <Card className="lg:col-span-2 animate-slide-up border-border/50" style={{ animationDelay: '0.2s' }}>
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
          <Card className="animate-slide-up border-border/50" style={{ animationDelay: '0.3s' }}>
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
                          {activity.status === 'pending' && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-accent/20 text-accent">
                              Pending
                            </span>
                          )}
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
