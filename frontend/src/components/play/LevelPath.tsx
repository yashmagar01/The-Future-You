import { motion } from 'framer-motion';
import { Lock, Play, Star, Zap } from 'lucide-react';
import { PLAY_LEVELS, getLevelStatus, type PlayLevel } from '@/data/playLevels';
import { usePlay } from '@/contexts/PlayContext';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { analytics } from '@/lib/analytics';

interface LevelPathProps {
  onSelectLevel: (level: PlayLevel) => void;
}

const difficultyLabel = (d: number) => (d <= 3 ? 'Easy' : d <= 6 ? 'Medium' : d <= 8 ? 'Hard' : 'Expert');

export function LevelPath({ onSelectLevel }: LevelPathProps) {
  const { progress } = usePlay();
  const { toast } = useToast();

  const handleSelect = (level: PlayLevel) => {
    const status = getLevelStatus(level, progress);
    if (status.status === 'locked') {
      toast({
        title: 'Level Locked 🔒',
        description: `Clear Level ${level.level - 1} to unlock "${level.title}".`,
        variant: 'destructive',
      });
      return;
    }
    onSelectLevel(level);
    analytics.trackPlayStarted(level.id, level.level).catch(() => {});
  };

  return (
    <div className="relative max-w-xl mx-auto">
      {/* Vertical connector line behind the path */}
      <div
        className="absolute left-[23px] top-6 bottom-6 w-px bg-gradient-to-b from-emerald-300 via-emerald-400 to-emerald-600/30"
        aria-hidden="true"
      />

      <div>
        {PLAY_LEVELS.map((level, index) => {
          const status = getLevelStatus(level, progress);
          const isDone = status.status === 'completed';
          const isCurrent = status.status === 'available';
          const isLocked = status.status === 'locked';

          return (
            <div key={level.id} className="relative pb-8 last:pb-0">
              {/* Level node on the path */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10">
                <motion.div
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.06 * index, type: 'spring', stiffness: 260, damping: 16 }}
                >
                  {isLocked ? (
                    <div className="w-12 h-12 rounded-full bg-muted/70 border-4 border-border flex items-center justify-center text-muted-foreground">
                      <Lock className="h-5 w-5" />
                    </div>
                  ) : (
                    <div className="relative">
                      {isCurrent && <div className="absolute inset-0 rounded-full border-4 border-emerald-400 animate-ping" />}
                      <div
                        className={cn(
                          'relative w-12 h-12 rounded-full border-4 flex items-center justify-center text-xl transition-colors duration-300',
                          isDone ? 'bg-emerald-500 border-emerald-400' : 'bg-card border-border'
                        )}
                      >
                        {isDone ? (
                          <span className="text-white font-bold text-lg">✓</span>
                        ) : (
                          <span>{level.emoji}</span>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              </div>

              {/* Level card */}
              <div className="pl-14">
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.06 * index, duration: 0.35 }}
                  className={cn(
                    'rounded-2xl border p-4 transition-all duration-300',
                    isLocked
                      ? 'bg-muted/40 border-border opacity-70'
                      : isDone
                        ? 'bg-emerald-500/5 border-emerald-500/30'
                        : 'bg-card border-border shadow-sm'
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg leading-tight">Level {level.level}</h3>
                        <span className="text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                          {difficultyLabel(level.difficulty)}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
                          <Zap className="h-3 w-3" /> +{level.xpReward} XP
                        </span>
                      </div>
                      <p className="text-sm font-medium text-foreground/80 mt-0.5">
                        {level.title} · {level.tagline}
                      </p>
                    </div>

                    {isLocked ? (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground px-3 py-1.5">
                        <Lock className="h-3.5 w-3.5" /> LOCKED
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSelect(level)}
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all',
                          isDone
                            ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'
                            : 'bg-brand-green text-white hover:bg-brand-green/90 shadow-md shadow-emerald-500/25'
                        )}
                      >
                        <Play className="h-3.5 w-3.5" />
                        {isDone ? 'REPLAY' : 'START'}
                      </button>
                    )}
                  </div>

                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{level.prompt}</p>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-muted-foreground">Focus:</span>
                    {level.focusMetrics.map((m) => (
                      <span
                        key={m}
                        className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-accent/10 text-accent capitalize"
                      >
                        {m}
                      </span>
                    ))}
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      Best score:{' '}
                      <strong className="text-foreground">{status.bestScore > 0 ? status.bestScore : level.unlockAfterScore}+</strong>
                    </span>
                    <div className="flex items-center gap-1.5">
                      {isDone ? (
                        <div className="flex items-center gap-1">
                          {[1, 2, 3].map((starNum) => (
                            <Star
                              key={starNum}
                              className={cn(
                                'h-3.5 w-3.5',
                                starNum <= status.stars ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30 fill-none'
                              )}
                            />
                          ))}
                          <span className="text-xs font-semibold text-emerald-600 ml-1">Cleared</span>
                        </div>
                      ) : (
                        <span>Clear at {level.unlockAfterScore}+</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
