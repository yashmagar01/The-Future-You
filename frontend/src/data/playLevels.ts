// Play Mode — Level System Data
// The 10-level game ladder for the Play Mode.

export interface PlayLevel {
  id: string;
  level: number;
  title: string;
  tagline: string;
  category: string;
  emoji: string;
  difficulty: number; // 1 - 10
  prompt: string;
  durationTargetSec: number;
  focusMetrics: string[];
  unlockAfterScore: number; // minimum overall score required to clear & unlock next
  xpReward: number; // XP awarded on clear
  badge: string; // badge earned on clear
}

export const PLAY_LEVELS: PlayLevel[] = [
  {
    id: 'level-1',
    level: 1,
    title: 'Warm-Up Breath',
    tagline: 'Find your voice',
    category: 'Confidence',
    emoji: '🌬️',
    difficulty: 1,
    prompt: 'Talk about something small from your day — a moment you felt proud, scared, or grateful this week. Just speak naturally for about 20 seconds.',
    durationTargetSec: 20,
    focusMetrics: ['confidence', 'fillers'],
    unlockAfterScore: 50,
    xpReward: 50,
    badge: 'First Words Badge',
  },
  {
    id: 'level-2',
    level: 2,
    title: 'First Words (Self-Intro)',
    tagline: 'Your story starts here',
    category: 'Confidence',
    emoji: '🗣️',
    difficulty: 2,
    prompt: 'Introduce yourself: your name, what you do, and one thing you are passionate about. Keep it around 30 seconds.',
    durationTargetSec: 30,
    focusMetrics: ['confidence', 'clarity'],
    unlockAfterScore: 55,
    xpReward: 60,
    badge: 'Self-Intro Starter',
  },
  {
    id: 'level-3',
    level: 3,
    title: 'Explain Simply',
    tagline: 'Clarity is kindness',
    category: 'Clarity',
    emoji: '💡',
    difficulty: 3,
    prompt: 'Explain something you have learned recently in simple words that a 10-year-old could understand. Around 45 seconds.',
    durationTargetSec: 45,
    focusMetrics: ['structure', 'clarity'],
    unlockAfterScore: 60,
    xpReward: 70,
    badge: 'Clarity Seeker',
  },
  {
    id: 'level-4',
    level: 4,
    title: 'Interview Elevator Pitch',
    tagline: 'Tell me about yourself',
    category: 'Interview Skills',
    emoji: '💼',
    difficulty: 4,
    prompt: 'Answer the classic interview question: "Tell me about yourself." Use a simple structure: past, present, future. Around 60 seconds.',
    durationTargetSec: 60,
    focusMetrics: ['confidence', 'structure'],
    unlockAfterScore: 65,
    xpReward: 80,
    badge: 'Interview Rookie',
  },
  {
    id: 'level-5',
    level: 5,
    title: 'The Curveball Question',
    tagline: 'Stay cool under fire',
    category: 'Confidence',
    emoji: '🎯',
    difficulty: 5,
    prompt: 'Answer a curveball you do not need to be perfect for: "Why should we hire you?" or "What is your biggest weakness?" Stay calm, honest and composed. Around 60 seconds.',
    durationTargetSec: 60,
    focusMetrics: ['confidence', 'composure'],
    unlockAfterScore: 70,
    xpReward: 90,
    badge: 'Steady Hands',
  },
  {
    id: 'level-6',
    level: 6,
    title: 'Story Time',
    tagline: 'Stories move people',
    category: 'Storytelling',
    emoji: '📖',
    difficulty: 6,
    prompt: 'Tell a short personal story using the STAR method (Situation, Task, Action, Result). Around 90 seconds.',
    durationTargetSec: 90,
    focusMetrics: ['structure', 'pacing'],
    unlockAfterScore: 75,
    xpReward: 100,
    badge: 'Master Storyteller',
  },
  {
    id: 'level-7',
    level: 7,
    title: 'The Persuasive Pitch',
    tagline: 'Ideas need speakers',
    category: 'Presentation',
    emoji: '🚀',
    difficulty: 7,
    prompt: 'Pitch an idea — a product, a personal goal, anything — to an audience that might say yes or no. Around 90 seconds.',
    durationTargetSec: 90,
    focusMetrics: ['pacing', 'confidence'],
    unlockAfterScore: 78,
    xpReward: 110,
    badge: 'Pitch Architect',
  },
  {
    id: 'level-8',
    level: 8,
    title: 'On My Feet (Impromptu)',
    tagline: 'Thinking out loud',
    category: 'Confidence',
    emoji: '🤹',
    difficulty: 8,
    prompt: 'Speak spontaneously for about 60 seconds without any preparation — pick a topic like your dream job, your hometown or a failure, and just talk.',
    durationTargetSec: 60,
    focusMetrics: ['confidence', 'fillers', 'spontaneity'],
    unlockAfterScore: 82,
    xpReward: 120,
    badge: 'Quick Thinker',
  },
  {
    id: 'level-9',
    level: 9,
    title: 'High Stakes Pressure',
    tagline: 'Pressure is a privilege',
    category: 'Interview Skills',
    emoji: '🎤',
    difficulty: 9,
    prompt: 'Practice a high-stakes conversation you have been avoiding — negotiate a raise, push back on scope, or hold a tough boundary. Around 120 seconds.',
    durationTargetSec: 120,
    focusMetrics: ['composure', 'pacing', 'structure'],
    unlockAfterScore: 86,
    xpReward: 130,
    badge: 'Pressure Player',
  },
  {
    id: 'level-10',
    level: 10,
    title: 'Full Mock Interview',
    tagline: 'The final boss',
    category: 'Interview Skills',
    emoji: '🏆',
    difficulty: 10,
    prompt: 'Run a mini mock interview: answer 3 classic questions back-to-back (intro, behavioral story, weakness) covering a full ~3 minute round.',
    durationTargetSec: 180,
    focusMetrics: ['confidence', 'clarity', 'pacing', 'fillers', 'composure'],
    unlockAfterScore: 90,
    xpReward: 150,
    badge: 'Grandmaster Orator',
  },
];

