import { Video, MessageSquare, Heart, Eye, TrendingUp, Target, Users, Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const MVPFeatureGrid = () => {
  const features = [
    {
      icon: Video,
      title: "Daily Video Upload & Private Analysis",
      description: "Record or upload 5-10 minute reflections with end-to-end encryption and private storage.",
      priority: "MVP",
      testId: "feature-video-upload"
    },
    {
      icon: MessageSquare,
      title: "Speech Clarity Scoring",
      description: "Get detailed analysis of pacing, volume, filler words, and articulation patterns.",
      priority: "MVP",
      testId: "feature-speech-clarity"
    },
    {
      icon: Heart,
      title: "Emotional Tone Snapshot",
      description: "AI-powered emotion detection from voice and facial expressions to understand your tone.",
      priority: "MVP",
      testId: "feature-emotion-tone"
    },
    {
      icon: Eye,
      title: "Posture & Gesture Insights",
      description: "Real-time pose analysis tracks body language, gestures, and confidence markers.",
      priority: "MVP",
      testId: "feature-posture-gesture"
    },
    {
      icon: TrendingUp,
      title: "Progress Dashboard & Charts",
      description: "Visualize your improvement journey with detailed metrics and trend analysis over time.",
      priority: "MVP",
      testId: "feature-progress-dashboard"
    },
    {
      icon: Target,
      title: "Personalized Tips & Exercises",
      description: "Receive tailored improvement suggestions and practice exercises based on your patterns.",
      priority: "MVP",
      testId: "feature-personalized-tips"
    },
    {
      icon: Users,
      title: "Live Roleplay Sessions",
      description: "Practice with AI-powered conversation partners or real peers in scheduled sessions.",
      priority: "NVP",
      testId: "feature-live-roleplay"
    },
    {
      icon: Trophy,
      title: "Gamification & Badges",
      description: "Earn achievements, unlock badges, and compete on leaderboards to stay motivated.",
      priority: "NVP",
      testId: "feature-gamification"
    }
  ];

  const getPriorityColor = (priority: string) => {
    return priority === "MVP" 
      ? "bg-brand-green/10 text-brand-green border-brand-green/20" 
      : "bg-amber-500/10 text-amber-600 border-amber-500/20";
  };

  const getPriorityLabel = (priority: string) => {
    return priority === "MVP" ? "MVP" : "Next Version";
  };

  return (
    <section className="py-20 px-4" aria-labelledby="features-heading">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-green/10 text-brand-green text-sm font-medium mb-4">
            <Trophy className="h-4 w-4" />
            Feature Roadmap
          </div>
          <h2 id="features-heading" className="text-4xl font-bold mb-4">MVP & Next Version Features</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Core features available now (MVP) and exciting additions coming in the next version (NVP)
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const isMVP = feature.priority === "MVP";

            return (
              <Card 
                key={index}
                className="p-6 hover-lift cursor-default border-2 hover:border-border/80 transition-all group relative"
                style={{ animationDelay: `${index * 50}ms` }}
                data-testid={feature.testId}
                role="article"
                aria-label={`${feature.title} - ${getPriorityLabel(feature.priority)}`}
              >
                {/* Priority Badge */}
                <div className="absolute -top-3 -right-3">
                  <Badge 
                    className={`${getPriorityColor(feature.priority)} border px-2.5 py-1 text-xs font-semibold shadow-sm`}
                    aria-label={`Priority: ${getPriorityLabel(feature.priority)}`}
                  >
                    {feature.priority}
                  </Badge>
                </div>

                {/* Icon */}
                <div className={`h-12 w-12 rounded-lg ${isMVP ? 'bg-brand-green/10' : 'bg-amber-500/10'} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className={`h-6 w-6 ${isMVP ? 'text-brand-green' : 'text-amber-600'}`} aria-hidden="true" />
                </div>

                {/* Title */}
                <h3 className="text-base font-semibold mb-2 leading-tight">
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>

                {/* Status Indicator */}
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${isMVP ? 'bg-brand-green' : 'bg-amber-500'} animate-pulse`} aria-hidden="true" />
                    <span className={`text-xs font-medium ${isMVP ? 'text-brand-green' : 'text-amber-600'}`}>
                      {isMVP ? 'Available Now' : 'Coming Soon'}
                    </span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-12 flex flex-wrap justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-brand-green" aria-hidden="true" />
            <span className="text-muted-foreground">
              <span className="font-semibold text-brand-green">MVP</span> - Minimum Viable Product (Available Now)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-amber-500" aria-hidden="true" />
            <span className="text-muted-foreground">
              <span className="font-semibold text-amber-600">NVP</span> - Next Version Product (Coming Q2 2025)
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MVPFeatureGrid;
