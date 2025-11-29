import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { AlertCircle, Loader2, Clock, Zap, Info, Shield } from "lucide-react";
import Layout from "@/components/Layout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { VideoRecorder } from "@/components/VideoRecorder";
import { ScriptDisplay } from "@/components/ScriptDisplay";
import { useCreateRecording } from "@/hooks/useRecordings";
import { uploadRecording } from "@/hooks/useRecordings";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";

const Record = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [userRole, setUserRole] = useState<'tester' | 'user' | 'admin'>('user');
  const [loadingRole, setLoadingRole] = useState(true);
  const createRecording = useCreateRecording();
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

  const handleRecordingComplete = async (blob: Blob, duration: number) => {
    if (!user) return;

    try {
      setIsUploading(true);
      setUploadProgress(0); // Reset progress (progress bar might be static or indeterminate now)

      toast({
        title: "Uploading...",
        description: "Please wait while we upload your video.",
      });

      // 1. Upload Video to Supabase Storage
      const fileName = `${user.id}/${Date.now()}.webm`;
      const file = new File([blob], fileName, { type: 'video/webm' });

      const { error: uploadError } = await supabase.storage
        .from('recordings')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // 2. Insert Metadata into Database (Trigger for Backend)
      const { error: dbError } = await supabase
        .from('recordings')
        .insert([
          {
            user_id: user.id,
            video_url: fileName, // Storing the storage path
            duration_seconds: duration,
            file_size_bytes: blob.size,
            status: 'uploaded', // This status change triggers the backend
            title: `Recording ${new Date().toLocaleDateString()}`,
            // created_at is usually auto-generated, but we can pass it if needed
          },
        ]);

      if (dbError) throw dbError;

      toast({
        title: "Upload successful!",
        description: "AI analysis queued. You can check the status in your dashboard.",
      });

      // Navigate to dashboard
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);

    } catch (error) {
      console.error('Upload failed:', error);
      toast({
        title: "Upload Failed",
        description: "There was an error uploading your video. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!user) return;

    try {
      setIsUploading(true);
      setUploadProgress(0);

      toast({
        title: "Uploading...",
        description: "Please wait while we upload your video.",
      });

      // Get video duration
      const video = document.createElement('video');
      video.preload = 'metadata';

      const duration = await new Promise<number>((resolve) => {
        video.onloadedmetadata = () => {
          resolve(Math.floor(video.duration));
        };
        video.src = URL.createObjectURL(file);
      });

      // 1. Upload Video to Supabase Storage
      const fileName = `${user.id}/${Date.now()}-${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('recordings')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // 2. Insert Metadata into Database
      const { error: dbError } = await supabase
        .from('recordings')
        .insert([
          {
            user_id: user.id,
            video_url: fileName,
            duration_seconds: duration,
            file_size_bytes: file.size,
            status: 'uploaded',
            title: file.name || `Uploaded ${new Date().toLocaleDateString()}`,
          },
        ]);

      if (dbError) throw dbError;

      toast({
        title: "Upload successful!",
        description: "AI analysis queued. You can check the status in your dashboard.",
      });

      // Navigate to dashboard
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: "There was an error uploading your video. Please try again.",
        variant: "destructive",
      });
    } finally {
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
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" aria-hidden="true" />
              <h3 className="text-lg font-semibold">Uploading your video...</h3>
              <Progress value={uploadProgress} className="w-full" />
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
