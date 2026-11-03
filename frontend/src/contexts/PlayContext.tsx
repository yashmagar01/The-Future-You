import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  PLAY_LEVELS,
  ALL_BADGES,
  computeStars,
  findBadge,
  getLevelById,
  getLevelStatus,
  getStreakMultiplier,
  hasBadge,
  calculatePlayerLevel,
  type LevelProgress,
  type PlayLevel,
  type PlayerLevelInfo,
  type GamificationBadge,
} from '@/data/playLevels';

export interface LevelResult {
  levelId: string;
  level: PlayLevel;
  score: number;
  stars: number;
  xpEarned: number;
  badgeEarned: boolean;
  /** Badge ids unlocked by this submission. */
  badgesEarned: string[];
  cleared: boolean;
  /** True when this recording had already been counted (e.g. page refresh). */
  alreadyClaimed: boolean;
}

interface PlayContextValue {
  progress: Record<string, LevelProgress>;
  xp: number;
  badges: string[];
  /** ISO unlock date keyed by badge id. */
  badgeDates: Record<string, string>;
  streak: number;
  longestStreak: number;
  streakMultiplier: number;
  playerLevel: PlayerLevelInfo;
  allBadges: GamificationBadge[];
  lastResult: LevelResult | null;
  /** Submit a score for a play level. Returns the computed result. */
  recordLevelResult: (levelId: string, score: number, sessionId?: string) => LevelResult;
  /** Award XP for completing a regular daily reflection session */
  awardReflectionXp: (score?: number, sessionId?: string) => { xpEarned: number; newBadge?: string };
  /** Dismiss the last completion result (after celebration). */
  clearLastResult: () => void;
  /** Level numbers (1-based) that are currently unlocked. */
  unlockedLevels: number[];
  /** Resolve status for a level. */
  getStatus: (level: PlayLevel) => LevelProgress;
  /** True when the given level number is unlocked. */
  isUnlocked: (levelNumber: number) => boolean;
}

const PlayContext = createContext<PlayContextValue | undefined>(undefined);

const STORAGE_KEY = 'tfu_play_progress_v1';
const XP_STORAGE_KEY = 'tfu_play_xp_v1';
const BADGES_STORAGE_KEY = 'tfu_play_badges_v1';
const BADGE_DATES_KEY = 'tfu_play_badge_dates_v1';
const STREAK_STORAGE_KEY = 'tfu_play_streak_v1';
const LONGEST_STREAK_KEY = 'tfu_play_longest_streak_v1';
const LAST_ACTIVE_KEY = 'tfu_play_last_active_v1';
const CLAIMED_SESSIONS_KEY = 'tfu_play_claimed_sessions_v1';

const getTodayString = () => new Date().toISOString().split('T')[0];

const readStorage = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const writeStorage = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage unavailable */
  }
};

const loadProgress = (): Record<string, LevelProgress> => {
  try {
    const raw = readStorage(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, LevelProgress>) : {};
  } catch {
    return {};
  }
};

const loadNumber = (key: string, fallback: number) => {
  const raw = readStorage(key);
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) ? n : fallback;
};

