import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb } from 'lucide-react';
import { communicationTips } from '../data/communicationTips';
import { getRandomTip, CommunicationTip } from '@/data/communicationTips';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const ProcessingTips = () => {
  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  // Auto-cycle tips every 6 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % communicationTips.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const currentTip = communicationTips[currentTipIndex];

  return (
    <div className="w-full max-w-lg mx-auto py-2 text-center">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentTip.id}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-center gap-2 text-muted-foreground"
        >
          <Lightbulb className="w-4 h-4 text-yellow-500/80 shrink-0" />
          <p className="text-sm sm:text-base font-medium leading-normal">
            {currentTip.text}
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
