import { Sparkles, Rocket, Heart, MessageSquare, Shield, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";

const TestimonialGrid = () => {
  const benefits = [
    {
      icon: Rocket,
      title: "Early Access",
      description: "Be among the first to experience our cutting-edge AI coaching tools before the public launch.",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10"
    },
    {
      icon: MessageSquare,
      title: "Shape the Product",
      description: "Your feedback will directly influence our roadmap and feature development. Build the tool you need.",
      color: "text-purple-500",
      bgColor: "bg-purple-500/10"
    },
    {
      icon: Heart,
      title: "Founder Access",
      description: "Direct line to the development team. We're building this for you, and we want to hear your story.",
      color: "text-red-500",
      bgColor: "bg-red-500/10"
    },
    {
      icon: Shield,
      title: "Privacy First",
      description: "Test our local-first architecture where your video data never leaves your device without permission.",
      color: "text-brand-green",
      bgColor: "bg-brand-green/10"
    },
    {
      icon: Zap,
      title: "Priority Features",
      description: "Beta users get first dibs on new features like interview prep and real-time analysis.",
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10"
    },
    {
      icon: Sparkles,
      title: "Forever Free Tier",
      description: "Early adopters secure a generous free tier for life as a thank you for your support.",
      color: "text-orange-500",
      bgColor: "bg-orange-500/10"
    }
  ];

  return (
    <section className="py-20 px-4 bg-muted/30">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-green/10 text-brand-green text-sm font-medium mb-4">
            <Sparkles className="h-4 w-4 fill-current" />
            Join the Revolution
          </div>
          <h2 className="text-4xl font-bold mb-4">Why Join the Beta?</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Help us build the future of communication coaching and get exclusive perks.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <Card 
                key={index}
                className="p-6 hover-lift cursor-default border hover:border-border/80 transition-all group relative overflow-hidden"
                style={{ 
                  animationDelay: `${index * 75}ms`,
                  borderLeft: `4px solid currentColor` 
                }}
              >
                {/* Colored Border Hack using text color inheritance or explicit style */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${benefit.color.replace('text-', 'bg-')}`} />

                {/* Icon */}
                <div className={`w-12 h-12 rounded-xl ${benefit.bgColor} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className={`h-6 w-6 ${benefit.color}`} />
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">{benefit.title}</h3>

                {/* Description */}
                <p className="text-muted-foreground leading-relaxed group-hover:text-foreground/80 transition-colors">
                  {benefit.description}
                </p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default TestimonialGrid;
