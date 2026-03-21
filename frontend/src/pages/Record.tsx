import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { AlertCircle,  Loader2, 
  Upload, 
  FileVideo, 
  Zap, 
  Shield, 
  Clock,
  Settings,
  Info 
} from 'lucide-react';
import Layout from "@/components/Layout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { VideoRecorder } from "@/components/VideoRecorder";
import { ScriptDisplay } from "@/components/ScriptDisplay";
import { DebugOnboardingReset } from "@/components/DebugOnboardingReset";

import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { supabase, supabaseUrl } from "@/integrations/supabase/client";
import { useCreateRecording } from "@/hooks/useRecordings";
import { ProcessingTips } from "@/components/ProcessingTips";

import { cn } from "@/lib/utils";

const Record = () => {

  const [isUploading, setIsUploading] = useState(false);
  // ... (rest of state items are unchanged, just showing context)

  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingProgress, setProcessingProgress] = useState(75);
  const [statusMessage, setStatusMessage] = useState("");
  const [userRole, setUserRole] = useState<'tester' | 'user' | 'admin'>('user');
  const [loadingRole, setLoadingRole] = useState(true);
  const { mutateAsync: createRecording } = useCreateRecording();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Fetch user role from profiles table
  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) {
        setLoadingRole(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching user role:', error);
        } else if (data) {
          setUserRole(data.role as 'tester' | 'user' | 'admin');
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoadingRole(false);
      }
    };

    fetchUserRole();
  }, [user]);

  // Helper to simulate processing progress with phases
  const pollForStatus = (recordingId: string) => {
    // Phase 1 (0-50%): Fast initial processing
    // Phase 2 (50-90%): Slower advanced analysis
    
    let phase = 1;
    let messageIndex = 0;
    
    const messages = [
      "Analyzing audio patterns...", 
      "Detecting facial micro-expressions...",
      "Analyzing semantic coherence... (Deep Think)",
      "Cross-referencing multimodal signals...",
      "Generating coaching insights...",
      "Finalizing sophisticated metrics..."
    ];

    const interval = setInterval(async () => {
      try {
        const { data, error } = await supabase
          .from('recordings')
          .select('status')
          .eq('id', recordingId)
          .single();

        if (error) {
          console.error('Error polling status:', error);
          return;
        }

        if (data.status === 'processing') {
          setProcessingProgress((prev) => {
            // Decaying progress curve
            if (prev < 30) return prev + 5;        // Fast start
            if (prev < 50) return prev + 2;        // Phase 1 ending
            if (prev < 70) return prev + 0.5;      // Phase 2 starting (Model load)
            if (prev < 90) return prev + 0.2;      // Phase 2 crunching (slowest)
            return prev; // Cap at 90 until done
          });
          
          // Rotate messages every few seconds
          if (Math.random() > 0.7) {
            messageIndex = (messageIndex + 1) % messages.length;
            setStatusMessage(messages[messageIndex]);
          }
          
        } else if (data.status === 'completed') {
          setStatusMessage("Analysis complete!");
          setProcessingProgress(100);
          clearInterval(interval);
          setTimeout(() => {
            navigate(`/analysis/${recordingId}`);
          }, 1000);
        } else if (data.status === 'failed') {
          setStatusMessage("Analysis failed.");
          clearInterval(interval);
          toast({
            title: "Processing Failed",
            description: "The AI could not analyze your video. Please try again.",
            variant: "destructive",
          });
          setIsUploading(false);
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 2000); // Poll every 2 seconds
    
    // Safety timeout: Stop polling after 5 minutes
    setTimeout(() => clearInterval(interval), 300000);
  };

  const uploadFileWithProgress = async (file: File, path: string) => {
    // Get fresh session first
    const { data: { session }, error } = await supabase.auth.getSession();
    let token = session?.access_token;

    if (error || !token) {
      const { data: { session: newSession }, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError || !newSession?.access_token) {
        throw new Error('Session expired. Please log in again.');
      }
      token = newSession.access_token;
    }

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const url = `${supabaseUrl}/storage/v1/object/recordings/${path}`;
      
      xhr.open('POST', url);
      
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.setRequestHeader('Content-Type', file.type);
      // xhr.setRequestHeader('x-client-info', 'supabase-js-web');
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percent);
        }
      };
      
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(xhr.response);
        } else {
          console.error('Upload failed response:', xhr.responseText);
          reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.responseText}`));
        }
      };
      
      xhr.onerror = () => reject(new Error('Network error during upload'));
      
      xhr.send(file);
    });
  };

  const handleRecordingComplete = async (blob: Blob, duration: number) => {
    if (!user) return;

    try {
      setIsUploading(true);
      setUploadProgress(0);
      setProcessingProgress(0);
      setStatusMessage("Starting upload...");

      toast({
        title: "Uploading...",
        description: "Please wait while we upload your video.",
      });

      // 1. Upload Video to Supabase Storage
      const fileName = `${user.id}/${Date.now()}.webm`;
      const file = new File([blob], fileName, { type: 'video/webm' });

      console.log('Uploading recording to Supabase Storage:', fileName);
      
      await uploadFileWithProgress(file, fileName);

      console.log('Upload successful, creating database record...');
      setStatusMessage("Finalizing upload...");

      // 2. Use Hook to Insert Metadata
      const recordingData = await createRecording({
        video_url: fileName,
        duration_seconds: duration,
        file_size_bytes: blob.size,
        status: 'uploaded', // Set to 'uploaded' for the backend worker
        title: `Recording ${new Date().toLocaleDateString()}`,
      });

      console.log('Database record created:', recordingData.id);
      setStatusMessage("Waiting for AI processor...");

      // 3. Start Polling for Status
      pollForStatus(recordingData.id);

    } catch (error) {
      console.error('Upload failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: "Upload Failed",
        description: errorMessage,
        variant: "destructive",
      });
      setIsUploading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!user) return;

    try {
      setIsUploading(true);
      setUploadProgress(0);
      setProcessingProgress(0);
      setStatusMessage("Starting upload...");

      toast({
        title: "Uploading...",
        description: "Please wait while we upload your video.",
      });

      // Get video duration with timeout
      const video = document.createElement('video');
      video.preload = 'metadata';

      const duration = await Promise.race([
        new Promise<number>((resolve, reject) => {
          video.onloadedmetadata = () => {
            if (isNaN(video.duration) || video.duration === 0) {
              reject(new Error('Invalid video duration'));
            } else {
              resolve(Math.floor(video.duration));
            }
          };
          video.onerror = () => reject(new Error('Failed to load video metadata'));
          video.src = URL.createObjectURL(file);
        }),
        new Promise<number>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout loading video metadata')), 10000)
        )
      ]).finally(() => {
        URL.revokeObjectURL(video.src);
      });

      console.log('Video duration:', duration, 'seconds');

      // Validate file size (Supabase free tier limit is 50MB)
      const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB in bytes
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      
      if (file.size > MAX_FILE_SIZE) {
        throw new Error(
          `Video file is too large (${fileSizeMB} MB). Maximum allowed size is 50 MB. ` +
          `Please compress your video or record a shorter clip.`
        );
      }
      
      console.log(`File size: ${fileSizeMB} MB (within 50 MB limit)`);

      // 1. Upload Video to Supabase Storage
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `${user.id}/${Date.now()}-${sanitizedFileName}`;
      
      console.log('Uploading to Supabase Storage:', fileName);
      
      await uploadFileWithProgress(file, fileName);

      console.log('Upload successful, creating database record...');
      setStatusMessage("Finalizing upload...");

      // 2. Use Hook to Insert Metadata
      const recordingData = await createRecording({
        video_url: fileName,
        duration_seconds: duration,
        file_size_bytes: file.size,
        status: 'uploaded',
        title: file.name || `Uploaded ${new Date().toLocaleDateString()}`,
      });

      console.log('Database record created:', recordingData.id);
      setStatusMessage("Waiting for AI processor...");

      // 3. Start Polling for Status
      pollForStatus(recordingData.id);

    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: "Upload Failed",
        description: errorMessage,
        variant: "destructive",
      });
      setIsUploading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 sm:py-12 max-w-4xl">
        <div className="text-center mb-6 sm:mb-8 animate-fade-in">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3 px-2">
            {isUploading ? "Processing Session" : "Record Your Reflection"}
          </h1>
          {!isUploading && (
            <p className="text-muted-foreground text-base sm:text-lg px-2">
              Take 5-10 minutes to practice your communication skills
            </p>
          )}
        </div>

        {/* Preparation Content - Only show when NOT uploading */}
        {!isUploading && (
          <>
            {/* Role-based banner */}
            {!loadingRole && (
              <Alert
                className={`mb-6 sm:mb-8 animate-slide-up ${userRole === 'tester' || userRole === 'admin'
                    ? 'border-primary bg-primary/5'
                    : 'border-accent bg-accent/5'
                  }`}
              >
                {userRole === 'tester' || userRole === 'admin' ? (
                  <>
                    <Zap className="h-4 w-4 text-primary" aria-hidden="true" />
                    <AlertDescription className="text-sm">
                      <strong className="text-primary">Tester Priority:</strong> Your analysis will be ready soon.
                      You'll receive an email notification when it's complete.
                    </AlertDescription>
                  </>
                ) : (
                  <>
                    <Clock className="h-4 w-4 text-accent" aria-hidden="true" />
                    <AlertDescription className="text-sm">
                      <strong className="text-accent">Standard Processing:</strong> Your analysis will be ready in 2–3 days.
                      You'll receive an email when it's done.
                    </AlertDescription>
                  </>
                )}
              </Alert>
            )}

            <div className="grid md:grid-cols-2 gap-4 mb-6 sm:mb-8 animate-slide-up">
              <Alert className="border-blue-500/20 bg-blue-500/5">
                <Info className="h-4 w-4 text-blue-500" aria-hidden="true" />
                <AlertDescription className="text-sm">
                  <strong className="text-blue-600 block mb-1">AI Rapid Analysis:</strong>
                  Your recording is processed automatically by our private cloud engine.
                  Results are typically ready in 2–5 minutes.
                </AlertDescription>
              </Alert>

              <Alert className="border-brand-green/20 bg-brand-green/5">
                <Shield className="h-4 w-4 text-brand-green" aria-hidden="true" />
                <AlertDescription className="text-sm">
                  <strong className="text-brand-green block mb-1">Private Cloud Security:</strong>
                  Video data is encrypted at rest and processed in a secure, isolated environment.
                  We perform zero-data-retention on processing nodes.
                </AlertDescription>
              </Alert>
            </div>
          </>
        )}

        {isUploading ? (
          <div className="space-y-6 animate-in fade-in duration-500">
             {/* Single Unified Card for Upload/Processing */}
            {/* Single Unified Card for Upload/Processing */}
            <Card className="p-6 sm:p-12 shadow-lg border-zinc-200 dark:border-zinc-800 min-h-[400px] flex flex-col justify-center items-center relative overflow-hidden bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm">
              
              {/* Background Accents (Subtle) */}
              <div className="absolute top-0 right-0 -mr-32 -mt-32 w-80 h-80 bg-brand-green/5 rounded-full blur-3xl opacity-60" />
              <div className="absolute bottom-0 left-0 -ml-32 -mb-32 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl opacity-60" />

              <div className="relative z-10 w-full max-w-xl space-y-10 text-center">
                
                {/* STATE A: Uploading */}
                {uploadProgress < 100 ? (
                  <div className="space-y-8 animate-in fade-in duration-500">
                    <div className="relative mb-6">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xl font-bold font-nano text-foreground/80">{uploadProgress}%</span>
                      </div>
                      <Loader2 className="h-24 w-24 animate-spin mx-auto text-primary/20" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70 mb-2">
                        Uploading your video...
                      </h3>
                      <p className="text-muted-foreground font-medium">Please hold tight, almost there.</p>
                    </div>
                    {/* Standard Progress Bar for Upload */}
                    <Progress value={uploadProgress} className="w-full h-3 bg-zinc-100 dark:bg-zinc-800" />
                  </div>
                ) : (
                  /* STATE B & C: Processing (Queued or Analyzing) */
                  <div className="space-y-8 animate-in fade-in duration-700">
                    
                    {/* Status Header */}
                    <div className="space-y-4">
                      <div className={cn(
                        "w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 transition-all duration-500",
                         processingProgress > 0 ? "bg-brand-green/10 animate-pulse" : "bg-zinc-100 dark:bg-zinc-800"
                      )}>
                        {processingProgress > 0 ? (
                          <Zap className="h-10 w-10 text-brand-green" aria-hidden="true" />
                        ) : (
                          <Clock className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
                        )}
                      </div>
                      
                      <h3 className="text-xl sm:text-3xl font-bold text-[#333333] dark:text-zinc-200 transition-all duration-500">
                        {processingProgress > 0 ? (
                          <span className="flex items-center justify-center gap-2 animate-pulse">
                            Status: AI Core Active
                          </span>
                        ) : (
                          <span className="flex items-center justify-center gap-2">
                            Status: In Queue
                          </span>
                        )}
                      </h3>
                      
                      <p className="text-muted-foreground font-medium text-base sm:text-lg">
                        {processingProgress > 0 
                          ? "Analyzing video data..." 
                          : "Waiting for available AI slot..."}
                      </p>
                    </div>

                    {/* Progress Bar - Same as Upload */}
                    <div className="space-y-3">
                      <Progress value={processingProgress} className="w-full h-3 bg-zinc-100 dark:bg-zinc-800" />
                      <div className="flex justify-end">
                        <span className="text-xs sm:text-sm font-bold text-[#333333] dark:text-zinc-400">
                          {Math.round(processingProgress)}%
                        </span>
                      </div>
                    </div>

                    {/* Cyclical Tips (Below Progress Bar) */}
                    <div className="pt-2">
                      <ProcessingTips />
                    </div>

                    {/* Footer: Disclaimer & Privacy */}
                    <div className="space-y-4 pt-6 border-t border-border/40">
                      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                        <Shield className="w-3 h-3" />
                        <span>Private • Secure • Local</span>
                      </div>
                      <p className="text-sm font-medium text-muted-foreground/80 px-4">
                        ( We are currently operating on a tight budget. Thank you for your patience! )
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        ) : (
          <VideoRecorder
            onRecordingComplete={handleRecordingComplete}
            onUploadFile={handleFileUpload}
            maxDuration={600}
          />
        )}


        {/* Script Display */}
        <div className="animate-slide-up">
          {user && <ScriptDisplay userId={user.id} />}
        </div>
      </div>
      <DebugOnboardingReset />
    </Layout>
  );
};

export default Record;
