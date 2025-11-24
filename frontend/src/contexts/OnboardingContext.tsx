import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface OnboardingContextType {
  showTour: boolean;
  currentStep: number;
  totalSteps: number;
  nextStep: () => void;
  previousStep: () => void;
  skipTour: () => void;
  completeTour: () => void;
  resetTour: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return context;
};

interface OnboardingProviderProps {
  children: ReactNode;
}

export const OnboardingProvider = ({ children }: OnboardingProviderProps) => {
  const [showTour, setShowTour] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const totalSteps = 5; // Dashboard overview, Record, Gallery, Stats, Complete

  useEffect(() => {
    // Check if user has completed onboarding
    const hasCompletedOnboarding = localStorage.getItem('onboarding_completed');
    const isFirstVisit = !hasCompletedOnboarding;
    
    if (isFirstVisit) {
      // Delay showing tour slightly for better UX
      const timer = setTimeout(() => {
        setShowTour(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const nextStep = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      completeTour();
    }
  };

  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const skipTour = () => {
    setShowTour(false);
    localStorage.setItem('onboarding_completed', 'true');
    localStorage.setItem('onboarding_skipped', 'true');
  };

  const completeTour = () => {
    setShowTour(false);
    localStorage.setItem('onboarding_completed', 'true');
    setCurrentStep(0);
  };

  const resetTour = () => {
    localStorage.removeItem('onboarding_completed');
    localStorage.removeItem('onboarding_skipped');
    setCurrentStep(0);
    setShowTour(true);
  };

  return (
    <OnboardingContext.Provider
      value={{
        showTour,
        currentStep,
        totalSteps,
        nextStep,
        previousStep,
        skipTour,
        completeTour,
        resetTour,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};
