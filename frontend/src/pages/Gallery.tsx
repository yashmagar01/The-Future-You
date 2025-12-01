import { useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Video, Play, TrendingUp, Calendar, AlertCircle, Loader2, CheckCircle2, Eye, Search, Filter, Trash2 } from "lucide-react";
import Layout from "@/components/Layout";
import { useRecordings, useDeleteRecording, deleteRecordingFile } from "@/hooks/useRecordings";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

const Gallery = () => {
  const { data: recordings, isLoading, error } = useRecordings();
  const deleteRecording = useDeleteRecording();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "completed" | "processing">("all");

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDelete = async (e: React.MouseEvent, recording: any) => {
    e.preventDefault(); // Prevent navigation if clicking inside a link
    e.stopPropagation();
    
    if (!confirm("Are you sure you want to delete this recording? This action cannot be undone.")) {
      return;
    }

    try {
      // 1. Delete file from storage if it exists
      if (recording.video_url) {
        await deleteRecordingFile(recording.video_url);
      }
      
      // 2. Delete record from database
      await deleteRecording.mutateAsync(recording.id);
      
      toast({
        title: "Recording deleted",
        description: "The recording has been permanently removed.",
      });
    } catch (err) {
      console.error("Delete error:", err);
      toast({
        title: "Delete failed",
        description: "Could not delete the recording. Please try again.",
        variant: "destructive",
      });
    }
  };

  const filteredRecordings = recordings?.filter(recording => {
    const matchesSearch = (recording.title || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" 
      ? true        : filterStatus === "completed" 
        ? recording.status === "completed"
        : recording.status === "processing";
    
    return matchesSearch && matchesStatus;
  });

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 animate-fade-in">
          <div>
            <h1 className="text-4xl font-bold mb-3">Your Reflections</h1>
            <p className="text-muted-foreground text-lg">
              Review past recordings and track your improvement journey
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search recordings..." 
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
              <SelectTrigger className="w-full sm:w-40">
                <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
        ) : filteredRecordings && filteredRecordings.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecordings.map((recording, index) => (
              <Card 
                key={recording.id} 
                className={`overflow-hidden hover-lift group border-2 border-transparent hover:border-primary/10 transition-all duration-300 ${
                  recording.status === 'completed' ? 'cursor-pointer' : ''
                }`}
                style={{ animationDelay: `${index * 75}ms` }}
              >
                <div className="aspect-video bg-muted relative flex items-center justify-center overflow-hidden">
                  {recording.thumbnail_url ? (
                    <img 
                      src={recording.thumbnail_url} 
                      alt={recording.title || 'Recording'}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <>
                      {recording.status === 'processing' ? (
                        <>
                          <div className="relative z-10">
                            <div className="relative">
                              <Video className="h-12 w-12 text-muted-foreground/50" />
                              <Loader2 className="h-6 w-6 text-primary animate-spin absolute -bottom-1 -right-1" />
                            </div>
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-accent/5" />
                        </>
                      ) : (
                        <>
                          <Video className="h-12 w-12 text-muted-foreground/50 z-10" />
                          <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-accent/5" />
                        </>
                      )}
                    </>
                  )}
                  
                  {recording.status === 'completed' && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-[2px]">
                      <Button 
                        size="icon" 
                        className="h-12 w-12 rounded-full bg-white text-primary hover:bg-white/90 hover:scale-110 transition-all duration-300 shadow-xl"
                        asChild
                      >
                        <Link to={`/analysis/${recording.id}`}>
                          <Play className="h-5 w-5 fill-current ml-0.5" />
                        </Link>
                      </Button>
                    </div>
                  )}
                  
                  <Badge className="absolute top-3 right-3 bg-black/60 backdrop-blur-md hover:bg-black/70 transition-colors border-0">
                    {formatDuration(recording.duration_seconds)}
                  </Badge>
                  
                  {recording.status === 'processing' && (
                    <Badge className="absolute top-3 left-3 bg-yellow-500/90 hover:bg-yellow-500 text-white border-0 flex items-center gap-1.5 shadow-sm">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Processing
                    </Badge>
                  )}
                  
                  {recording.status === 'completed' && (
                    <Badge className="absolute top-3 left-3 bg-green-500/90 hover:bg-green-500 text-white border-0 flex items-center gap-1.5 shadow-sm">
                      <CheckCircle2 className="h-3 w-3" />
                      Ready
                    </Badge>
                  )}
                </div>

                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(recording.created_at).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                    {recording.feedback && recording.feedback.overall_score && (
                      <div className="flex items-center gap-1.5 bg-green-500/10 px-2 py-1 rounded-md">
                        <TrendingUp className="h-3.5 w-3.5 text-green-600" />
                        <span className="font-bold text-green-700 text-sm">{recording.feedback.overall_score}</span>
                      </div>
                    )}
                  </div>

                  <h3 className="font-semibold text-base mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                    {recording.title || "Untitled Recording"}
                  </h3>

                  {recording.status === 'completed' && recording.feedback && recording.feedback.areas_for_improvement && recording.feedback.areas_for_improvement.length > 0 ? (
                    <div className="space-y-1.5 mb-4">
                      {recording.feedback.areas_for_improvement.slice(0, 2).map((improvement, i) => (
                        <div 
                          key={i} 
                          className="text-xs text-muted-foreground flex items-start gap-2"
                        >
                          <span className="text-primary/60 mt-0.5">•</span>
                          <span className="line-clamp-1">{improvement}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground mb-4 line-clamp-2">
                      {recording.status === 'completed' 
                        ? "No specific improvements noted yet." 
                        : "Analysis in progress..."}
                    </p>
                  )}

                  <div className="flex gap-2">
                    {recording.status === 'completed' ? (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1 group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all duration-300"
                        asChild
                      >
                        <Link to={`/analysis/${recording.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Analysis
                        </Link>
                      </Button>
                    ) : (
                      <Button size="sm" variant="secondary" disabled className="flex-1 opacity-50">
                        <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                        Analyzing...
                      </Button>
                    )}
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      className="px-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={(e) => handleDelete(e, recording)}
                      title="Delete recording"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 animate-scale-in">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <Video className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold mb-2">
              {searchQuery || filterStatus !== 'all' ? "No matching recordings" : "No recordings yet"}
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              {searchQuery || filterStatus !== 'all' 
                ? "Try adjusting your search or filters to find what you're looking for."
                : "Start your journey by recording your first reflection. We'll analyze it and help you improve."}
            </p>
            {(searchQuery || filterStatus !== 'all') ? (
              <Button onClick={() => { setSearchQuery(""); setFilterStatus("all"); }} variant="outline">
                Clear Filters
              </Button>
            ) : (
              <Button asChild size="lg" className="rounded-full px-8">
                <Link to="/record">Record Your First Video</Link>
              </Button>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Gallery;
