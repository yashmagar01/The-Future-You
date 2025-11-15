import { Upload, Brain, TrendingUp, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";

const HowItWorks = () => {
  const steps = [
    {
      icon: Upload,
      step: "01",
      title: "Upload your 5–10 min video",
      ariaLabel: "Step 1: Upload your 5 to 10 minute video reflection",
      bullets: [
        "Record via webcam or upload file",
        "Practice presentations or daily reflections",
        "Secure, private storage"
      ],
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-500/10"
    },
    {
      icon: Brain,
      step: "02",
      title: "AI analyzes voice & posture",
      ariaLabel: "Step 2: AI analyzes your voice and posture",
      bullets: [
        "Speech patterns & filler words",
        "Body language & facial expressions",
        "Tone, pacing, and confidence markers"
      ],
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-500/10"
    },
    {
      icon: TrendingUp,
      step: "03",
      title: "Get actionable tips & goals",
      ariaLabel: "Step 3: Get actionable tips and personalized goals",
      bullets: [
        "Personalized improvement suggestions",
        "Track progress with detailed metrics",
        "Set and achieve communication goals"
      ],
      color: "from-emerald-500 to-emerald-600",
      bgColor: "bg-emerald-500/10"
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
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-green-500 via-blue-500 to-emerald-500 -translate-y-1/2 -z-10" />
          
          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div 
                  key={index} 
                  className="relative animate-fade-in"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <Card 
                    className="p-8 h-full hover-lift cursor-default bg-card border-2 hover:border-border/80 transition-all focus-within:ring-2 focus-within:ring-brand-green/50 overflow-visible"
                    tabIndex={0}
                    role="article"
                    aria-label={step.ariaLabel}
                  >
                    {/* Step Number Badge */}
                    <div className={`absolute -top-3 left-6 px-4 py-2 rounded-full bg-gradient-to-r ${step.color} text-white font-bold text-sm shadow-lg z-10`}>
                      Step {step.step}
                    </div>

                    {/* Icon */}
                    <div className={`h-16 w-16 rounded-xl bg-gradient-to-r ${step.color} flex items-center justify-center mb-6 mt-4`}>
                      <Icon className="h-8 w-8 text-white" aria-hidden="true" />
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold mb-4 leading-tight">{step.title}</h3>
                    
                    {/* Bullet Points */}
                    <ul className="space-y-3" role="list">
                      {step.bullets.map((bullet, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <div className={`mt-1.5 h-1.5 w-1.5 rounded-full ${step.bgColor} flex-shrink-0`} aria-hidden="true" />
                          <span className="text-muted-foreground text-sm leading-relaxed">
                            {bullet}
                          </span>
                        </li>
                      ))}
                    </ul>
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
