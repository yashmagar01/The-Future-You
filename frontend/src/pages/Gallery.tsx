import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Video, Play, TrendingUp, Calendar, AlertCircle } from "lucide-react";
import Layout from "@/components/Layout";
import { useRecordings } from "@/hooks/useRecordings";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Gallery = () => {
  const { data: recordings, isLoading, error } = useRecordings();

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold mb-3">Your Reflections</h1>
          <p className="text-muted-foreground text-lg">
            Review past recordings and track your improvement journey
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load recordings. Please try again later.
            </AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-video w-full" />
                <div className="p-4 space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </Card>
            ))}
          </div>
        ) : recordings && recordings.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recordings.map((recording, index) => (
              <Card 
                key={recording.id} 
                className="overflow-hidden hover-lift group cursor-pointer"
                style={{ animationDelay: `${index * 75}ms` }}
              >
                <div className="aspect-video bg-muted relative flex items-center justify-center">
                  {recording.thumbnail_url ? (
                    <img 
                      src={recording.thumbnail_url} 
                      alt={recording.title || 'Recording'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <>
                      <Video className="h-12 w-12 text-muted-foreground" />
                      <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-accent/5" />
                    </>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <Button 
                      size="icon" 
                      className="opacity-0 group-hover:opacity-100 transition-opacity scale-90 group-hover:scale-100"
                      asChild
                    >
                      <a href={recording.video_url} target="_blank" rel="noopener noreferrer">
                        <Play className="h-5 w-5" />
                      </a>
                    </Button>
                  </div>
                  <Badge className="absolute top-2 right-2 bg-background/90">
                    {formatDuration(recording.duration_seconds)}
                  </Badge>
                  {recording.status === 'processing' && (
                    <Badge className="absolute top-2 left-2 bg-warning/90">
                      Processing
                    </Badge>
                  )}
                </div>

                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {new Date(recording.created_at).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                    {recording.feedback && recording.feedback.overall_score && (
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className="h-4 w-4 text-success" />
                        <span className="font-bold text-success">{recording.feedback.overall_score}</span>
                        <span className="text-sm text-muted-foreground">/100</span>
                      </div>
                    )}
                  </div>

                  {recording.title && (
                    <h3 className="font-medium text-sm mb-2 line-clamp-1">
                      {recording.title}
                    </h3>
                  )}

                  {recording.feedback && recording.feedback.improvements && recording.feedback.improvements.length > 0 && (
                    <div className="space-y-1">
                      {recording.feedback.improvements.slice(0, 2).map((improvement, i) => (
                        <div 
                          key={i} 
                          className="text-xs text-muted-foreground flex items-start gap-1.5"
                        >
                          <span className="text-primary mt-0.5">•</span>
                          <span className="line-clamp-1">{improvement}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {recording.status === 'processing' && (
                    <p className="text-xs text-muted-foreground mt-2">
                      AI feedback will be available soon
                    </p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center animate-scale-in">
            <Video className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No recordings yet</h2>
            <p className="text-muted-foreground mb-6">
              Start your journey by recording your first reflection
            </p>
            <Button asChild>
              <Link to="/record">Record Your First Video</Link>
            </Button>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default Gallery;
