// Learn mode data: static lesson catalog for the /learn pages.

// Coaching topics supported in the Learn mode catalog.
export type LearnTopic =
  // Topic: cutting filler words.
  | 'Cutting filler words'
  // Topic: finding your pace.
  | 'Finding your pace'
  // Topic: posture and body language.
  | 'Posture and body language'
  // Topic: voice energy and volume.
  | 'Voice energy and volume'
  // Topic: tone and expression.
  | 'Tone and expression'
  // Topic: structuring your thoughts.
  | 'Structuring your thoughts';

// Single lesson entry used by the Learn mode lesson cards.
export interface LearnLesson {
  id: string; // Lesson id used for /learn/:id navigation.
  title: string; // Short lesson title for cards and headers.
  topic: LearnTopic; // Coaching topic covered by this lesson.
  minutes: number; // Estimated lesson length in minutes.
  available: boolean; // False when the lesson is coming soon.
}

// Static Learn mode lesson catalog. First three lessons are available.
export const learnLessons: LearnLesson[] = [
  // Lesson 1: cutting filler words. Available now.
  { id: 'cutting-filler-words', title: 'Cutting Filler Words', topic: 'Cutting filler words', minutes: 5, available: true }, // Filler-word removal lesson.
  // Lesson 2: finding your pace. Available now.
  { id: 'finding-your-pace', title: 'Finding Your Pace', topic: 'Finding your pace', minutes: 7, available: true }, // Pacing lesson.
  // Lesson 3: posture and body language. Available now.
  { id: 'posture-and-body-language', title: 'Posture and Body Language', topic: 'Posture and body language', minutes: 6, available: true }, // Posture lesson.
  // Lesson 4: voice energy and volume. Coming soon.
  { id: 'voice-energy-and-volume', title: 'Voice Energy and Volume', topic: 'Voice energy and volume', minutes: 8, available: false }, // Coming soon lesson.
  // Lesson 5: tone and expression. Coming soon.
  { id: 'tone-and-expression', title: 'Tone and Expression', topic: 'Tone and expression', minutes: 6, available: false }, // Coming soon lesson.
  // Lesson 6: structuring your thoughts. Coming soon.
  { id: 'structuring-your-thoughts', title: 'Structuring Your Thoughts', topic: 'Structuring your thoughts', minutes: 10, available: false }, // Coming soon lesson.
];