export const getLevelById = (id: string): PlayLevel | undefined =>
  PLAY_LEVELS.find((l) => l.id === id);

export const getLevelByNumber = (number: number): PlayLevel | undefined =>
  PLAY_LEVELS.find((l) => l.level === number);

/**
 * Stars earned for a score: 0 = not cleared.
 * 1 star = passed the benchmark, 2 stars = +8 above it, 3 stars = +15 above it.
 */
export const computeStars = (score: number, level: PlayLevel): number => {
  if (score < level.unlockAfterScore) return 0;
  if (score >= level.unlockAfterScore + 15) return 3;
  if (score >= level.unlockAfterScore + 8) return 2;
  return 1;
};

/** First level that is not completed yet, or the final level once everything is cleared. */
export const getNextPlayableLevel = (
  progress: Record<string, LevelProgress>
): PlayLevel => {
  const available = PLAY_LEVELS.find((l) => getLevelStatus(l, progress).status === 'available');
  return available ?? PLAY_LEVELS[PLAY_LEVELS.length - 1];
};

/** Streak XP multiplier: +10% at 3 days, +20% at 7 days. */
export const getStreakMultiplier = (streakDays: number): number => {
  if (streakDays >= 7) return 1.2;
  if (streakDays >= 3) return 1.1;
  return 1;
};

export const getStreakMultiplierLabel = (streakDays: number): string => {
  if (streakDays >= 7) return '+20% XP bonus';
  if (streakDays >= 3) return '+10% XP bonus';
  return 'No streak bonus yet';
};

/** Find a badge by its id or legacy title (progress used to store titles). */
export const findBadge = (idOrTitle: string): GamificationBadge | undefined =>
  ALL_BADGES.find((b) => b.id === idOrTitle || b.title === idOrTitle);

