import { ReactNode } from 'react';
import { X, Check, ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { motion, AnimatePresence } from 'framer-motion';

interface TourStepProps {
  step: number;
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  highlightElement?: string; // CSS selector for element to highlight
}

export const TourTooltip = ({ step, title, description, position = 'center' }: TourStepProps) => {
  const { currentStep, totalSteps, nextStep, previousStep, skipTour, showTour } = useOnboarding();

  if (!showTour || currentStep !== step) return null;

  const progress = ((currentStep + 1) / totalSteps) * 100;

  const positionClasses = {
    top: 'top-20 left-1/2 -translate-x-1/2',
    bottom: 'bottom-20 left-1/2 -translate-x-1/2',
    left: 'left-20 top-1/2 -translate-y-1/2',
    right: 'right-20 top-1/2 -translate-y-1/2',
    center: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      >
        <Card className={`max-w-md mx-4 shadow-2xl border-primary/20 ${positionClasses[position]}`}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <CardTitle className="text-xl">{title}</CardTitle>
                <CardDescription className="mt-1">{description}</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={skipTour}
                className="h-8 w-8 shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            {/* Progress bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                <span>Step {currentStep + 1} of {totalSteps}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={skipTour}
                className="text-muted-foreground"
              >
                Skip Tour
              </Button>

              <div className="flex gap-2">
                {currentStep > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={previousStep}
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={nextStep}
                  className="bg-primary hover:bg-primary/90"
                >
                  {currentStep === totalSteps - 1 ? (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      Finish
                    </>
                  ) : (
                    <>
                      Next
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};