/** Migrate legacy badge titles to badge ids so lookups stay stable. */
const loadBadges = (): string[] => {
  try {
    const raw = readStorage(BADGES_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((entry) => (typeof entry === 'string' ? findBadge(entry)?.id ?? entry : null))
      .filter((entry): entry is string => !!entry);
  } catch {
    return [];
  }
};

const loadBadgeDates = (): Record<string, string> => {
  try {
    const raw = readStorage(BADGE_DATES_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, string>) : {};
  } catch {
    return {};
  }
};

const loadClaimedSessions = (): Set<string> => {
  try {
    const raw = readStorage(CLAIMED_SESSIONS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : []);
  } catch {
    return new Set();
  }
};

export const PlayProvider = ({ children }: { children: ReactNode }) => {
  const [progress, setProgress] = useState<Record<string, LevelProgress>>(loadProgress);
  const [xp, setXp] = useState<number>(() => loadNumber(XP_STORAGE_KEY, 0));
  const [badges, setBadges] = useState<string[]>(loadBadges);
  const [badgeDates, setBadgeDates] = useState<Record<string, string>>(loadBadgeDates);
  const [streak, setStreak] = useState<number>(() => loadNumber(STREAK_STORAGE_KEY, 0));
  const [longestStreak, setLongestStreak] = useState<number>(() =>
    Math.max(loadNumber(LONGEST_STREAK_KEY, 0), loadNumber(STREAK_STORAGE_KEY, 0))
  );
  const [lastActiveDate, setLastActiveDate] = useState<string | null>(() => readStorage(LAST_ACTIVE_KEY));
  const [lastResult, setLastResult] = useState<LevelResult | null>(null);

  // Refs keep sequential awards in one render accurate (state updates are async).
  const progressRef = useRef(progress);
  const badgesRef = useRef(badges);
  const streakRef = useRef(streak);
  const longestStreakRef = useRef(longestStreak);
  const lastActiveRef = useRef(lastActiveDate);
  const claimedSessionsRef = useRef(loadClaimedSessions());

  // Derive 10-level Player Rank info
  const playerLevel = useMemo(() => calculatePlayerLevel(xp), [xp]);
  const streakMultiplier = getStreakMultiplier(streak);

  useEffect(() => {
    writeStorage(STORAGE_KEY, JSON.stringify(progress));
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    writeStorage(XP_STORAGE_KEY, String(xp));
  }, [xp]);

  useEffect(() => {
    writeStorage(BADGES_STORAGE_KEY, JSON.stringify(badges));
    badgesRef.current = badges;
  }, [badges]);

  useEffect(() => {
    writeStorage(BADGE_DATES_KEY, JSON.stringify(badgeDates));
  }, [badgeDates]);

  useEffect(() => {
    writeStorage(STREAK_STORAGE_KEY, String(streak));
    streakRef.current = streak;
  }, [streak]);

  useEffect(() => {
    writeStorage(LONGEST_STREAK_KEY, String(longestStreak));
    longestStreakRef.current = longestStreak;
  }, [longestStreak]);

  useEffect(() => {
    if (lastActiveDate) writeStorage(LAST_ACTIVE_KEY, lastActiveDate);
    lastActiveRef.current = lastActiveDate;
  }, [lastActiveDate]);

  const persistClaimedSessions = useCallback(() => {
    writeStorage(CLAIMED_SESSIONS_KEY, JSON.stringify([...claimedSessionsRef.current]));
  }, []);

  const awardBadge = useCallback((badgeIdOrTitle: string): boolean => {
    const badge = findBadge(badgeIdOrTitle);
    const id = badge?.id ?? badgeIdOrTitle;
    if (hasBadge(badgesRef.current, id)) return false;

    const next = [...badgesRef.current, id];
    badgesRef.current = next;
    setBadges(next);
    setBadgeDates((prev) => ({ ...prev, [id]: new Date().toISOString() }));
    return true;
  }, []);

  const updateStreak = useCallback((): number => {
    const today = getTodayString();
    const lastActive = lastActiveRef.current;

    if (!lastActive) {
      streakRef.current = 1;
      lastActiveRef.current = today;
      setStreak(1);
      setLongestStreak((prev) => {
        const next = Math.max(prev, 1);
        longestStreakRef.current = next;
        return next;
      });
      setLastActiveDate(today);
      return 1;
    }

    if (lastActive === today) {
      return streakRef.current;
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const nextStreak = lastActive === yesterdayStr ? streakRef.current + 1 : 1;
    streakRef.current = nextStreak;
    lastActiveRef.current = today;
    setStreak(nextStreak);
    setLastActiveDate(today);

    const nextLongest = Math.max(longestStreakRef.current, nextStreak);
    longestStreakRef.current = nextLongest;
    setLongestStreak(nextLongest);

    if (nextStreak >= 3) awardBadge('badge-streak-3');
    if (nextStreak >= 7) awardBadge('badge-streak-7');
    if (nextStreak >= 30) awardBadge('badge-streak-30');

    return nextStreak;
  }, [awardBadge]);

  const writeProgress = useCallback((next: Record<string, LevelProgress>) => {
    progressRef.current = next;
    setProgress(next);
  }, []);

  const isUnlocked = useCallback(
    (levelNumber: number): boolean => {
      if (levelNumber <= 1) return true;
      const prev = progressRef.current[`level-${levelNumber - 1}`];
      return !!prev && prev.status === 'completed';
    },
    []
  );

  const unlockedLevels = useMemo(() => {
    const unlocked: number[] = [];
    for (const level of PLAY_LEVELS) {
      if (isUnlocked(level.level)) unlocked.push(level.level);
    }
    return unlocked;
  }, [isUnlocked, progress]);

  const getStatus = useCallback(
    (level: PlayLevel): LevelProgress => getLevelStatus(level, progress),
    [progress]
  );

  const recordLevelResult = useCallback(
    (levelId: string, score: number, sessionId?: string): LevelResult => {
      const level = getLevelById(levelId);
      if (!level) throw new Error(`Unknown play level: ${levelId}`);

      const safeScore = Number.isFinite(score) ? Math.max(0, Math.min(100, Math.round(score))) : 0;
      const cleared = safeScore >= level.unlockAfterScore;
      const stars = computeStars(safeScore, level);

      // A recording is only ever counted once, even if the analysis page is refreshed.
      if (sessionId) {
        if (claimedSessionsRef.current.has(sessionId)) {
          const stored = progressRef.current[levelId];
          const alreadyResult: LevelResult = {
            levelId,
            level,
            score: stored?.bestScore ?? safeScore,
            stars: stored?.stars ?? stars,
            xpEarned: 0,
            badgeEarned: false,
            badgesEarned: [],
            cleared: stored?.status === 'completed',
            alreadyClaimed: true,
          };
          setLastResult(alreadyResult);
          return alreadyResult;
        }
        claimedSessionsRef.current.add(sessionId);
        persistClaimedSessions();
      }

      const streakDays = updateStreak();
      const prev: LevelProgress =
        progressRef.current[levelId] ?? {
          bestScore: 0,
          stars: 0,
          attempts: 0,
          status: 'available',
          completedAt: null,
        };

      const firstClear = cleared && prev.status !== 'completed';
      const nextStars = cleared ? Math.max(prev.stars, stars) : prev.stars;

      const next: LevelProgress = {
        bestScore: Math.max(prev.bestScore, safeScore),
        stars: nextStars,
        attempts: prev.attempts + 1,
        status: cleared ? 'completed' : prev.status,
        completedAt: cleared ? prev.completedAt ?? new Date().toISOString() : prev.completedAt,
      };

      const nextProgress = { ...progressRef.current, [levelId]: next };
      writeProgress(nextProgress);

      const badgesEarned: string[] = [];
      let xpEarned = 0;

      if (cleared) {
        // First clear = full reward. Replays only pay for genuine improvement.
        if (firstClear) {
          xpEarned = level.xpReward;
        } else {
          const starGain = Math.max(0, nextStars - prev.stars);
          if (starGain > 0) {
            xpEarned = Math.round(level.xpReward * 0.2 * starGain);
          } else if (safeScore > prev.bestScore) {
            xpEarned = Math.round(level.xpReward * 0.1);
          }
        }

        const multiplier = getStreakMultiplier(streakDays);
        xpEarned = Math.round(xpEarned * multiplier);

        if (awardBadge(level.badge)) {
          const badge = findBadge(level.badge);
          if (badge) badgesEarned.push(badge.id);
        }
        if (safeScore >= 95 && awardBadge('badge-zero-fillers')) {
          badgesEarned.push('badge-zero-fillers');
        }

        const allCleared = PLAY_LEVELS.every(
          (l) => nextProgress[l.id]?.status === 'completed'
        );
        if (allCleared && awardBadge('badge-quest-complete')) {
          badgesEarned.push('badge-quest-complete');
        }
      }

      if (xpEarned > 0) setXp((value) => value + xpEarned);

      const result: LevelResult = {
        levelId,
        level,
        score: safeScore,
        stars: nextStars,
        xpEarned,
        badgeEarned: badgesEarned.length > 0,
        badgesEarned,
        cleared,
        alreadyClaimed: false,
      };

      setLastResult(result);
      return result;
    },
    [awardBadge, persistClaimedSessions, updateStreak, writeProgress]
  );

  const awardReflectionXp = useCallback(
    (score?: number, sessionId?: string) => {
      if (sessionId) {
        if (claimedSessionsRef.current.has(sessionId)) {
          return { xpEarned: 0 };
        }
        claimedSessionsRef.current.add(sessionId);
        persistClaimedSessions();
      }

      const streakDays = updateStreak();
      const baseEarned = 50;
      const scoreBonus = score && score >= 80 ? Math.round((score - 80) * 1.5) : 0;
      const xpEarned = Math.round((baseEarned + scoreBonus) * getStreakMultiplier(streakDays));

      setXp((value) => value + xpEarned);

      let newBadge: string | undefined;
      if (score != null && score >= 95 && awardBadge('badge-zero-fillers')) {
        newBadge = findBadge('badge-zero-fillers')?.title ?? 'Zero Filler Ninja';
      }

      return { xpEarned, newBadge };
    },
    [awardBadge, persistClaimedSessions, updateStreak]
  );

  const clearLastResult = useCallback(() => setLastResult(null), []);

  const value = useMemo<PlayContextValue>(
    () => ({
      progress,
      xp,
      badges,
      badgeDates,
      streak,
      longestStreak,
      streakMultiplier,
      playerLevel,
      allBadges: ALL_BADGES,
      lastResult,
      recordLevelResult,
      awardReflectionXp,
      clearLastResult,
      isUnlocked,
      getStatus,
      unlockedLevels,
    }),
    [
      progress,
      xp,
      badges,
      badgeDates,
      streak,
      longestStreak,
      streakMultiplier,
      playerLevel,
      lastResult,
      recordLevelResult,
      awardReflectionXp,
      clearLastResult,
      isUnlocked,
      getStatus,
      unlockedLevels,
    ]
  );

  return <PlayContext.Provider value={value}>{children}</PlayContext.Provider>;
};

export const usePlay = (): PlayContextValue => {
  const ctx = useContext(PlayContext);
  if (!ctx) throw new Error('usePlay must be used within a PlayProvider');
  return ctx;
};