/** True when the badge list contains the badge (supports legacy title storage). */
export const hasBadge = (badges: string[], badge: GamificationBadge | string): boolean => {
  const key = typeof badge === 'string' ? badge : badge.id;
  const title = typeof badge === 'string' ? findBadge(badge)?.title : badge.title;
  return badges.includes(key) || (!!title && badges.includes(title));
};

export interface LevelProgress {
  bestScore: number;
  stars: number;
  attempts: number;
  status: 'locked' | 'available' | 'completed';
  completedAt: string | null;
}

export const getInitialLevelProgress = (): LevelProgress => ({
  bestScore: 0,
  stars: 0,
  attempts: 0,
  status: 'available',
  completedAt: null,
});

/** Resolve the display status of a level based on the unlock chain. */
export const getLevelStatus = (
  level: PlayLevel,
  progress: Record<string, LevelProgress>
): LevelProgress => {
  if (level.level > 1) {
    const prev = progress[`level-${level.level - 1}`];
    if (!prev || prev.status !== 'completed') {
      return { bestScore: 0, stars: 0, attempts: 0, status: 'locked', completedAt: null };
    }
  }

  const stored = progress[level.id];
  if (stored) return stored;

  // Level 1 is always available; deeper levels only when the previous one is cleared.
  return level.level === 1
    ? getInitialLevelProgress()
    : { ...getInitialLevelProgress(), status: 'available' };
};

/** Level N is unlocked when level N-1 has been completed. Level 1 is always unlocked. */
export const isLevelUnlocked = (
  levelNumber: number,
  progress: Record<string, LevelProgress>
): boolean => {
  if (levelNumber <= 1) return true;
  const prev = progress[`level-${levelNumber - 1}`];
  return !!prev && prev.status === 'completed';
};

// ==========================================
// 10 Player Mastery Levels (Global XP Ranks)
// ==========================================

export interface PlayerRank {
  level: number;
  title: string;
  emoji: string;
  minXp: number;
  maxXp: number;
  perk: string;
  description: string;
  color: string;
}

export const PLAYER_RANKS: PlayerRank[] = [
  {
    level: 1,
    title: 'Novice Speaker',
    emoji: '🌱',
    minXp: 0,
    maxXp: 100,
    perk: 'Unlocks Core Video Analysis',
    description: 'Starting the journey to overcome camera shyness and find your natural speaking voice.',
    color: 'from-emerald-400 to-green-600',
  },
  {
    level: 2,
    title: 'Vocal Explorer',
    emoji: '🗣️',
    minXp: 100,
    maxXp: 250,
    perk: 'Unlocks Tone & Emotional Presence Breakdown',
    description: 'Developing comfort speaking on camera and observing your voice tonality.',
    color: 'from-teal-400 to-emerald-600',
  },
  {
    level: 3,
    title: 'Articulate Apprentice',
    emoji: '💡',
    minXp: 250,
    maxXp: 450,
    perk: 'Unlocks Filler Word Heatmap',
    description: 'Consciously trimming filler words and structuring thoughts before speaking.',
    color: 'from-cyan-400 to-blue-600',
  },
  {
    level: 4,
    title: 'Poised Communicator',
    emoji: '🎯',
    minXp: 450,
    maxXp: 700,
    perk: 'Unlocks Posture & Eye Contact Tracking',
    description: 'Mastering posture, steady eye contact, and comfortable pauses.',
    color: 'from-blue-400 to-indigo-600',
  },
  {
    level: 5,
    title: 'Confident Storyteller',
    emoji: '📖',
    minXp: 700,
    maxXp: 1000,
    perk: 'Unlocks STAR Method Narrative Guide',
    description: 'Structuring clear narratives that hook listeners and deliver memorable takeaways.',
    color: 'from-indigo-400 to-purple-600',
  },
  {
    level: 6,
    title: 'Dynamic Presenter',
    emoji: '🚀',
    minXp: 1000,
    maxXp: 1400,
    perk: 'Unlocks Pacing & Pitch Modulation Curves',
    description: 'Modulating energy and pitch dynamically to keep audiences engaged.',
    color: 'from-purple-400 to-pink-600',
  },
  {
    level: 7,
    title: 'Persuasive Speaker',
    emoji: '⚡',
    minXp: 1400,
    maxXp: 1900,
    perk: 'Unlocks Audience Persuasion Index',
    description: 'Delivering persuasive arguments that move listeners to action.',
    color: 'from-amber-400 to-orange-600',
  },
  {
    level: 8,
    title: 'Stage Commander',
    emoji: '🤹',
    minXp: 1900,
    maxXp: 2500,
    perk: 'Unlocks Impromptu Pressure Drills',
    description: 'Effortlessly speaking off-the-cuff with zero preparation under pressure.',
    color: 'from-orange-400 to-red-600',
  },
  {
    level: 9,
    title: 'Charismatic Orator',
    emoji: '🎤',
    minXp: 2500,
    maxXp: 3300,
    perk: 'Unlocks Executive Presence Benchmark',
    description: 'Radiating executive presence, genuine warmth, and quiet authority.',
    color: 'from-rose-500 to-red-700',
  },
  {
    level: 10,
    title: 'The Future You',
    emoji: '🏆',
    minXp: 3300,
    maxXp: 5000,
    perk: 'Grandmaster Orator — All Insights & Badges Unlocked',
    description: 'You speak with unshakeable confidence, clarity, and authenticity.',
    color: 'from-amber-300 via-yellow-500 to-amber-600',
  },
];

