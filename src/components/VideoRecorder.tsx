import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Video, Circle, Square, Upload, AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

interface VideoRecorderProps {
  onRecordingComplete: (blob: Blob, duration: number) => void;
  onUploadFile: (file: File) => void;
  maxDuration?: number; // in seconds
}

export const VideoRecorder = ({ 
  onRecordingComplete, 
  onUploadFile,
  maxDuration = 600 // 10 minutes default
}: VideoRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const { toast } = useToast();

  // Request camera access on mount
  useEffect(() => {
    requestCameraAccess();
    return () => {
      stopCamera();
    };
  }, []);

  const requestCameraAccess = async () => {
    try {
      setError('');
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: true
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsPreviewing(true);
    } catch (err) {
      console.error('Camera access error:', err);
      setError('Unable to access camera. Please check permissions and try again.');
      toast({
        title: 'Camera Error',
        description: 'Could not access your camera. Please grant permission.',
        variant: 'destructive',
      });
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const startRecording = () => {
    if (!stream) {
      toast({
        title: 'No camera access',
        description: 'Please allow camera access to record.',
        variant: 'destructive',
      });
      return;
    }

    try {
      chunksRef.current = [];
      
      const options: MediaRecorderOptions = {
        mimeType: 'video/webm;codecs=vp9,opus',
      };

      // Fallback to vp8 if vp9 not supported
      if (!MediaRecorder.isTypeSupported(options.mimeType!)) {
        options.mimeType = 'video/webm;codecs=vp8,opus';
      }

      const mediaRecorder = new MediaRecorder(stream, options);
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        onRecordingComplete(blob, duration);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000); // Collect data every second
      
      startTimeRef.current = Date.now();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setRecordingTime(elapsed);

        // Auto-stop at max duration
        if (elapsed >= maxDuration) {
          stopRecording();
        }
      }, 1000);

      toast({
        title: 'Recording started',
        description: 'Speak clearly and maintain eye contact.',
      });
    } catch (err) {
      console.error('Recording error:', err);
      setError('Failed to start recording. Please try again.');
      toast({
        title: 'Recording Error',
        description: 'Could not start recording. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      toast({
        title: 'Recording complete',
        description: 'Processing your video...',
      });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      toast({
        title: 'Invalid file',
        description: 'Please upload a video file.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 500MB)
    const maxSize = 500 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: 'File too large',
        description: 'Please upload a video smaller than 500MB.',
        variant: 'destructive',
      });
      return;
    }

    onUploadFile(file);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatMaxTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    return `${mins}:00`;
  };

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive" className="animate-fade-in">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="p-8 shadow-medium animate-scale-in">
        <div className="aspect-video bg-muted rounded-lg mb-6 overflow-hidden relative">
          {isPreviewing ? (
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <Video className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <Button onClick={requestCameraAccess}>
                  Enable Camera
                </Button>
              </div>
            </div>
          )}
          
          {isRecording && (
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/70 text-white px-3 py-2 rounded-full">
              <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
              <span className="font-medium text-sm">REC</span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex gap-4 justify-center">
            <Button 
              size="lg" 
              className="px-8"
              onClick={isRecording ? stopRecording : startRecording}
              disabled={!isPreviewing}
            >
              {isRecording ? (
                <>
                  <Square className="mr-2 h-5 w-5 fill-current" />
                  Stop Recording
                </>
              ) : (
                <>
                  <Circle className="mr-2 h-5 w-5" />
                  Start Recording
                </>
              )}
            </Button>
            
            <Button 
              size="lg" 
              variant="outline" 
              className="px-8"
              disabled={isRecording}
              asChild
            >
              <label>
                <Upload className="mr-2 h-5 w-5" />
                Upload Video
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </Button>
          </div>

          {isRecording && (
            <div className="text-center animate-fade-in">
              <div className="flex items-center justify-center gap-2 text-destructive">
                <span className="font-medium">Recording time: {formatTime(recordingTime)} / {formatMaxTime(maxDuration)}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {recordingTime < 300 
                  ? 'Try to record at least 5 minutes for better feedback'
                  : 'Great! You\'re doing well'}
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
