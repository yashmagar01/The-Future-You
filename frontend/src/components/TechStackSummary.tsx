import { useState } from "react";
import { Mic, Smile, Eye, Sparkles, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const TechStackSummary = () => {
  const [expandedCards, setExpandedCards] = useState<Record<number, boolean>>({});

  const toggleCard = (index: number) => {
    setExpandedCards(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const techStack = [
    {
      icon: Mic,
      title: "Transcription (Whisper/AWS)",
      rationale: "OpenAI's Whisper provides state-of-the-art speech recognition with multilingual support and high accuracy.",
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-500/10",
      details: {
        apis: ["OpenAI Whisper API", "AWS Transcribe (fallback)"],
        whyChosen: [
          "99%+ accuracy across accents and languages",
          "Open-source model with cloud API option",
          "Excellent handling of filler words and pauses",
          "Cost-effective at $0.006/minute"
        ],
        costConsiderations: [
          "Primary: Whisper API (~$0.36/hour)",
          "Fallback: AWS Transcribe (~$0.024/minute)",
          "Self-hosted option available for high-volume"
        ],
        docsLink: "https://platform.openai.com/docs/guides/speech-to-text"
      }
    },
    {
      icon: Smile,
      title: "Emotion Detection (Hume/Azure)",
      rationale: "Hume AI's empathic AI detects 48+ emotions from voice and facial expressions with industry-leading accuracy.",
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-500/10",
      details: {
        apis: ["Hume AI API", "Azure Face API (secondary)"],
        whyChosen: [
          "Detects 48 emotional states from voice & face",
          "Real-time prosody analysis (tone, pitch, energy)",
          "Superior to AWS Rekognition in academic benchmarks",
          "Single API for both audio and visual emotion"
        ],
        costConsiderations: [
          "Primary: Hume AI (~$0.002/second)",
          "Fallback: Azure Face API (~$1/1000 calls)",
          "Free tier: 500 requests/month"
        ],
        docsLink: "https://dev.hume.ai/docs"
      }
    },
    {
      icon: Eye,
      title: "Pose/Posture (MediaPipe)",
      rationale: "Google's MediaPipe offers real-time pose detection in the browser with zero API costs and full privacy.",
      color: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-500/10",
      details: {
        apis: ["MediaPipe Pose (TensorFlow.js)", "MediaPipe Holistic"],
        whyChosen: [
          "Client-side processing = zero cost & full privacy",
          "33 body landmarks tracked at 30+ FPS",
          "Detects posture, hand gestures, eye contact",
          "No video upload required for pose analysis"
        ],
        costConsiderations: [
          "Completely free (runs in browser)",
          "No API keys or usage limits",
          "Reduces server bandwidth costs",
          "Optional: GPU acceleration for better performance"
        ],
        docsLink: "https://developers.google.com/mediapipe/solutions/vision/pose_landmarker"
      }
    },
    {
      icon: Sparkles,
      title: "Analysis & Summaries (Gemini)",
      rationale: "Google's Gemini 1.5 Flash provides high-speed, multimodal reasoning to generate personalized feedback from transcripts and sensor data.",
      color: "from-emerald-500 to-emerald-600",
      bgColor: "bg-emerald-500/10",
      details: {
        apis: ["Google Gemini 1.5 Flash", "Gemini 1.5 Pro (advanced)"],
        whyChosen: [
          "Extremely fast inference for real-time feedback",
          "Large context window (1M tokens) for long sessions",
          "Multimodal capabilities (text, audio, video)",
          "Cost-effective compared to GPT-4o"
        ],
        costConsiderations: [
          "Flash: Free tier available (15 RPM)",
          "Pay-as-you-go: ~$0.35 / 1M input tokens",
          "Significantly cheaper than OpenAI equivalents",
          "Efficient for high-volume processing"
        ],
        docsLink: "https://ai.google.dev/gemini-api/docs"
      }
    }
  ];

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-muted/30 to-background">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Sparkles className="h-4 w-4" />
            Tech Stack Deep Dive
          </div>
          <h2 className="text-4xl font-bold mb-4">Implementation Choices</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Developer-facing details on our AI infrastructure, API choices, and cost optimization strategies
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {techStack.map((tech, index) => {
            const Icon = tech.icon;
            const isExpanded = expandedCards[index];

            return (
              <Card 
                key={index}
                className="p-6 border-2 hover:border-border/80 transition-all"
                style={{ animationDelay: `${index * 75}ms` }}
              >
                {/* Header */}
                <div className="flex items-start gap-4 mb-4">
                  <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${tech.color} flex items-center justify-center shadow-lg flex-shrink-0`}>
                    <Icon className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold mb-2">{tech.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {tech.rationale}
                    </p>
                  </div>
                </div>

                {/* Expandable Content */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-border space-y-4 animate-fade-in">
                    {/* APIs */}
                    <div>
                      <h4 className="text-sm font-semibold mb-2 text-foreground">APIs Used</h4>
                      <div className="flex flex-wrap gap-2">
                        {tech.details.apis.map((api, idx) => (
                          <span 
                            key={idx}
                            className={`inline-flex items-center px-3 py-1 rounded-full ${tech.bgColor} text-xs font-medium`}
                          >
                            {api}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Why Chosen */}
                    <div>
                      <h4 className="text-sm font-semibold mb-2 text-foreground">Why We Chose This</h4>
                      <ul className="space-y-1.5">
                        {tech.details.whyChosen.map((reason, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs text-muted-foreground">
                            <span className="text-brand-green mt-1">•</span>
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Cost Considerations */}
                    <div>
                      <h4 className="text-sm font-semibold mb-2 text-foreground">Cost Considerations</h4>
                      <ul className="space-y-1.5">
                        {tech.details.costConsiderations.map((cost, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs text-muted-foreground">
                            <span className="text-primary mt-1">$</span>
                            <span>{cost}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Documentation Link */}
                    <div>
                      <a
                        href={tech.details.docsLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-brand-green hover:text-brand-green/80 transition-colors font-medium"
                      >
                        View Documentation
                        <ExternalLink className="h-4 w-4" aria-hidden="true" />
                      </a>
                    </div>
                  </div>
                )}

                {/* Toggle Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleCard(index)}
                  className="w-full mt-4 text-xs"
                  aria-expanded={isExpanded}
                  aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${tech.title} details`}
                >
                  {isExpanded ? (
                    <>
                      Show Less <ChevronUp className="ml-2 h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Read More <ChevronDown className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </Card>
            );
          })}
        </div>

        {/* Bottom Note */}
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground max-w-3xl mx-auto">
            All cost estimates are based on current pricing (Nov 2025) and optimized usage patterns. 
            Actual costs may vary based on volume and regional pricing.
          </p>
        </div>
      </div>
    </section>
  );
};

export default TechStackSummary;
