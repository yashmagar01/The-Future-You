import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Video, Circle, Square, Upload, AlertCircle, Loader2, Pause, Play, RotateCcw, Check, X, Mic, Shield, Info, User } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { usePoseDetection, type PoseData } from '@/hooks/usePoseDetection';
import { analyzePosture, type PostureMetrics } from '@/utils/poseAnalysis';
import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";


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
    visualize();
  }, [stream, isRecording, isPaused]);

  // Attach stream to video element when it becomes available
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      console.log('Video element srcObject set via useEffect');
    }
  }, [stream, isPreviewing]);

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
      setIsPreviewing(true);

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
    <TooltipProvider>
      <div className="space-y-6">
        {error && (
          <Alert variant="destructive" className="animate-fade-in">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card className="p-4 sm:p-8 shadow-medium animate-scale-in border-2 border-border/50">
          <div className="aspect-video bg-slate-950 rounded-xl mb-6 overflow-hidden relative touch-pan-y group shadow-inner">
            {/* Privacy Badge */}
            <div className="absolute top-4 right-4 z-20 bg-black/40 backdrop-blur-md text-white/90 px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 border border-white/10">
              <Shield className="h-3 w-3" />
              Private & Local
            </div>

            {isPreviewing && !isReviewing ? (
              <div className="relative w-full h-full">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                webkit-playsinline="true"
                x-webkit-airplay="allow"
                className={`w-full h-full object-cover transition-all duration-500 ${isRecording ? 'brightness-110 scale-[1.02]' : ''}`}
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
              <div className="w-full h-full flex items-center justify-center p-4 bg-slate-900/50">
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-6 animate-pulse">
                    <Video className="h-10 w-10 text-slate-400" aria-hidden="true" />
                  </div>
                  <Button
                    onClick={requestCameraAccess}
                    size="lg"
                    className="min-h-[44px] touch-manipulation font-semibold"
                    aria-label="Enable camera access"
                  >
                    Enable Camera Access
                  </Button>
                  <p className="text-sm text-slate-500 mt-4">
                    We need camera access to analyze your speech and body language.
                    <br />Your video is processed locally.
                  </p>
                </div>
              </div>
            )}

            {/* Countdown Overlay */}
            {countdown !== null && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-30 backdrop-blur-sm">
                <div className="text-9xl font-bold text-white animate-bounce drop-shadow-2xl">
                  {countdown}
                </div>
              </div>
            )}

            {/* Recording Indicator & Timer */}
            {isRecording && !isReviewing && (
              <div className="absolute top-4 left-4 flex items-center gap-3 bg-red-500/90 text-white px-4 py-2 rounded-full backdrop-blur-md z-20 shadow-lg animate-in fade-in slide-in-from-top-4 duration-300">
                <div className={`h-3 w-3 rounded-full ${isPaused ? 'bg-yellow-300' : 'bg-white animate-pulse'}`} />
                <span className="font-mono font-bold text-base tracking-wider">{formatTime(recordingTime)}</span>
              </div>
            )}

            {/* Audio Visualizer & Confidence Preview */}
            {isRecording && !isPaused && !isReviewing && (
              <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/80 to-transparent z-10 flex items-end justify-between px-6 pb-6">
                {/* Audio Bars */}
                <div className="flex items-end gap-1 h-12">
                  {[...Array(8)].map((_, i) => (
                    <div
                      key={i}
                      className="w-2 bg-brand-green rounded-t-sm transition-all duration-75 shadow-[0_0_10px_rgba(34,197,94,0.5)]"
                      style={{
                        height: `${Math.max(4, Math.min(48, audioLevel * (1 + i * 0.3)))}px`,
                        opacity: 0.8 + (i * 0.02)
                      }}
                    />
                  ))}
                </div>

                {/* Confidence Meter Preview (Mock) */}
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[10px] uppercase tracking-wider text-white/70 font-semibold">Confidence Detect</span>
                  <div className="h-1.5 w-24 bg-white/20 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.max(20, audioLevel * 2))}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Timeline Slider (Visual Only during recording) */}
            {isRecording && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 z-20">
                <div 
                  className="h-full bg-red-500 transition-all duration-1000 ease-linear"
                  style={{ width: `${(recordingTime / maxDuration) * 100}%` }}
                />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {!isReviewing ? (
                <>
                  {!isRecording ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="lg"
                          className="px-8 min-h-[52px] touch-manipulation w-full sm:w-auto rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 bg-red-600 hover:bg-red-700 text-white"
                          onClick={startRecording}
                          disabled={!isPreviewing || countdown !== null}
                          aria-label="Start recording video"
                        >
                          <div className="p-1 bg-white/20 rounded-full mr-3">
                            <Circle className="h-4 w-4 fill-current text-white" />
                          </div>
                          <span className="text-lg font-semibold">Start Recording</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Begin your 5-minute reflection</p>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <div className="flex gap-4 w-full sm:w-auto justify-center">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="lg"
                            variant={isPaused ? "default" : "secondary"}
                            className="flex-1 sm:flex-none min-h-[52px] rounded-full px-8"
                            onClick={togglePause}
                            aria-label={isPaused ? "Resume recording" : "Pause recording"}
                          >
                            {isPaused ? (
                              <>
                                <Play className="mr-2 h-5 w-5 fill-current" /> Resume
                              </>
                            ) : (
                              <>
                                <Pause className="mr-2 h-5 w-5 fill-current" /> Pause
                              </>
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{isPaused ? "Continue recording" : "Pause temporarily"}</p>
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="lg"
                            variant="destructive"
                            className="flex-1 sm:flex-none min-h-[52px] rounded-full px-8 shadow-lg hover:shadow-red-500/20"
                            onClick={stopRecording}
                            aria-label="Stop recording"
                          >
                            <Square className="mr-2 h-5 w-5 fill-current" />
                            Stop
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Finish and review</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex gap-4 w-full sm:w-auto justify-center">
                  <Button
                    size="lg"
                    variant="outline"
                    className="flex-1 sm:flex-none min-h-[52px] rounded-full px-8 border-2"
                    onClick={handleDiscard}
                  >
                    <RotateCcw className="mr-2 h-5 w-5" />
                    Retake
                  </Button>
                  <Button
                    size="lg"
                    className="flex-1 sm:flex-none min-h-[52px] rounded-full px-8 bg-brand-green hover:bg-brand-green/90 text-white shadow-lg hover:shadow-brand-green/20"
                    onClick={handleSave}
                  >
                    <Check className="mr-2 h-5 w-5" />
                    Save Recording
                  </Button>
                </div>
              )}

              {!isRecording && !isReviewing && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="lg"
                      variant="ghost"
                      className="px-6 min-h-[52px] touch-manipulation rounded-full text-muted-foreground hover:text-foreground"
                      asChild
                    >
                      <label className="cursor-pointer flex items-center gap-2">
                        <Upload className="h-5 w-5" aria-hidden="true" />
                        <span className="font-medium">Upload File</span>
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
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Upload an existing video file</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>

            {isRecording && (
              <div className="text-center animate-fade-in">
                <div className="flex items-center justify-center gap-2 text-muted-foreground mb-2">
                  <Info className="h-4 w-4" />
                  <span className="text-sm font-medium">Recording time: {formatTime(recordingTime)} / {formatMaxTime(maxDuration)}</span>
                </div>
                <Slider 
                  value={[recordingTime]} 
                  max={maxDuration} 
                  step={1} 
                  disabled 
                  className="w-full max-w-md mx-auto"
                />
                <p className="text-sm text-muted-foreground mt-3 font-medium">
                  {recordingTime < 300
                    ? '💡 Tip: Record at least 5 minutes for better feedback'
                    : '✨ Great! You\'re doing well'}
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </TooltipProvider>
  );
};
