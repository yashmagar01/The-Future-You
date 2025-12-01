import { useParams, useNavigate, Link } from 'react-router-dom';
import { useRecording } from '@/hooks/useRecordings';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import AnalysisResults, { AnalysisData, AnalysisMetrics } from '@/components/AnalysisResults';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Upload, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const Analysis = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: recording, isLoading, error } = useRecording(id || '');

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
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header with Back Button */}
        <div className="mb-8 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate(backPath)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {backText}
          </Button>
          
          {recording && (
            <div className="text-sm text-muted-foreground">
              {new Date(recording.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-6">
            <Skeleton className="h-12 w-3/4" />
            <div className="grid gap-6 md:grid-cols-3">
              <Skeleton className="h-48" />
              <Skeleton className="h-48" />
              <Skeleton className="h-48" />
            </div>
            <Skeleton className="h-96" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <Alert variant="destructive">
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
          <Card>
            <CardContent className="p-12 text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">Analysis In Progress</h3>
              <p className="text-muted-foreground mb-6">
                This video is still being processed. Analysis results will appear here once complete.
              </p>
              <Button onClick={() => window.location.reload()}>
                Refresh Page
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Analysis Results */}
        {analysisData && !isLoading && (
          <div className="space-y-6">
            {/* Video Title */}
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {recording?.title || 'Video Analysis'}
              </h1>
              {recording?.description && (
                <p className="text-muted-foreground">{recording.description}</p>
              )}
            </div>

            {/* Video Player + Analysis Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Video Player - Sticky on larger screens */}
              <div className="lg:col-span-1">
                <div className="sticky top-8">
                  <Card>
                    <CardContent className="p-0">
                      {recording?.video_url && (
                        <video 
                          controls 
                          className="w-full rounded-lg"
                          preload="metadata"
                        >
                          <source 
                            src={supabase.storage.from('recordings').getPublicUrl(recording.video_url).data.publicUrl} 
                            type="video/mp4" 
                          />
                          Your browser does not support the video tag.
                        </video>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Analysis Results */}
              <div className="lg:col-span-2">
                <AnalysisResults analysis={analysisData} />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center pt-8">
              <Button variant="outline" onClick={() => navigate('/gallery')}>
                Back to Gallery
              </Button>
              <Button onClick={() => navigate('/record')}>
                <Upload className="h-4 w-4 mr-2" />
                Record Another
              </Button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Analysis;
