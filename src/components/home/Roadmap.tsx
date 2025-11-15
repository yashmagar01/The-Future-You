import { CheckCircle2, Clock, Rocket } from "lucide-react";
import { Card } from "@/components/ui/card";

const Roadmap = () => {
  const phases = [
    {
      phase: "MVP",
      status: "current",
      icon: CheckCircle2,
      color: "from-brand-green to-green-600",
      bgColor: "bg-brand-green/10",
      textColor: "text-brand-green",
      items: [
        "Video recording & upload",
        "Speech-to-text transcription",
        "Basic emotion detection",
        "Progress dashboard",
        "User authentication"
      ]
    },
    {
      phase: "Dream",
      status: "upcoming",
      icon: Rocket,
      color: "from-accent to-blue-600",
      bgColor: "bg-accent/10",
      textColor: "text-accent",
      items: [
        "Advanced pose analysis",
        "Peer comparison features",
        "Live coaching sessions",
        "Mobile app launch",
        "Enterprise solutions"
      ]
    }
  ];

  const milestones = [
    { quarter: "Q1 2025", label: "MVP Launch", status: "completed" },
    { quarter: "Q2 2025", label: "Beta Testing", status: "current" },
    { quarter: "Q3 2025", label: "Mobile App", status: "upcoming" },
    { quarter: "Q4 2025", label: "Enterprise", status: "upcoming" }
  ];

  return (
    <section className="py-20 px-4">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Clock className="h-4 w-4" />
            Product Roadmap
          </div>
          <h2 className="text-4xl font-bold mb-4">Our Journey</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            From MVP to dream features — here's what we're building
          </p>
        </div>

        {/* Timeline Bar */}
        <div className="mb-16">
          <div className="relative">
            {/* Progress Line */}
            <div className="absolute top-6 left-0 w-full h-1 bg-border" />
            <div className="absolute top-6 left-0 w-1/2 h-1 bg-gradient-to-r from-brand-green to-accent" />

            {/* Milestones */}
            <div className="relative grid grid-cols-2 md:grid-cols-4 gap-4">
              {milestones.map((milestone, index) => (
                <div key={index} className="text-center">
                  <div className={`inline-flex h-12 w-12 rounded-full items-center justify-center mb-3 ${
                    milestone.status === 'completed' 
                      ? 'bg-brand-green text-white' 
                      : milestone.status === 'current'
                      ? 'bg-accent text-white'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {milestone.status === 'completed' ? (
                      <CheckCircle2 className="h-6 w-6" />
                    ) : (
                      <Clock className="h-6 w-6" />
                    )}
                  </div>
                  <p className="font-semibold text-sm mb-1">{milestone.quarter}</p>
                  <p className="text-xs text-muted-foreground">{milestone.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Phase Cards */}
        <div className="grid md:grid-cols-2 gap-8">
          {phases.map((phase, index) => {
            const Icon = phase.icon;
            return (
              <Card 
                key={index}
                className="p-8 hover-lift cursor-default border-2 hover:border-border/80 transition-all"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                  <div className={`h-14 w-14 rounded-xl bg-gradient-to-br ${phase.color} flex items-center justify-center shadow-lg`}>
                    <Icon className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">{phase.phase} Phase</h3>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full ${phase.bgColor} ${phase.textColor} text-xs font-medium mt-1`}>
                      {phase.status === 'current' ? 'In Progress' : 'Coming Soon'}
                    </span>
                  </div>
                </div>

                {/* Feature List */}
                <ul className="space-y-3">
                  {phase.items.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <CheckCircle2 className={`h-5 w-5 ${phase.textColor} flex-shrink-0 mt-0.5`} />
                      <span className="text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <p className="text-muted-foreground mb-4">
            Want to influence our roadmap? Join our community and share your feedback!
          </p>
          <button className="text-brand-green hover:text-brand-green/80 font-semibold text-sm transition-colors">
            Join the Conversation →
          </button>
        </div>
      </div>
    </section>
  );
};

export default Roadmap;
