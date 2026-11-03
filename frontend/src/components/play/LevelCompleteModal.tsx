import { useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Star, Trophy, Zap, Sparkles } from 'lucide-react';
import type { LevelResult } from '@/contexts/PlayContext';
import { findBadge, PLAY_LEVELS, type GamificationBadge } from '@/data/playLevels';
import { analytics } from '@/lib/analytics';

interface LevelCompleteModalProps {
  open: boolean;
  result: LevelResult | null;
  onClose: () => void;
  onPlayAgain: () => void;
  onNextLevel: () => void;
}

export function LevelCompleteModal({ open, result, onClose, onPlayAgain, onNextLevel }: LevelCompleteModalProps) {
  const cleared = !!result?.cleared;
  const isFinalLevel = result?.level.level === PLAY_LEVELS.length;
  const earnedBadges = useMemo(
    () => (result?.badgesEarned ?? []).map((id) => findBadge(id)).filter((b): b is GamificationBadge => !!b),
    [result?.badgesEarned]
  );

  useEffect(() => {
    if (open && cleared && result && !result.alreadyClaimed) {
      const end = Date.now() + 1200;
      const frame = () => {
        confetti({
          particleCount: 90,
          spread: 70,
          startVelocity: 55,
          origin: { y: 0.6 },
          colors: ['#10B981', '#0EA5E9', '#F59E0B', '#8B5CF6'],
        });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
      analytics.trackPlayCompleted(result.levelId, result.level.level, result.score, result.stars).catch(() => {});
    }
  }, [open, cleared, result]);

  return (
    <Dialog open={open && !!result} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-md text-center">
        {result && (
          <>
            <DialogHeader className="text-center">
              <div
                className={`mx-auto w-20 h-20 rounded-full border-2 flex items-center justify-center ${
                  cleared
                    ? 'bg-emerald-500/10 border-emerald-500/40'
                    : 'bg-amber-500/10 border-amber-500/40'
                }`}
              >
                {cleared ? (
                  <Trophy className="h-9 w-9 text-emerald-500" />
                ) : (
                  <Sparkles className="h-9 w-9 text-amber-500" />
                )}
              </div>
              <DialogTitle className="text-2xl">
                {cleared ? `Level ${result.level.level} Complete!` : `Level ${result.level.level} Score Recorded`}
              </DialogTitle>
              <DialogDescription>
                {cleared
                  ? isFinalLevel
                    ? 'You cleared the final boss. The future you is here. 🏆'
                    : 'You cleared the level. The path moves forward.'
                  : `You need ${result.level.unlockAfterScore}+ to clear this level. Keep practicing — every rep counts.`}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Your score</p>
                <p className={`text-5xl font-extrabold ${cleared ? 'text-primary' : 'text-amber-500'}`}>
                  {Math.round(result.score)}
                </p>
                <p className="mt-1 text-xs font-semibold text-muted-foreground">
                  Pass benchmark: {result.level.unlockAfterScore}+
                </p>
                <div className="flex items-center justify-center gap-1.5 mt-2">
                  {[1, 2, 3].map((i) => (
                    <Star
                      key={i}
                      className={`h-6 w-6 ${i <= result.stars ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/40 fill-none'}`}
                    />
                  ))}
                  <span className="ml-2 text-sm font-bold text-muted-foreground">
                    {result.stars > 0 ? `${result.stars}-Star${result.stars > 1 ? 's' : ''}` : 'Not cleared yet'}
                  </span>
                </div>
              </div>

              {cleared && (
                <div className="rounded-2xl bg-emerald-500/5 border border-emerald-500/30 p-4 space-y-2">
                  {earnedBadges.length > 0 ? (
                    earnedBadges.map((badge) => (
                      <div key={badge.id} className="flex items-center justify-center gap-2 text-emerald-600 font-bold">
                        <span className="text-lg">{badge.emoji}</span>
                        Badge Unlocked: {badge.title}
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center justify-center gap-2 text-emerald-600 font-bold">
                      <Trophy className="h-4 w-4" />
                      {result.alreadyClaimed ? 'Session already counted' : 'Level already mastered'}
                    </div>
                  )}
                  <div className="flex items-center justify-center gap-2 text-sm font-semibold text-foreground/80">
                    <Zap className="h-4 w-4 text-amber-500" />
                    {result.xpEarned > 0 ? `+${result.xpEarned} XP earned` : 'No new XP — beat your best score for more'}
                  </div>
                </div>
              )}

              {result.alreadyClaimed && (
                <p className="text-xs text-muted-foreground">
                  This recording was already counted towards your progress. Replays only award XP for improvement.
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Button className="w-full bg-brand-green hover:bg-brand-green/90 text-white font-bold" onClick={onPlayAgain}>
                Play Again
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={onNextLevel}
                disabled={!cleared || isFinalLevel}
              >
                {isFinalLevel ? 'Quest Complete 🏆' : cleared ? 'Next Level' : 'Clear this level to continue'}
              </Button>
              <Button variant="ghost" className="w-full" onClick={onClose}>
                Close
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
