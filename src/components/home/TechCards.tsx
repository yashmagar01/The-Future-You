import { Mic, Smile, Eye, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";

const TechCards = () => {
  const technologies = [
    {
      icon: Mic,
      title: "Speech-to-Text",
      description: "Advanced ASR technology transcribes your speech with 95%+ accuracy, analyzing filler words, pacing, and articulation patterns.",
      tech: "Whisper AI, WebSpeech API",
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-500/10"
    },
    {
      icon: Smile,
      title: "Emotion Detection",
      description: "Facial expression analysis identifies emotional states, helping you understand your tone and presence during communication.",
      tech: "TensorFlow.js, FER Models",
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-500/10"
    },
    {
      icon: Eye,
      title: "Pose & Gesture Analysis",
      description: "MediaPipe tracks body language, posture, and hand gestures to provide insights on your physical communication confidence.",
      tech: "MediaPipe, Pose Detection",
      color: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-500/10"
    },
    {
      icon: Sparkles,
      title: "LLM Summarization",
      description: "GPT-4 powered analysis generates personalized feedback, actionable tips, and tracks improvement patterns over time.",
      tech: "OpenAI GPT-4, RAG Pipeline",
      color: "from-brand-green to-green-600",
      bgColor: "bg-brand-green/10"
    }
  ];

  return (
    <section className="py-20 px-4">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-green/10 text-brand-green text-sm font-medium mb-4">
            <Sparkles className="h-4 w-4" />
            Powered by Advanced AI
          </div>
          <h2 className="text-4xl font-bold mb-4">Tech & Implementation</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Cutting-edge AI models working together to analyze every aspect of your communication
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {technologies.map((tech, index) => {
            const Icon = tech.icon;
            return (
              <Card 
                key={index}
                className="p-6 hover-lift cursor-default border-2 hover:border-border/80 transition-all group"
                style={{ animationDelay: `${index * 75}ms` }}
              >
                {/* Icon with gradient background */}
                <div className="relative mb-6">
                  <div className={`h-14 w-14 rounded-xl bg-gradient-to-br ${tech.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                    <Icon className="h-7 w-7 text-white" />
                  </div>
                  {/* Glow effect */}
                  <div className={`absolute inset-0 h-14 w-14 rounded-xl bg-gradient-to-br ${tech.color} opacity-0 group-hover:opacity-20 blur-xl transition-opacity`} />
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold mb-3">{tech.title}</h3>

                {/* Description */}
                <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
                  {tech.description}
                </p>

                {/* Tech Stack Badge */}
                <div className={`inline-flex items-center px-3 py-1.5 rounded-full ${tech.bgColor} text-xs font-medium`}>
                  {tech.tech}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            All processing happens securely and your data is encrypted end-to-end
          </p>
        </div>
      </div>
    </section>
  );
};

export default TechCards;
