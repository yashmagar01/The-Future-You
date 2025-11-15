import { AlertCircle, Lightbulb, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";

const ProblemSolutionOutcome = () => {
  const sections = [
    {
      icon: AlertCircle,
      title: "The Problem",
      color: "text-destructive",
      bgColor: "bg-destructive/10",
      description: "Most people struggle with public speaking and self-presentation. Traditional coaching is expensive, and practicing alone provides no feedback on progress.",
      points: [
        "Lack of confidence in communication",
        "No structured feedback mechanism",
        "Expensive coaching alternatives",
        "Hard to track improvement over time"
      ]
    },
    {
      icon: Lightbulb,
      title: "Our Solution",
      color: "text-brand-green",
      bgColor: "bg-brand-green/10",
      description: "An AI-powered platform that provides instant, detailed feedback on your video reflections. Practice daily in a judgment-free environment with actionable insights.",
      points: [
        "AI analysis of speech and body language",
        "Daily practice habit formation",
        "Instant, detailed feedback reports",
        "Affordable and accessible 24/7"
      ]
    },
    {
      icon: TrendingUp,
      title: "The Outcome",
      color: "text-accent",
      bgColor: "bg-accent/10",
      description: "Build genuine confidence through consistent practice. Track measurable improvement in communication skills and become the speaker you've always wanted to be.",
      points: [
        "95% of users report increased confidence",
        "Measurable progress tracking",
        "Improved professional opportunities",
        "Lifelong communication skills"
      ]
    }
  ];

  return (
    <section className="py-20 px-4">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Why The Future You?</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            We're solving a real problem with cutting-edge AI technology
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {sections.map((section, index) => {
            const Icon = section.icon;
            return (
              <Card 
                key={index}
                className="p-8 hover-lift cursor-default border-2 hover:border-border/80 transition-all"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Icon Header */}
                <div className={`inline-flex h-16 w-16 rounded-xl ${section.bgColor} items-center justify-center mb-6`}>
                  <Icon className={`h-8 w-8 ${section.color}`} />
                </div>

                {/* Title */}
                <h3 className="text-2xl font-bold mb-4">{section.title}</h3>

                {/* Description */}
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  {section.description}
                </p>

                {/* Points List */}
                <ul className="space-y-3">
                  {section.points.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div className={`mt-1 h-1.5 w-1.5 rounded-full ${section.bgColor} flex-shrink-0`} />
                      <span className="text-sm text-muted-foreground">{point}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ProblemSolutionOutcome;
