import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { AlertCircle, Loader2 } from "lucide-react";
import Layout from "@/components/Layout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { VideoRecorder } from "@/components/VideoRecorder";
import { useCreateRecording } from "@/hooks/useRecordings";
import { uploadRecording } from "@/hooks/useRecordings";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

const Record = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const createRecording = useCreateRecording();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleRecordingComplete = async (blob: Blob, duration: number) => {
    if (!user) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      toast({
        title: "Uploading...",
        description: "Please wait while we upload your video.",
      });

      // Convert blob to file
      const file = new File([blob], `recording-${Date.now()}.webm`, {
        type: 'video/webm',
      });

      // Upload to Supabase Storage
      const videoUrl = await uploadRecording(file, user.id, (progress) => {
        setUploadProgress(progress);
      });

      // Create recording record in database
      await createRecording.mutateAsync({
        video_url: videoUrl,
        duration_seconds: duration,
        file_size_bytes: blob.size,
        status: 'processing',
        title: `Recording ${new Date().toLocaleDateString()}`,
      });

      toast({
        title: "Success!",
        description: "Your recording has been saved successfully.",
      });

      // Navigate to gallery
      setTimeout(() => {
        navigate('/gallery');
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
      setUploadProgress(0);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!user) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
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

      // Upload to Supabase Storage
      const videoUrl = await uploadRecording(file, user.id, (progress) => {
        setUploadProgress(progress);
      });

      // Create recording record in database
      await createRecording.mutateAsync({
        video_url: videoUrl,
        duration_seconds: duration,
        file_size_bytes: file.size,
        status: 'processing',
        title: `Uploaded ${new Date().toLocaleDateString()}`,
      });

      toast({
        title: "Success!",
        description: "Your video has been uploaded successfully.",
      });

      // Navigate to gallery
      setTimeout(() => {
        navigate('/gallery');
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
      setUploadProgress(0);
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

        <Alert className="mb-6 sm:mb-8 animate-slide-up">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          <AlertDescription className="text-sm">
            <strong>Pro Tips:</strong> Find a quiet space, maintain good posture, look at the camera, 
            and speak clearly. Try to fill the full 5 minutes to get comprehensive feedback.
          </AlertDescription>
        </Alert>

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

        <Card className="p-4 sm:p-6 animate-slide-up">
          <h2 className="text-base sm:text-lg font-semibold mb-4">What to Talk About</h2>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>Practice an upcoming presentation or interview</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>Reflect on your day and express your thoughts clearly</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>Explain a complex topic to build articulation skills</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>Share a story or experience to work on engagement</span>
            </li>
          </ul>
        </Card>
      </div>
    </Layout>
  );
};

export default Record;