export interface PlayerLevelInfo {
  currentRank: PlayerRank;
  nextRank: PlayerRank | null;
  level: number;
  totalXp: number;
  xpInCurrentLevel: number;
  xpNeededForNextLevel: number;
  progressPercent: number; // 0 to 100
}

export const calculatePlayerLevel = (xp: number): PlayerLevelInfo => {
  const clampedXp = Math.max(0, xp);
  let currentRank = PLAYER_RANKS[0];

  for (const rank of PLAYER_RANKS) {
    if (clampedXp >= rank.minXp) {
      currentRank = rank;
    }
  }

  const currentIndex = PLAYER_RANKS.findIndex((r) => r.level === currentRank.level);
  const nextRank = currentIndex < PLAYER_RANKS.length - 1 ? PLAYER_RANKS[currentIndex + 1] : null;

  if (!nextRank) {
    return {
      currentRank,
      nextRank: null,
      level: currentRank.level,
      totalXp: clampedXp,
      xpInCurrentLevel: clampedXp - currentRank.minXp,
      xpNeededForNextLevel: 0,
      progressPercent: 100,
    };
  }

  const xpSpan = nextRank.minXp - currentRank.minXp;
  const xpProgress = clampedXp - currentRank.minXp;
  const progressPercent = Math.min(100, Math.max(0, Math.round((xpProgress / xpSpan) * 100)));

  return {
    currentRank,
    nextRank,
    level: currentRank.level,
    totalXp: clampedXp,
    xpInCurrentLevel: xpProgress,
    xpNeededForNextLevel: Math.max(0, nextRank.minXp - clampedXp),
    progressPercent,
  };
};

// ==========================================
// Collectible Badges Catalog
// ==========================================

export interface GamificationBadge {
  id: string;
  title: string;
  emoji: string;
  category: 'Level' | 'Streak' | 'Skill' | 'Milestone';
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  description: string;
  criteria: string;
}

