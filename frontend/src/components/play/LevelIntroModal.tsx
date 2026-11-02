import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play } from 'lucide-react';
import type { PlayLevel } from '@/data/playLevels';

interface LevelIntroModalProps {
  level: PlayLevel | null;
  open: boolean;
  onClose: () => void;
  onStart: (level: PlayLevel) => void;
}

export function LevelIntroModal({ level, open, onClose, onStart }: LevelIntroModalProps) {
  return (
    <Dialog open={open && !!level} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        {level && (
          <>
            <DialogHeader className="text-center sm:text-center">
              <div className="mx-auto w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-4xl">
                {level.emoji}
              </div>
              <DialogTitle className="text-2xl">
                Level {level.level}: {level.title}
              </DialogTitle>
              <DialogDescription className="text-center">{level.tagline}</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="rounded-2xl bg-muted/50 border p-4">
                <p className="text-sm font-semibold text-foreground/90">Your mission:</p>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{level.prompt}</p>
              </div>

              <div className="flex flex-wrap gap-2 justify-center">
                <Badge variant="outline">{level.category}</Badge>
                <Badge variant="outline">Difficulty {level.difficulty}/10</Badge>
                <Badge variant="outline">~{Math.max(1, Math.round(level.durationTargetSec / 60))} min</Badge>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 text-center">
                  Focus areas
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {level.focusMetrics.map((m) => (
                    <span
                      key={m}
                      className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-accent/10 text-accent capitalize"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                className="w-full bg-brand-green hover:bg-brand-green/90 text-white font-bold"
                onClick={() => onStart(level)}
              >
                <Play className="h-4 w-4 mr-2" /> Start Level {level.level}
              </Button>
              <Button variant="outline" className="w-full" onClick={onClose}>
                Back to Path
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
