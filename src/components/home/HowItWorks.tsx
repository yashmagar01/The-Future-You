import { Upload, Brain, TrendingUp, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";

const HowItWorks = () => {
  const steps = [
    {
      icon: Upload,
      step: "01",
      title: "Upload Your Reflection",
      description: "Record a 5-10 minute video reflection on your day, goals, or practice presentation. Our platform supports webcam recording or file upload.",
      color: "from-brand-green to-brand-green/70"
    },
    {
      icon: Brain,
      step: "02",
      title: "AI Analysis",
      description: "Our advanced AI analyzes your speech patterns, body language, emotion, pacing, and clarity. Get insights on filler words, tone, and confidence markers.",
      color: "from-accent to-accent/70"
    },
    {
      icon: TrendingUp,
      step: "03",
      title: "Improve & Track",
      description: "Receive personalized feedback and actionable tips. Track your progress over time with detailed metrics and see your confidence grow with every session.",
      color: "from-primary to-primary/70"
    }
  ];

  return (
    <section className="py-20 px-4 bg-muted/30">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">How It Works</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Three simple steps to transform your communication skills
          </p>
        </div>

        <div className="relative">
          {/* Connection Lines (Desktop) */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-brand-green via-accent to-primary -translate-y-1/2 -z-10" />
          
          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={index} className="relative">
                  <Card className="p-8 h-full hover-lift cursor-default bg-card border-2 hover:border-border/80 transition-all">
                    {/* Step Number Badge */}
                    <div className={`absolute -top-4 left-8 px-4 py-2 rounded-full bg-gradient-to-r ${step.color} text-white font-bold text-sm shadow-lg`}>
                      Step {step.step}
                    </div>

                    {/* Icon */}
                    <div className={`h-16 w-16 rounded-xl bg-gradient-to-r ${step.color} flex items-center justify-center mb-6 mt-4`}>
                      <Icon className="h-8 w-8 text-white" />
                    </div>

                    {/* Content */}
                    <h3 className="text-2xl font-bold mb-4">{step.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </Card>

                  {/* Arrow between steps (Desktop) */}
                  {index < steps.length - 1 && (
                    <div className="hidden lg:flex absolute top-1/2 -right-6 xl:-right-8 -translate-y-1/2 z-10">
                      <div className={`h-12 w-12 rounded-full bg-gradient-to-r ${step.color} flex items-center justify-center shadow-lg`}>
                        <ArrowRight className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  )}

                  {/* Arrow between steps (Mobile) */}
                  {index < steps.length - 1 && (
                    <div className="flex lg:hidden justify-center my-4">
                      <div className={`h-12 w-12 rounded-full bg-gradient-to-r ${step.color} flex items-center justify-center shadow-lg rotate-90`}>
                        <ArrowRight className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
