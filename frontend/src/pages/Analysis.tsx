import { useState, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useRecording } from '@/hooks/useRecordings';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import ExportButton from '@/components/ExportButton';
import AnalysisResults, { AnalysisData, AnalysisMetrics } from '@/components/AnalysisResults';
import TranscriptViewer from '@/components/TranscriptViewer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Upload, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';



const Analysis = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: recording, isLoading, error } = useRecording(id || '');
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);

  // Determine back navigation context
  const referrer = document.referrer;
  const backText = referrer.includes('/gallery') 
    ? 'Back to Gallery' 
    : referrer.includes('/record') 
    ? 'Upload Another' 
    : 'Back to Dashboard';
  
  const backPath = referrer.includes('/gallery') 
    ? '/gallery' 
    : referrer.includes('/record') 
    ? '/record' 
    : '/dashboard';


  // Transform feedback data to AnalysisData format
  // ponytail: memo so video timeupdate (every frame) doesn't rebuild objects/regex
  const analysisData: AnalysisData | null = useMemo(() => recording?.feedback ? {
    overall_score: recording.feedback.overall_score,
    metrics: recording.feedback.key_insights as unknown as AnalysisMetrics,
    transcript_summary: (recording.feedback.key_insights as any)?.transcript || "No transcript available.",
    video_id: recording.id,
    created_at: recording.created_at
  } : null, [recording]);

  // Build real transcript from database
  const displayTranscript: { time: number; text: string }[] = useMemo(() => {
    const insights = recording?.feedback?.key_insights as any;
    const fullTranscript = insights?.transcript || "";
    if (!fullTranscript) {
      return [
        { time: 0, text: "No transcript available. This may be an older recording processed before transcript storage was implemented." }
      ];
    }
    // Split transcript into sentences and estimate timestamps
    // This is a temporary solution until we store word timestamps
    const sentences = fullTranscript.match(/[^.!?]+[.!?]+/g) || [fullTranscript];
    const avgDuration = (recording?.duration_seconds || 60) / sentences.length;
    return sentences.map((sentence: string, index: number) => ({
      time: Math.floor(index * avgDuration),
      text: sentence.trim()
    }));
  }, [recording]);

  const handleSeek = useCallback((time: number) => {
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      videoRef.current.play();
    }
  }, []);

  return (
    <Layout>
      <div className="min-h-screen bg-[#f8f7f5] pb-20">
        {/* Header / Nav Area */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-7xl">
            <Button
              variant="ghost"
              onClick={() => navigate(backPath)}
              className="gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <ArrowLeft className="h-4 w-4" />
              {backText}
            </Button>
            
            {recording && (
              <div className="text-sm font-medium text-gray-500">
                {new Date(recording.created_at).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })} • {new Date(recording.created_at).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            )}
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 max-w-7xl space-y-8">
          {/* Loading State */}
          {isLoading && (
            <div className="space-y-8 animate-pulse">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-4 space-y-4">
                  <div className="h-64 bg-gray-200 rounded-2xl" />
                </div>
                <div className="lg:col-span-8 space-y-4">
                  <div className="h-32 bg-gray-200 rounded-2xl" />
                  <div className="grid grid-cols-3 gap-4">
                    <div className="h-32 bg-gray-200 rounded-2xl" />
                    <div className="h-32 bg-gray-200 rounded-2xl" />
                    <div className="h-32 bg-gray-200 rounded-2xl" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <Alert variant="destructive" className="max-w-2xl mx-auto mt-8">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error Loading Analysis</AlertTitle>
              <AlertDescription>
                {error instanceof Error ? error.message : 'Failed to load analysis. The recording may not exist or you may not have permission to view it.'}
              </AlertDescription>
              <div className="mt-4 flex gap-2">
                <Button variant="outline" onClick={() => navigate('/gallery')}>
                  Go to Gallery
                </Button>
                <Button variant="outline" onClick={() => navigate('/record')}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload New Video
                </Button>
              </div>
            </Alert>
          )}

          {/* No Feedback State */}
          {recording && !recording.feedback && !isLoading && (
            <Card className="max-w-2xl mx-auto mt-12 text-center py-12">
              <CardContent>
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertCircle className="h-8 w-8 text-blue-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Analysis In Progress</h3>
                <p className="text-gray-500 mb-8 max-w-md mx-auto">
                  We're currently processing your video. This usually takes about 1-2 minutes. Please check back shortly.
                </p>
                <Button onClick={() => window.location.reload()} size="lg" className="bg-blue-600 hover:bg-blue-700">
                  Refresh Page
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Main Content */}
          {analysisData && !isLoading && (
            <div className="space-y-12">
              {/* Top Section: Video & Primary Metrics */}
                {/* Single Column Layout Flow */}
                <div className="w-full max-w-[1280px] mx-auto">
                  <AnalysisResults 
                    analysis={analysisData} 
                    onSeek={handleSeek}
                    videoNode={
                      <div className="bg-white rounded-[20px] shadow-sm border border-[#E8F0EC] p-3 overflow-hidden h-full flex flex-col justify-center relative group">
                        <div className="bg-white rounded-xl shadow-sm overflow-hidden aspect-video relative flex-shrink-0">
                          {(() => {
                            const videoUrl = recording?.video_url;
                            const publicUrl = videoUrl 
                              ? supabase.storage.from('recordings').getPublicUrl(videoUrl).data.publicUrl 
                              : null;
                            
                            if (!videoUrl) {
                              return (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 text-gray-400">
                                  <AlertCircle className="h-8 w-8 mb-2" />
                                  <p className="text-sm font-medium">Video Unavailable</p>
                                </div>
                              );
                            }

                            return (
                              <video 
                                ref={videoRef}
                                controls 
                                className="w-full h-full object-cover rounded-xl"
                                preload="metadata"
                                onPlay={() => setIsPlaying(true)}
                                onPause={() => setIsPlaying(false)}
                                onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                              >
                                <source src={publicUrl || ''} type="video/mp4" />
                                <source src={publicUrl || ''} type="video/webm" />
                                Your browser does not support the video tag.
                              </video>
                            );
                          })()}
                        </div>
                        
                        <div className="mt-4 px-2 pb-2">
                          <h1 className="text-lg font-bold text-gray-900 leading-tight mb-1">
                            {recording?.title || 'Untitled Session'}
                          </h1>
                          <p className="text-sm text-gray-500 truncate">{recording?.description || 'Your video recording'}</p>
                        </div>
                      </div>
                    }
                    transcriptNode={
                      <TranscriptViewer 
                        transcript={displayTranscript} 
                        currentTime={currentTime} 
                        onSeek={handleSeek} 
                      />
                    }
                  />
                </div>

              {/* Footer Actions */}
              <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-200 p-4 z-40">
                <div className="container mx-auto max-w-7xl flex justify-between items-center">
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/gallery')} 
                    className="text-gray-600 border-2 border-[#1db584] hover:bg-[#1db584]/5 hover:text-gray-900 transition-all duration-200"
                  >
                    Back to Gallery
                  </Button>
                  {analysisData && (
                    <ExportButton analysisData={analysisData} transcript={displayTranscript} recording={recording} />
                  )}
                  <Button 
                    onClick={() => navigate('/record')} 
                    className="bg-gradient-to-br from-[#1db584] to-[#15a368] hover:from-[#16b578] hover:to-[#12935d] text-white shadow-[0_8px_20px_rgba(29,181,132,0.3)] hover:shadow-[0_10px_25px_rgba(29,181,132,0.4)] transition-all duration-200 border-none"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Record Another Session
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Analysis;
