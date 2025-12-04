import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ExternalLink, Cpu, Activity, Brain, Mic, FileText } from "lucide-react";

export default function TechStackSummary() {
  const docsLink = "/mnt/data/Final Tech Stack.pdf";

  const stackItems = [
    {
      title: "Speech-to-Text",
      icon: <Mic className="h-5 w-5 text-primary" />,
      tech: "OpenAI Whisper (faster-whisper)",
      description: "State-of-the-art speech recognition using OpenAI's Whisper model via CTranslate2.",
      details: "Base.en model with INT8 quantization. Word-level timestamps and filler word prompting.",
      status: "Local-First"
    },
    {
      title: "Emotion & Sentiment",
      icon: <Activity className="h-5 w-5 text-primary" />,
      tech: "Transformers.js (Multi-Emotion)",
      description: "11-category emotion classifier: joy, love, optimism, trust, anticipation, surprise, sadness, fear, pessimism, disgust, anger.",
      details: "Weighted scoring system provides nuanced tone analysis beyond simple positive/negative.",
      status: "Local-First"
    },
    {
      title: "Pose & Posture",
      icon: <Cpu className="h-5 w-5 text-primary" />,
      tech: "MediaPipe Pose",
      description: "Real-time body landmark detection for posture analysis using Google's MediaPipe.",
      details: "Runs entirely client-side via WebAssembly.",
      status: "Client-Side"
    },
    {
      title: "Summaries & Thoughts",
      icon: <Brain className="h-5 w-5 text-primary" />,
      tech: "Transformers.js (BART/Pegasus)",
      description: "Local summarization and thought structure analysis using distilled LLMs.",
      details: "Replaces Gemini/GPT-4. Generates insights without external API calls.",
      status: "Local-First"
    },
    {
      title: "Speech Clarity",
      icon: <FileText className="h-5 w-5 text-primary" />,
      tech: "Custom Regex + NLP",
      description: "Filler word detection and clarity scoring using optimized pattern matching.",
      details: "Lightweight, instant feedback on 'um', 'uh', and pacing.",
      status: "Custom Logic"
    }
  ];

  return (
    <Card className="w-full h-full bg-card/50 backdrop-blur-sm border-primary/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cpu className="h-6 w-6 text-primary" />
          MVP Tech Stack
        </CardTitle>
        <CardDescription>
          Local-first architecture (Privacy & Performance)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {stackItems.map((item, index) => (
              <Card key={index} className="bg-muted/50 border-none">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {item.icon}
                      <CardTitle className="text-base">{item.title}</CardTitle>
                    </div>
                    <Badge variant="outline" className="bg-background/50">
                      {item.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-primary">{item.tech}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {item.description}
                    </p>
                    <p className="text-xs text-muted-foreground/80 italic border-l-2 border-primary/20 pl-2">
                      {item.details}
                    </p>
                    <a 
                      href={docsLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[10px] text-primary hover:underline flex items-center gap-1 mt-2"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Source: Final Tech Stack.pdf
                    </a>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}


