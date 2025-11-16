import { Video, MessageSquare, Heart, Target, TrendingUp, Sparkles, Brain, Users, Zap, Shield } from "lucide-react";
import { Card } from "@/components/ui/card";

const FeatureGrid = () => {
  const features = [
    {
      icon: Video,
      title: "Daily Video Practice",
      description: "Record 5-10 minute self-reflections and build a consistent habit for improvement"
    },
    {
      icon: MessageSquare,
      title: "Speech Clarity Analysis",
      description: "Get feedback on pacing, volume, filler words, and articulation patterns"
    },
    {
      icon: Heart,
      title: "Emotional Intelligence",
      description: "Understand your tone, facial expressions, and emotional presence"
    },
    {
      icon: Target,
      title: "Personalized Goals",
      description: "Receive tailored tips and exercises based on your unique patterns"
    },
    {
      icon: TrendingUp,
      title: "Progress Tracking",
      description: "Visualize your improvement journey with detailed charts and metrics"
    },
    {
      icon: Brain,
      title: "AI-Powered Insights",
      description: "Advanced analysis that learns and adapts to your communication style"
    },
    {
      icon: Users,
      title: "Compare & Benchmark",
      description: "See how you stack up against your past self and track milestones"
    },
    {
      icon: Zap,
      title: "Instant Feedback",
      description: "Get comprehensive analysis within seconds of uploading your video"
    },
    {
      icon: Shield,
      title: "Private & Secure",
      description: "Your videos are encrypted and only visible to you. Full privacy guaranteed"
    }
  ];

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
            <Sparkles className="h-4 w-4" />
            MVP Features
          </div>
          <h2 className="text-4xl font-bold mb-4">Everything You Need to Improve</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Our MVP delivers powerful features to kickstart your communication transformation
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={index}
                className="p-6 hover-lift cursor-default border hover:border-border/80 transition-all group"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-brand-green/20 to-accent/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Icon className="h-6 w-6 text-brand-green" />
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Bottom Note */}
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            More features coming soon including peer comparison, coaching sessions, and advanced analytics
          </p>
        </div>
      </div>
    </section>
  );
};

export default FeatureGrid;
