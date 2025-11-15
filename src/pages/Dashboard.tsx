import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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
  CheckCircle2
} from "lucide-react";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

const Dashboard = () => {
  const { user } = useAuth();
  
  const stats = [
    {
      title: "Total Progress",
      value: "87%",
      change: "+12%",
      trend: "up",
      icon: TrendingUp,
      color: "text-primary"
    },
    {
      title: "Active Sessions",
      value: "24",
      change: "+8",
      trend: "up",
      icon: Activity,
      color: "text-accent"
    },
    {
      title: "Achievements",
      value: "15",
      change: "+3",
      trend: "up",
      icon: Award,
      color: "text-warning"
    },
    {
      title: "Time Invested",
      value: "142h",
      change: "+18h",
      trend: "up",
      icon: Clock,
      color: "text-success"
    }
  ];

  const progressData = [
    { name: "Focus Time", value: 85, target: 100 },
    { name: "Learning Goals", value: 72, target: 100 },
    { name: "Skill Development", value: 90, target: 100 },
    { name: "Weekly Targets", value: 65, target: 100 }
  ];

  const weeklyData = [
    { day: "Mon", value: 35 },
    { day: "Tue", value: 42 },
    { day: "Wed", value: 38 },
    { day: "Thu", value: 50 },
    { day: "Fri", value: 45 },
    { day: "Sat", value: 30 },
    { day: "Sun", value: 28 }
  ];

  const performanceData = [
    { month: "Jan", score: 65 },
    { month: "Feb", score: 72 },
    { month: "Mar", score: 68 },
    { month: "Apr", score: 78 },
    { month: "May", score: 85 },
    { month: "Jun", score: 87 }
  ];

  const recentActivity = [
    { title: "Completed Advanced Module", time: "2 hours ago", icon: CheckCircle2, color: "text-success" },
    { title: "New Milestone Reached", time: "5 hours ago", icon: Award, color: "text-warning" },
    { title: "Practice Session", time: "Yesterday", icon: Target, color: "text-accent" },
    { title: "Skill Assessment Passed", time: "2 days ago", icon: Zap, color: "text-primary" }
  ];

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
          {stats.map((stat, index) => {
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
                    <span className="text-muted-foreground ml-1">from last month</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
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
              {recentActivity.map((activity, index) => {
                const Icon = activity.icon;
                return (
                  <div 
                    key={index} 
                    className="flex items-start gap-3 pb-4 border-b border-border/50 last:border-0 last:pb-0"
                  >
                    <div className={`p-2 rounded-lg bg-muted ${activity.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {activity.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
