import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Video, Circle, Square, Upload, AlertCircle, Loader2, Pause, Play, RotateCcw, Check, X, Mic, User } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { usePoseDetection, type PoseData } from '@/hooks/usePoseDetection';
import { analyzePosture, type PostureMetrics } from '@/utils/poseAnalysis';

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
  const [isPaused, setIsPaused] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>('');
  const [audioLevel, setAudioLevel] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [showPoseOverlay, setShowPoseOverlay] = useState(true);
  const [postureMetrics, setPostureMetrics] = useState<PostureMetrics | null>(null);
  const [poseHistory, setPoseHistory] = useState<PoseData[]>([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const poseCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const { toast } = useToast();

  // Initialize pose detection
  const {
    isLoading: poseLoading,
    error: poseError,
    poseData,
    startPoseDetection,
    stopPoseDetection
  } = usePoseDetection({
    onPoseDetected: (data: PoseData) => {
      if (isRecording && data.landmarks.length > 0) {
        // Analyze posture
        const metrics = analyzePosture(data.landmarks[0]);
        setPostureMetrics(metrics);
        
        // Store pose data for recording
        setPoseHistory(prev => [...prev, data].slice(-300)); // Keep last 300 frames
      }
    },
    enableCanvas: showPoseOverlay
  });

  // Request camera access on mount
  useEffect(() => {
    requestCameraAccess();
    return () => {
      stopCamera();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Audio visualization
  useEffect(() => {
    if (!stream || !isRecording || isPaused) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      setAudioLevel(0);
      return;
    }

    const visualize = () => {
      if (!analyserRef.current) return;

      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);

      // Calculate average volume
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      setAudioLevel(average);

      animationFrameRef.current = requestAnimationFrame(visualize);
    };

    visualize();
  }, [stream, isRecording, isPaused]);

  const requestCameraAccess = async () => {
    try {
      console.log('Requesting camera access...');
      setError('');
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: true
      });

      console.log('Camera access granted, stream:', mediaStream);
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        console.log('Video element srcObject set');
      } else {
        console.error('videoRef.current is null!');
      }

      // Setup audio analysis
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(mediaStream);
      source.connect(analyser);
      analyser.fftSize = 256;

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      setIsPreviewing(true);
      
      // Start pose detection on video (optional, non-blocking)
      if (videoRef.current) {
        setTimeout(() => {
          if (videoRef.current && poseCanvasRef.current) {
            try {
              startPoseDetection(videoRef.current, poseCanvasRef.current);
            } catch (err) {
              console.warn('Pose detection failed to start, continuing without it:', err);
            }
          }
        }, 1000); // Wait longer for video to be ready
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setError('Unable to access camera. Please check permissions and try again.');
      setTimeout(() => {
        toast({
          title: 'Camera Error',
          description: 'Could not access your camera. Please grant permission.',
          variant: 'destructive',
        });
      }, 0);
    }
  };

  const stopCamera = () => {
    stopPoseDetection();
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const startRecordingProcess = () => {
    if (!stream) return;

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
        setRecordedBlob(blob);
        setIsReviewing(true);
        setIsRecording(false);
        setIsPaused(false);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000); // Collect data every second

      startTimeRef.current = Date.now();
      setIsRecording(true);
      setIsPaused(false);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        if (!isPaused) {
          const elapsed = Math.floor((Date.now() - startTimeRef.current - pausedTimeRef.current) / 1000);
          setRecordingTime(elapsed);

          // Auto-stop at max duration
          if (elapsed >= maxDuration) {
            stopRecording();
          }
        }
      }, 1000);

      setTimeout(() => {
        toast({
          title: 'Recording started',
          description: 'Speak clearly and maintain eye contact.',
        });
      }, 0);
    } catch (err) {
      console.error('Recording error:', err);
      setError('Failed to start recording. Please try again.');
      setTimeout(() => {
        toast({
          title: 'Recording Error',
          description: 'Could not start recording. Please try again.',
          variant: 'destructive',
        });
      }, 0);
    }
  };

  const startRecording = () => {
    if (!stream) {
      setTimeout(() => {
        toast({
          title: 'No camera access',
          description: 'Please allow camera access to record.',
          variant: 'destructive',
        });
      }, 0);
      return;
    }

    setCountdown(3);
    const countInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev === 1) {
          clearInterval(countInterval);
          startRecordingProcess();
          return null;
        }
        return prev ? prev - 1 : null;
      });
    }, 1000);
  };

  const togglePause = () => {
    if (!mediaRecorderRef.current) return;

    if (isPaused) {
      mediaRecorderRef.current.resume();
      // Adjust start time to account for pause duration
      const pauseDuration = Date.now() - (startTimeRef.current + recordingTime * 1000);
      startTimeRef.current += pauseDuration; // This logic is slightly off, let's fix it
      // Better approach: track total paused time
      // Actually, simpler: just track last pause start time
    } else {
      mediaRecorderRef.current.pause();
    }
    setIsPaused(!isPaused);
  };

  // Fix for pause timer logic
  useEffect(() => {
    if (isPaused) {
      pausedTimeRef.current = Date.now();
    } else if (pausedTimeRef.current > 0) {
      // We just resumed
      const pauseDuration = Date.now() - pausedTimeRef.current;
      startTimeRef.current += pauseDuration;
      pausedTimeRef.current = 0;
    }
  }, [isPaused]);

  const stopRecording = () => {
    if (mediaRecorderRef.current && (isRecording || isPaused)) {
      mediaRecorderRef.current.stop();
      // State updates happen in onstop callback

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const handleSave = () => {
    if (recordedBlob) {
      onRecordingComplete(recordedBlob, recordingTime);
    }
  };

  const handleDiscard = () => {
    setRecordedBlob(null);
    setIsReviewing(false);
    setRecordingTime(0);
    chunksRef.current = [];
    // Re-initialize stream if needed or just ensure preview is active
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play();
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

      <Card className="p-4 sm:p-8 shadow-medium animate-scale-in">
        <div className="aspect-video bg-muted rounded-lg mb-6 overflow-hidden relative touch-pan-y">
          {isPreviewing && !isReviewing ? (
            <div className="relative w-full h-full">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                webkit-playsinline="true"
                x-webkit-airplay="allow"
                className={`w-full h-full object-cover ${isRecording ? 'brightness-110' : ''}`}
                aria-label="Video preview"
              />
              {/* Pose overlay canvas */}
              {showPoseOverlay && (
                <canvas
                  ref={poseCanvasRef}
                  className="absolute top-0 left-0 w-full h-full pointer-events-none"
                  aria-hidden="true"
                />
              )}
            </div>
          ) : isReviewing && recordedBlob ? (
            <video
              src={URL.createObjectURL(recordedBlob)}
              controls
              className="w-full h-full object-contain bg-black"
              aria-label="Recording review"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center p-4">
              <div className="text-center">
                <Video className="h-16 w-16 text-muted-foreground mx-auto mb-4" aria-hidden="true" />
                <Button
                  onClick={requestCameraAccess}
                  size="lg"
                  className="min-h-[44px] touch-manipulation"
                  aria-label="Enable camera access"
                >
                  Enable Camera
                </Button>
              </div>
            </div>
          )}

          {/* Countdown Overlay */}
          {countdown !== null && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20 backdrop-blur-sm">
              <div className="text-9xl font-bold text-white animate-bounce">
                {countdown}
              </div>
            </div>
          )}

          {/* Recording Indicator & Timer */}
          {isRecording && !isReviewing && (
            <div className="absolute top-4 left-4 flex items-center gap-3 bg-black/70 text-white px-4 py-2 rounded-full backdrop-blur-md z-10">
              <div className={`h-3 w-3 rounded-full ${isPaused ? 'bg-yellow-500' : 'bg-red-500 animate-pulse'}`} />
              <span className="font-mono font-medium text-base">{formatTime(recordingTime)}</span>
            </div>
          )}

          {/* Audio Visualizer */}
          {isRecording && !isPaused && !isReviewing && (
            <div className="absolute bottom-4 right-4 flex items-end gap-1 h-8 z-10">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-1.5 bg-green-500 rounded-t-sm transition-all duration-75"
                  style={{
                    height: `${Math.max(4, Math.min(32, audioLevel * (1 + i * 0.5)))}px`,
                    opacity: 0.8
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!isReviewing ? (
              <>
                {!isRecording ? (
                  <Button
                    size="lg"
                    className="px-8 min-h-[44px] touch-manipulation w-full sm:w-auto"
                    onClick={startRecording}
                    disabled={!isPreviewing || countdown !== null}
                    aria-label="Start recording video"
                  >
                    <Circle className="mr-2 h-5 w-5 fill-current text-red-500" />
                    Start Recording
                  </Button>
                ) : (
                  <div className="flex gap-4 w-full sm:w-auto">
                    <Button
                      size="lg"
                      variant={isPaused ? "default" : "secondary"}
                      className="flex-1 sm:flex-none min-h-[44px]"
                      onClick={togglePause}
                      aria-label={isPaused ? "Resume recording" : "Pause recording"}
                    >
                      {isPaused ? (
                        <>
                          <Play className="mr-2 h-5 w-5" /> Resume
                        </>
                      ) : (
                        <>
                          <Pause className="mr-2 h-5 w-5" /> Pause
                        </>
                      )}
                    </Button>
                    <Button
                      size="lg"
                      variant="destructive"
                      className="flex-1 sm:flex-none min-h-[44px]"
                      onClick={stopRecording}
                      aria-label="Stop recording"
                    >
                      <Square className="mr-2 h-5 w-5 fill-current" />
                      Stop
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex gap-4 w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="outline"
                  className="flex-1 sm:flex-none min-h-[44px]"
                  onClick={handleDiscard}
                >
                  <RotateCcw className="mr-2 h-5 w-5" />
                  Retake
                </Button>
                <Button
                  size="lg"
                  className="flex-1 sm:flex-none min-h-[44px]"
                  onClick={handleSave}
                >
                  <Check className="mr-2 h-5 w-5" />
                  Save Recording
                </Button>
              </div>
            )}

            {!isRecording && !isReviewing && (
              <Button
                size="lg"
                variant="outline"
                className="px-8 min-h-[44px] touch-manipulation"
                asChild
              >
                <label className="cursor-pointer">
                  <Upload className="mr-2 h-5 w-5" aria-hidden="true" />
                  Upload Video
                  <input
                    type="file"
                    accept="video/*"
                    capture="user"
                    onChange={handleFileUpload}
                    className="hidden"
                    aria-label="Upload or capture video"
                  />
                </label>
              </Button>
            )}
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
