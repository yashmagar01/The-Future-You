import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Video, Play, TrendingUp, Calendar } from "lucide-react";
import Layout from "@/components/Layout";

const Gallery = () => {
  // Mock data for past recordings
  const recordings = [
    {
      id: 1,
      date: "2024-11-13",
      duration: "8:32",
      score: 87,
      thumbnail: null,
      improvements: ["Speech clarity +5", "Reduced filler words"],
    },
    {
      id: 2,
      date: "2024-11-12",
      duration: "6:45",
      score: 82,
      thumbnail: null,
      improvements: ["Better posture", "Eye contact improved"],
    },
    {
      id: 3,
      date: "2024-11-11",
      duration: "9:12",
      score: 79,
      thumbnail: null,
      improvements: ["Emotional tone +3"],
    },
  ];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold mb-3">Your Reflections</h1>
          <p className="text-muted-foreground text-lg">
            Review past recordings and track your improvement journey
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recordings.map((recording, index) => (
            <Card 
              key={recording.id} 
              className="overflow-hidden hover-lift group cursor-pointer"
              style={{ animationDelay: `${index * 75}ms` }}
            >
              <div className="aspect-video bg-muted relative flex items-center justify-center">
                <Video className="h-12 w-12 text-muted-foreground" />
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-accent/5" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <Button 
                    size="icon" 
                    className="opacity-0 group-hover:opacity-100 transition-opacity scale-90 group-hover:scale-100"
                  >
                    <Play className="h-5 w-5" />
                  </Button>
                </div>
                <Badge className="absolute top-2 right-2 bg-background/90">
                  {recording.duration}
                </Badge>
              </div>

              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {new Date(recording.date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="h-4 w-4 text-success" />
                    <span className="font-bold text-success">{recording.score}</span>
                    <span className="text-sm text-muted-foreground">/100</span>
                  </div>
                </div>

                <div className="space-y-1">
                  {recording.improvements.map((improvement, i) => (
                    <div 
                      key={i} 
                      className="text-xs text-muted-foreground flex items-start gap-1.5"
                    >
                      <span className="text-primary mt-0.5">•</span>
                      <span>{improvement}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {recordings.length === 0 && (
          <Card className="p-12 text-center animate-scale-in">
            <Video className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No recordings yet</h2>
            <p className="text-muted-foreground mb-6">
              Start your journey by recording your first reflection
            </p>
            <Button>Record Your First Video</Button>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default Gallery;
