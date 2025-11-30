import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { AlertCircle, Loader2, Clock, Zap, Info, Shield } from "lucide-react";
import Layout from "@/components/Layout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { VideoRecorder } from "@/components/VideoRecorder";
import { ScriptDisplay } from "@/components/ScriptDisplay";

import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { supabase, supabaseUrl } from "@/integrations/supabase/client";
import { useCreateRecording } from "@/hooks/useRecordings";

const Record = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingProgress, setProcessingProgress] = useState(0);
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

  // Helper to simulate processing progress
  const simulateProcessing = (duration: number) => {
    setProcessingProgress(0);
    setStatusMessage("Initializing AI models...");
    
    const totalTime = duration * 1000 * 0.5; // Estimate processing as 50% of duration
    const intervalTime = 100;
    const steps = totalTime / intervalTime;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      const progress = Math.min(Math.round((currentStep / steps) * 100), 95); // Cap at 95% until done
      setProcessingProgress(progress);
      
      if (progress > 20 && progress < 40) setStatusMessage("Transcribing speech...");
      if (progress > 40 && progress < 70) setStatusMessage("Analyzing sentiment...");
      if (progress > 70) setStatusMessage("Generating insights...");
      
    }, intervalTime);

    return () => clearInterval(interval);
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

    let stopProcessingSimulation: (() => void) | undefined;

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
        status: 'processing',
        title: `Recording ${new Date().toLocaleDateString()}`,
      });

      console.log('Database record created:', recordingData.id);

      // Start processing simulation
      stopProcessingSimulation = simulateProcessing(duration);

      // 3. Trigger Backend AI Processing
      try {
        console.log('Triggering backend processing...');
        const response = await fetch('http://localhost:3001/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recording_id: recordingData?.id,
            video_path: fileName
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Backend processing trigger failed:', errorText);
          toast({
            title: "Processing Warning",
            description: "Upload succeeded but AI analysis may not start. Check backend logs.",
            variant: "destructive",
          });
        } else {
          console.log('Backend processing triggered successfully');
          setProcessingProgress(100);
          setStatusMessage("Analysis complete!");
        }
      } catch (processingError) {
        console.error('Failed to trigger backend processing:', processingError);
        toast({
          title: "Backend Unavailable",
          description: "Upload succeeded but backend is not running. Start backend to process video.",
          variant: "destructive",
        });
      }

      toast({
        title: "Upload successful!",
        description: "AI analysis started. You can check the status in your dashboard.",
      });

      // Navigate to dashboard
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);

    } catch (error) {
      console.error('Upload failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: "Upload Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      if (stopProcessingSimulation) stopProcessingSimulation();
      setIsUploading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!user) return;

    let stopProcessingSimulation: (() => void) | undefined;

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

      // 1. Upload Video to Supabase Storage
      // Sanitize filename to remove special characters that might cause InvalidKey errors
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
        status: 'processing',
        title: file.name || `Uploaded ${new Date().toLocaleDateString()}`,
      });

      console.log('Database record created:', recordingData.id);

      // Start processing simulation
      stopProcessingSimulation = simulateProcessing(duration);

      // 3. Trigger Backend AI Processing
      try {
        console.log('Triggering backend processing...');
        const response = await fetch('http://localhost:3001/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recording_id: recordingData?.id,
            video_path: fileName
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Backend processing trigger failed:', errorText);
          toast({
            title: "Processing Warning",
            description: "Upload succeeded but AI analysis may not start. Check backend logs.",
            variant: "destructive",
          });
        } else {
          console.log('Backend processing triggered successfully');
          setProcessingProgress(100);
          setStatusMessage("Analysis complete!");
        }
      } catch (processingError) {
        console.error('Failed to trigger backend processing:', processingError);
        toast({
          title: "Backend Unavailable",
          description: "Upload succeeded but backend is not running. Start backend to process video.",
          variant: "destructive",
        });
      }

      toast({
        title: "Upload successful!",
        description: "AI analysis started. You can check the status in your dashboard.",
      });

      // Navigate to dashboard
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);

    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: "Upload Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      if (stopProcessingSimulation) stopProcessingSimulation();
      setIsUploading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 sm:py-12 max-w-4xl">
        <div className="text-center mb-6 sm:mb-8 animate-fade-in">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3 px-2">Record Your Reflection</h1>
          <p className="text-muted-foreground text-base sm:text-lg px-2">
            Take 5-10 minutes to practice your communication skills
          </p>
        </div>

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
              <strong className="text-blue-600 block mb-1">Pro Tips:</strong>
              Find a quiet space, maintain eye contact with the camera, and speak clearly. 
              Aim for the full 5 minutes for the most accurate analysis.
            </AlertDescription>
          </Alert>

          <Alert className="border-brand-green/20 bg-brand-green/5">
            <Shield className="h-4 w-4 text-brand-green" aria-hidden="true" />
            <AlertDescription className="text-sm">
              <strong className="text-brand-green block mb-1">Privacy Guaranteed:</strong>
              Your recording is processed locally on your device first. 
              We never share your personal data with third parties.
            </AlertDescription>
          </Alert>
        </div>

        {isUploading ? (
          <Card className="p-6 sm:p-8 mb-6 shadow-medium">
            <div className="text-center space-y-4">
              {uploadProgress < 100 ? (
                <>
                  <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" aria-hidden="true" />
                  <h3 className="text-lg font-semibold">Uploading your video... {uploadProgress}%</h3>
                  <Progress value={uploadProgress} className="w-full" />
                </>
              ) : (
                <>
                  <Zap className="h-12 w-12 animate-pulse mx-auto text-brand-green" aria-hidden="true" />
                  <h3 className="text-lg font-semibold">{statusMessage || "Analyzing content..."}</h3>
                  <Progress value={processingProgress} className="w-full" />
                </>
              )}
              <p className="text-sm text-muted-foreground">
                Please don't close this page. This may take a few moments.
              </p>
            </div>
          </Card>
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
    </Layout>
  );
};

export default Record;
