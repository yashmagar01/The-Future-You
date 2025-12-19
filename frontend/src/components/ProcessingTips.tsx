import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, Mic, User, Brain, Quote, ArrowRight } from 'lucide-react';
import { communicationTips, getRandomTip, CommunicationTip } from '@/data/communicationTips';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const ProcessingTips = () => {
  const [currentTip, setCurrentTip] = useState<CommunicationTip>(communicationTips[0]);
  const [autoRotate, setAutoRotate] = useState(true);

  // Initial random tip
  useEffect(() => {
    setCurrentTip(getRandomTip());
  }, []);

  // Auto-rotate logic
  useEffect(() => {
    if (!autoRotate) return;

    const interval = setInterval(() => {
      setCurrentTip(getRandomTip());
    }, 8000); // 8 seconds per tip

    return () => clearInterval(interval);
  }, [autoRotate]);

  const handleNextTip = () => {
    setAutoRotate(false); // Pause auto-rotate if user interacts
    setCurrentTip(getRandomTip());
    // Resume auto-rotate after 10 seconds of inactivity
    setTimeout(() => setAutoRotate(true), 10000);
  };

  const getIcon = (category: string) => {
    switch (category) {
      case 'Body Language': return <User className="h-5 w-5 text-blue-500" />;
      case 'Vocal Delivery': return <Mic className="h-5 w-5 text-rose-500" />;
      case 'Confidence': return <Brain className="h-5 w-5 text-amber-500" />;
      case 'Interview Skills': return <Lightbulb className="h-5 w-5 text-emerald-500" />;
      case 'Storytelling': return <Quote className="h-5 w-5 text-purple-500" />;
      default: return <Lightbulb className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto mb-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 md:p-8 shadow-sm relative overflow-hidden"
      >
        {/* Ambient background glow */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-brand-green/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 bg-muted/50 px-2 py-1 rounded-md">
                Expert Tip
              </span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleNextTip}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors -mr-2"
            >
              Next Tip <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </div>

          <div className="min-h-[120px] flex flex-col justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTip.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="space-y-4"
              >
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "mt-1 p-2 rounded-lg bg-secondary/50 shrink-0",
                    "ring-1 ring-inset ring-black/5 dark:ring-white/5"
                  )}>
                    {getIcon(currentTip.category)}
                  </div>
                  <div className="space-y-2">
                    <p className="text-lg md:text-xl font-medium leading-relaxed text-foreground/90">
                      "{currentTip.text}"
                    </p>
                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-brand-green" />
                      {currentTip.category}
                    </p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
