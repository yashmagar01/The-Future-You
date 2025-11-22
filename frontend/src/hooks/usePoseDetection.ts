import { useState, useEffect, useRef } from 'react';
import * as vision from '@mediapipe/tasks-vision';

const { PoseLandmarker, FilesetResolver, DrawingUtils } = vision;

export interface PoseLandmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export interface PoseData {
  landmarks: PoseLandmark[][];
  timestamp: number;
  worldLandmarks?: PoseLandmark[][];
}

export interface UsePoseDetectionOptions {
  onPoseDetected?: (poseData: PoseData) => void;
  enableCanvas?: boolean;
}

export function usePoseDetection(options: UsePoseDetectionOptions = {}) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [poseData, setPoseData] = useState<PoseData | null>(null);
  
  const poseLandmarkerRef = useRef<typeof PoseLandmarker.prototype | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingUtilsRef = useRef<typeof DrawingUtils.prototype | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number>(0);

  // Initialize MediaPipe Pose Landmarker
  useEffect(() => {
    let mounted = true;

    const initializePoseLandmarker = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Load MediaPipe vision tasks
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );

        // Create PoseLandmarker
        const poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
            delegate: 'GPU'
          },
          runningMode: 'VIDEO',
          numPoses: 1,
          minPoseDetectionConfidence: 0.3,
          minPosePresenceConfidence: 0.3,
          minTrackingConfidence: 0.3
        });

        if (mounted) {
          poseLandmarkerRef.current = poseLandmarker;
          setIsLoading(false);
          console.log('MediaPipe Pose Landmarker initialized');
        }
      } catch (err) {
        if (mounted) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to initialize pose detection';
          setError(errorMessage);
          setIsLoading(false);
          console.error('Pose detection initialization error:', err);
        }
      }
    };

    initializePoseLandmarker();

    return () => {
      mounted = false;
      if (poseLandmarkerRef.current) {
        poseLandmarkerRef.current.close();
        poseLandmarkerRef.current = null;
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Process video frame for pose detection
  const detectPose = async (video: HTMLVideoElement): Promise<PoseData | null> => {
    if (!poseLandmarkerRef.current || !video.videoWidth || !video.videoHeight) {
      return null;
    }

    try {
      // Ensure timestamp is always increasing (MediaPipe requirement)
      const now = performance.now();
      const timestamp = Math.max(now, lastTimestampRef.current + 1);
      lastTimestampRef.current = timestamp;
      
      const results = poseLandmarkerRef.current.detectForVideo(video, timestamp);

      if (results.landmarks && results.landmarks.length > 0) {
        const newPoseData: PoseData = {
          landmarks: results.landmarks,
          worldLandmarks: results.worldLandmarks,
          timestamp
        };

        setPoseData(newPoseData);
        
        if (options.onPoseDetected) {
          options.onPoseDetected(newPoseData);
        }

        return newPoseData;
      }
    } catch (err) {
      console.error('Error detecting pose:', err);
    }

    return null;
  };

  // Draw pose landmarks on canvas
  const drawPose = (canvas: HTMLCanvasElement, video: HTMLVideoElement) => {
    if (!poseData || !poseData.landmarks.length) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Initialize DrawingUtils if needed
    if (!drawingUtilsRef.current) {
      drawingUtilsRef.current = new DrawingUtils(ctx);
    }

    // Draw landmarks
    const drawingUtils = drawingUtilsRef.current;
    for (const landmarks of poseData.landmarks) {
      // Ensure all landmarks have visibility property
      const normalizedLandmarks = landmarks.map(lm => ({
        ...lm,
        visibility: lm.visibility ?? 1.0
      }));
      
      drawingUtils.drawLandmarks(normalizedLandmarks, {
        radius: 2,
        color: '#00FF00',
        fillColor: '#00FF00'
      });
      drawingUtils.drawConnectors(
        normalizedLandmarks,
        PoseLandmarker.POSE_CONNECTIONS,
        { color: '#00FF00', lineWidth: 2 }
      );
    }
  };

  // Start continuous pose detection on video element
  const startPoseDetection = (video: HTMLVideoElement, canvas?: HTMLCanvasElement) => {
    if (canvas) {
      canvasRef.current = canvas;
    }

    const detectFrame = async () => {
      if (!poseLandmarkerRef.current) return;

      await detectPose(video);
      
      if (options.enableCanvas && canvasRef.current) {
        drawPose(canvasRef.current, video);
      }

      animationFrameRef.current = requestAnimationFrame(detectFrame);
    };

    detectFrame();
  };

  // Stop continuous detection
  const stopPoseDetection = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  };

  return {
    isLoading,
    error,
    poseData,
    detectPose,
    drawPose,
    startPoseDetection,
    stopPoseDetection
  };
}