export const ALL_BADGES: GamificationBadge[] = [
  {
    id: 'badge-first-words',
    title: 'First Words Badge',
    emoji: '🌬️',
    category: 'Level',
    rarity: 'Common',
    description: 'Broke the ice by clearing Level 1: Warm-Up Breath.',
    criteria: 'Clear Level 1 with 50+ score',
  },
  {
    id: 'badge-self-intro',
    title: 'Self-Intro Starter',
    emoji: '🗣️',
    category: 'Level',
    rarity: 'Common',
    description: 'Introduced yourself with clarity and confidence on Level 2.',
    criteria: 'Clear Level 2 with 55+ score',
  },
  {
    id: 'badge-clarity-seeker',
    title: 'Clarity Seeker',
    emoji: '💡',
    category: 'Level',
    rarity: 'Rare',
    description: 'Explained a concept simply and concisely on Level 3.',
    criteria: 'Clear Level 3 with 60+ score',
  },
  {
    id: 'badge-interview-rookie',
    title: 'Interview Rookie',
    emoji: '💼',
    category: 'Level',
    rarity: 'Rare',
    description: 'Delivered a sharp interview intro on Level 4.',
    criteria: 'Clear Level 4 with 65+ score',
  },
  {
    id: 'badge-steady-hands',
    title: 'Steady Hands',
    emoji: '🎯',
    category: 'Level',
    rarity: 'Rare',
    description: 'Answered a curveball question with calm poise on Level 5.',
    criteria: 'Clear Level 5 with 70+ score',
  },
  {
    id: 'badge-storyteller',
    title: 'Master Storyteller',
    emoji: '📖',
    category: 'Level',
    rarity: 'Epic',
    description: 'Structured a vivid narrative using STAR on Level 6.',
    criteria: 'Clear Level 6 with 75+ score',
  },
  {
    id: 'badge-pitch-master',
    title: 'Pitch Architect',
    emoji: '🚀',
    category: 'Level',
    rarity: 'Epic',
    description: 'Persuaded listeners with high energy and pacing on Level 7.',
    criteria: 'Clear Level 7 with 78+ score',
  },
  {
    id: 'badge-quick-thinker',
    title: 'Quick Thinker',
    emoji: '🤹',
    category: 'Level',
    rarity: 'Epic',
    description: 'Spoke off-the-cuff without fillers on Level 8.',
    criteria: 'Clear Level 8 with 82+ score',
  },
  {
    id: 'badge-pressure-player',
    title: 'Pressure Player',
    emoji: '🎤',
    category: 'Level',
    rarity: 'Epic',
    description: 'Held composure in high-stakes negotiations on Level 9.',
    criteria: 'Clear Level 9 with 86+ score',
  },
  {
    id: 'badge-communication-master',
    title: 'Grandmaster Orator',
    emoji: '🏆',
    category: 'Level',
    rarity: 'Legendary',
    description: 'Conquered the final mock interview on Level 10.',
    criteria: 'Clear Level 10 with 90+ score',
  },
  {
    id: 'badge-streak-3',
    title: '3-Day Fire',
    emoji: '🔥',
    category: 'Streak',
    rarity: 'Common',
    description: 'Maintained a 3-day reflection speaking streak.',
    criteria: 'Record 3 days in a row',
  },
  {
    id: 'badge-streak-7',
    title: 'Weekly Warrior',
    emoji: '⚡',
    category: 'Streak',
    rarity: 'Rare',
    description: 'Kept the momentum alive for a full week.',
    criteria: 'Record 7 days in a row',
  },
  {
    id: 'badge-zero-fillers',
    title: 'Zero Filler Ninja',
    emoji: '🥋',
    category: 'Skill',
    rarity: 'Epic',
    description: 'Delivered a session with virtually zero filler words.',
    criteria: 'Achieve 95+ score on speech clarity',
  },
  {
    id: 'badge-streak-30',
    title: 'Unstoppable',
    emoji: '💎',
    category: 'Streak',
    rarity: 'Legendary',
    description: 'A full month of showing up for yourself.',
    criteria: 'Record 30 days in a row',
  },
  {
    id: 'badge-quest-complete',
    title: 'The Future You',
    emoji: '👑',
    category: 'Milestone',
    rarity: 'Legendary',
    description: 'Cleared every level of the 10-level quest and became the speaker you imagined.',
    criteria: 'Clear all 10 practice levels',
  },
];

