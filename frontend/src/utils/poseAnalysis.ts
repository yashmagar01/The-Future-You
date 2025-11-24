import { PoseLandmark } from '@/hooks/usePoseDetection';

// MediaPipe Pose landmark indices
export const POSE_LANDMARKS = {
  NOSE: 0,
  LEFT_EYE_INNER: 1,
  LEFT_EYE: 2,
  LEFT_EYE_OUTER: 3,
  RIGHT_EYE_INNER: 4,
  RIGHT_EYE: 5,
  RIGHT_EYE_OUTER: 6,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  MOUTH_LEFT: 9,
  MOUTH_RIGHT: 10,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_PINKY: 17,
  RIGHT_PINKY: 18,
  LEFT_INDEX: 19,
  RIGHT_INDEX: 20,
  LEFT_THUMB: 21,
  RIGHT_THUMB: 22,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_HEEL: 29,
  RIGHT_HEEL: 30,
  LEFT_FOOT_INDEX: 31,
  RIGHT_FOOT_INDEX: 32
};

export interface PostureMetrics {
  shoulderAlignment: number; // 0-100, higher is better
  headTilt: number; // degrees from vertical
  backStraightness: number; // 0-100, higher is straighter
  overallScore: number; // 0-100 composite score
  issues: string[]; // Array of detected posture issues
}

/**
 * Calculate the angle between three points
 */
function calculateAngle(a: PoseLandmark, b: PoseLandmark, c: PoseLandmark): number {
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs(radians * 180.0 / Math.PI);
  
  if (angle > 180.0) {
    angle = 360 - angle;
  }
  
  return angle;
}

/**
 * Calculate distance between two points
 */
function calculateDistance(a: PoseLandmark, b: PoseLandmark): number {
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
}

/**
 * Check if shoulder alignment is level (good posture)
 * Returns 0-100, where 100 is perfectly level
 */
export function analyzeShoulderAlignment(landmarks: PoseLandmark[]): number {
  const leftShoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
  const rightShoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
  
  if (!leftShoulder || !rightShoulder) return 0;
  
  // Calculate angle from horizontal
  const heightDiff = Math.abs(leftShoulder.y - rightShoulder.y);
  const width = Math.abs(leftShoulder.x - rightShoulder.x);
  const angle = Math.atan2(heightDiff, width) * (180 / Math.PI);
  
  // Convert to 0-100 scale (lower angle = better alignment)
  const score = Math.max(0, 100 - (angle * 10));
  return score;
}

/**
 * Analyze head tilt/forward head posture
 * Returns angle in degrees from vertical
 */
export function analyzeHeadTilt(landmarks: PoseLandmark[]): number {
  const nose = landmarks[POSE_LANDMARKS.NOSE];
  const leftShoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
  const rightShoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
  
  if (!nose || !leftShoulder || !rightShoulder) return 0;
  
  // Calculate midpoint between shoulders
  const shoulderMidpoint = {
    x: (leftShoulder.x + rightShoulder.x) / 2,
    y: (leftShoulder.y + rightShoulder.y) / 2,
    z: (leftShoulder.z + rightShoulder.z) / 2
  };
  
  // Calculate angle of head relative to shoulders
  const angle = Math.atan2(nose.x - shoulderMidpoint.x, shoulderMidpoint.y - nose.y) * (180 / Math.PI);
  
  return Math.abs(angle);
}

/**
 * Analyze back straightness using shoulder-hip alignment
 * Returns 0-100, where 100 is straight
 */
export function analyzeBackStraightness(landmarks: PoseLandmark[]): number {
  const leftShoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
  const rightShoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
  const leftHip = landmarks[POSE_LANDMARKS.LEFT_HIP];
  const rightHip = landmarks[POSE_LANDMARKS.RIGHT_HIP];
  
  if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) return 0;
  
  // Calculate midpoints
  const shoulderMid = {
    x: (leftShoulder.x + rightShoulder.x) / 2,
    y: (leftShoulder.y + rightShoulder.y) / 2
  };
  const hipMid = {
    x: (leftHip.x + rightHip.x) / 2,
    y: (leftHip.y + rightHip.y) / 2
  };
  
  // Calculate angle from vertical
  const angle = Math.atan2(Math.abs(shoulderMid.x - hipMid.x), hipMid.y - shoulderMid.y) * (180 / Math.PI);
  
  // Convert to score (lower angle = straighter back)
  const score = Math.max(0, 100 - (angle * 5));
  return score;
}

/**
 * Comprehensive posture analysis
 */
export function analyzePosture(landmarks: PoseLandmark[]): PostureMetrics {
  const shoulderAlignment = analyzeShoulderAlignment(landmarks);
  const headTilt = analyzeHeadTilt(landmarks);
  const backStraightness = analyzeBackStraightness(landmarks);
  
  // Detect specific issues
  const issues: string[] = [];
  
  if (shoulderAlignment < 70) {
    issues.push('Uneven shoulders detected');
  }
  
  if (headTilt > 15) {
    issues.push('Forward head posture');
  }
  
  if (backStraightness < 60) {
    issues.push('Slouching detected');
  }
  
  // Calculate overall score (weighted average)
  const overallScore = (
    shoulderAlignment * 0.3 +
    (100 - Math.min(headTilt * 3, 100)) * 0.4 +
    backStraightness * 0.3
  );
  
  return {
    shoulderAlignment,
    headTilt,
    backStraightness,
    overallScore,
    issues
  };
}

/**
 * Get posture recommendations based on analysis
 */
export function getPostureRecommendations(metrics: PostureMetrics): string[] {
  const recommendations: string[] = [];
  
  if (metrics.shoulderAlignment < 70) {
    recommendations.push('Keep your shoulders level and relaxed');
  }
  
  if (metrics.headTilt > 15) {
    recommendations.push('Bring your head back over your shoulders');
  }
  
  if (metrics.backStraightness < 60) {
    recommendations.push('Sit or stand up straighter');
  }
  
  if (metrics.overallScore > 80) {
    recommendations.push('Great posture! Keep it up');
  } else if (metrics.overallScore > 60) {
    recommendations.push('Good posture, minor adjustments needed');
  } else {
    recommendations.push('Focus on improving your posture');
  }
  
  return recommendations;
}
