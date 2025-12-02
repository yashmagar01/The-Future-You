import { useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useRecording } from '@/hooks/useRecordings';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import AnalysisResults, { AnalysisData, AnalysisMetrics } from '@/components/AnalysisResults';
import TranscriptViewer from '@/components/TranscriptViewer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Upload, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Mock Transcript (Moved from AnalysisResults)
const mockTranscript = [
  { time: 0, text: "Alright, uh, today I'd like to talk to you about how to build an MVP or a Minimum Viable Product." },
  { time: 5, text: "So if you haven't seen this before, this is a meme that we love to talk about when trying to help founders with their MVP." },
  { time: 12, text: "It's called the Midwitt Meme. The person who is the Jedi, the super intelligent, the founder who's doing all the best things and knows all the best things," },
  { time: 20, text: "and the idiot, the first time founder, the founder who has no idea what's going on." },
  { time: 25, text: "Many times, these two founders will actually come to the right decision before the founder who is really smart and is trying to work really hard and do everything right." },
  { time: 35, text: "And so, in this situation with the MVP, the best advice is to actually launch something quickly and iterate." },
  { time: 42, text: "Get a product into the hands of your customers and then learn whether it helps them or doesn't and then iterate it and improve it over time." },
  { time: 50, text: "The wrong answer is to do a hundred surveys and 600 user interviews and contact every single one of the competitors and spend a year fundraising and hire 100 people and all these other things that you can distract yourself with that it might appear like other smart things." },
  { time: 65, text: "But in reality, they really don't highlight the most important point about an MVP, which is you'd only really start learning when you put a product in front of a customer." },
];

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
  const analysisData: AnalysisData | null = recording?.feedback ? {
    overall_score: recording.feedback.overall_score,
    metrics: recording.feedback.key_insights as unknown as AnalysisMetrics,
    transcript_summary: (recording.feedback.key_insights as any)?.transcript || "No transcript available.",
    video_id: recording.id,
    created_at: recording.created_at
  } : null;

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
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Left Column: Video Player (35%) */}
                <div className="lg:col-span-4 space-y-4 sticky top-24">
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden aspect-video relative group">
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
                          className="w-full h-full object-cover"
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
                  
                  <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                    <h1 className="text-lg font-bold text-gray-900 leading-tight mb-1">
                      {recording?.title || 'Untitled Session'}
                    </h1>
                    {recording?.description && (
                      <p className="text-sm text-gray-500">{recording.description}</p>
                    )}
                  </div>

                  {/* Transcript Viewer (Moved here) */}
                  <TranscriptViewer 
                    transcript={mockTranscript} 
                    currentTime={currentTime} 
                    onSeek={(time) => {
                      setCurrentTime(time);
                      if (videoRef.current) {
                        videoRef.current.currentTime = time;
                        videoRef.current.play();
                      }
                    }} 
                  />
                </div>

                {/* Right Column: Analysis Results (65%) */}
                <div className="lg:col-span-8">
                  <AnalysisResults 
                    analysis={analysisData} 
                    onSeek={(time) => {
                      setCurrentTime(time);
                      if (videoRef.current) {
                        videoRef.current.currentTime = time;
                        videoRef.current.play();
                      }
                    }}
                  />
                </div>
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
