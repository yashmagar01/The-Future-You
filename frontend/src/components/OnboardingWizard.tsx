import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { ChevronRight, ChevronLeft, Check, Sparkles, Mic, PenTool, Brain, Target, Zap } from 'lucide-react';
import { cn } from "@/lib/utils";

interface OnboardingData {
    fullName: string;
    reflectionStyle: 'voice' | 'text' | 'both';
    experienceLevel: string;
    primaryGoal: string;
    focusAreas: string[];
    reflectionFrequency: string;
    notificationsEnabled: boolean;
}

const STEPS = [
    {
        id: 'intro',
        title: 'Welcome to The Future You',
        subtitle: "Your journey to self-mastery begins here.",
        icon: Sparkles,
    },
    {
        id: 'name',
        title: 'What should we call you?',
        subtitle: 'Your name will be used to personalize your reflections.',
        icon: null,
    },
    {
        id: 'style',
        title: 'How do you prefer to reflect?',
        subtitle: 'Choose the medium that feels most natural to you.',
        icon: PenTool,
    },
    {
        id: 'experience',
        title: 'Have you practiced self-reflection before?',
        subtitle: 'This helps us tailor the guidance level.',
        icon: Brain,
    },
    {
        id: 'goals',
        title: 'What is your primary goal?',
        subtitle: 'Choose the one that resonates most with you right now.',
        icon: Target,
    },
    {
        id: 'frequency',
        title: 'How often do you want to reflect?',
        subtitle: 'Consistency is key to seeing results.',
        icon: Zap,
    }
];

export function OnboardingWizard({ onComplete }: { onComplete: () => void }) {
    const [currentStep, setCurrentStep] = useState(0);
    const [direction, setDirection] = useState(0);
    const [data, setData] = useState<OnboardingData>({
        fullName: '',
        reflectionStyle: 'both',
        experienceLevel: '',
        primaryGoal: '',
        focusAreas: [],
        reflectionFrequency: '',
        notificationsEnabled: true,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const handleNext = () => {
        if (currentStep < STEPS.length - 1) {
            setDirection(1);
            setCurrentStep(prev => prev + 1);
        } else {
            handleSubmit();
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setDirection(-1);
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                throw new Error("No active session");
            }

            // Use upsert to ensure profile exists (fixes loop if profile was missing)
            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id: session.user.id,
                    full_name: data.fullName,
                    onboarding_data: {
                        reflection_style: data.reflectionStyle,
                        experience_level: data.experienceLevel,
                        primary_goal: data.primaryGoal,
                        focus_areas: data.focusAreas,
                        reflection_frequency: data.reflectionFrequency,
                        notifications_enabled: data.notificationsEnabled,
                        completed_at: new Date().toISOString()
                    },
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;

            toast({
                title: "All set!",
                description: "Your profile has been created successfully.",
            });

            onComplete();

        } catch (error: any) {
            console.error('Onboarding error:', error);
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Failed to save profile.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 50 : -50,
            opacity: 0,
        }),
        center: {
            x: 0,
            opacity: 1,
        },
        exit: (direction: number) => ({
            x: direction < 0 ? 50 : -50,
            opacity: 0,
        }),
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 0: // Intro
                return (
                    <div className="text-center space-y-6 py-4">
                        <div className="relative w-24 h-24 mx-auto mb-6">
                            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
                            <div className="relative bg-gradient-to-br from-primary/10 to-accent/10 rounded-full p-6 border border-primary/20">
                                <Sparkles className="w-full h-full text-primary" />
                            </div>
                        </div>
                        <p className="text-lg text-muted-foreground leading-relaxed max-w-sm mx-auto">
                            We're excited to help you on your journey of self-discovery. 
                            This quick setup will help us personalize your AI companion.
                        </p>
                    </div>
                );
            case 1: // Name
                return (
                    <div className="space-y-6 py-2">
                        <div className="space-y-4">
                            <Label htmlFor="fullName" className="text-lg font-medium">Full Name</Label>
                            <Input
                                id="fullName"
                                placeholder="Type your name..."
                                value={data.fullName}
                                onChange={(e) => setData({ ...data, fullName: e.target.value })}
                                className="h-14 text-lg px-6 bg-background/50 border-primary/20 focus:border-primary transition-all"
                                autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && data.fullName && handleNext()}
                            />
                        </div>
                    </div>
                );
            case 2: // Style
                return (
                    <RadioGroup
                        value={data.reflectionStyle}
                        onValueChange={(val: any) => setData({ ...data, reflectionStyle: val })}
                        className="grid gap-4 pt-2"
                    >
                        {[
                            { value: 'voice', label: 'Voice Only', icon: Mic, desc: 'Talk through your thoughts' },
                            { value: 'text', label: 'Text Only', icon: PenTool, desc: 'Write it down' },
                            { value: 'both', label: 'Both', icon: Sparkles, desc: 'Flexibility to choose' },
                        ].map((option) => (
                            <Label
                                key={option.value}
                                className={cn(
                                    "flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all hover:bg-accent/5",
                                    data.reflectionStyle === option.value
                                        ? "border-primary bg-primary/5"
                                        : "border-muted bg-card hover:border-primary/50"
                                )}
                            >
                                <RadioGroupItem value={option.value} className="sr-only" />
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "p-2 rounded-lg",
                                        data.reflectionStyle === option.value ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                                    )}>
                                        <option.icon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="font-semibold text-base">{option.label}</div>
                                        <div className="text-sm text-muted-foreground">{option.desc}</div>
                                    </div>
                                </div>
                                {data.reflectionStyle === option.value && (
                                    <Check className="w-5 h-5 text-primary" />
                                )}
                            </Label>
                        ))}
                    </RadioGroup>
                );
            case 3: // Experience
                return (
                    <RadioGroup
                        value={data.experienceLevel}
                        onValueChange={(val) => setData({ ...data, experienceLevel: val })}
                        className="grid gap-3 pt-2"
                    >
                        {[
                            { value: 'beginner', label: "I'm new to this", desc: "Never reflected consistently" },
                            { value: 'intermediate', label: "I reflect occasionally", desc: "Once in a while" },
                            { value: 'advanced', label: "It's a regular habit", desc: "Daily or weekly practice" },
                        ].map((option) => (
                            <Label
                                key={option.value}
                                className={cn(
                                    "flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all hover:bg-accent/5",
                                    data.experienceLevel === option.value
                                        ? "border-primary bg-primary/5"
                                        : "border-muted bg-card hover:border-primary/50"
                                )}
                            >
                                <RadioGroupItem value={option.value} className="sr-only" />
                                <div className="flex-1">
                                    <div className="font-medium text-base">{option.label}</div>
                                    <div className="text-sm text-muted-foreground">{option.desc}</div>
                                </div>
                                {data.experienceLevel === option.value && (
                                    <Check className="w-5 h-5 text-primary" />
                                )}
                            </Label>
                        ))}
                    </RadioGroup>
                );
            case 4: // Goals
                return (
                    <RadioGroup
                        value={data.primaryGoal}
                        onValueChange={(val) => setData({ ...data, primaryGoal: val })}
                        className="grid gap-3 pt-2"
                    >
                        {[
                            { value: 'clarity', label: "Gain mental clarity", icon: Brain },
                            { value: 'growth', label: "Track personal growth", icon: Target },
                            { value: 'decisions', label: "Make better decisions", icon: Zap },
                        ].map((option) => (
                            <Label
                                key={option.value}
                                className={cn(
                                    "flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all hover:bg-accent/5",
                                    data.primaryGoal === option.value
                                        ? "border-primary bg-primary/5"
                                        : "border-muted bg-card hover:border-primary/50"
                                )}
                            >
                                <RadioGroupItem value={option.value} className="sr-only" />
                                <div className={cn(
                                    "p-2 rounded-lg",
                                    data.primaryGoal === option.value ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                                )}>
                                    <option.icon className="w-5 h-5" />
                                </div>
                                <div className="font-medium text-base">{option.label}</div>
                                {data.primaryGoal === option.value && (
                                    <Check className="w-5 h-5 text-primary ml-auto" />
                                )}
                            </Label>
                        ))}
                    </RadioGroup>
                );
            case 5: // Frequency
                return (
                    <RadioGroup
                        value={data.reflectionFrequency}
                        onValueChange={(val) => setData({ ...data, reflectionFrequency: val })}
                        className="grid grid-cols-3 gap-4 pt-4"
                    >
                        {[
                            { value: 'daily', label: "Daily" },
                            { value: 'weekly', label: "Weekly" },
                            { value: 'monthly', label: "Monthly" },
                        ].map((option) => (
                            <Label
                                key={option.value}
                                className={cn(
                                    "flex flex-col items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all hover:bg-accent/5 aspect-square text-center",
                                    data.reflectionFrequency === option.value
                                        ? "border-primary bg-primary/5"
                                        : "border-muted bg-card hover:border-primary/50"
                                )}
                            >
                                <RadioGroupItem value={option.value} className="sr-only" />
                                <div className="font-semibold text-lg mb-1">{option.label}</div>
                                {data.reflectionFrequency === option.value && (
                                    <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                                )}
                            </Label>
                        ))}
                    </RadioGroup>
                );
            default:
                return null;
        }
    };

    const isStepValid = () => {
        switch (currentStep) {
            case 0: return true;
            case 1: return data.fullName.trim().length > 0;
            case 2: return !!data.reflectionStyle;
            case 3: return !!data.experienceLevel;
            case 4: return !!data.primaryGoal;
            case 5: return !!data.reflectionFrequency;
            default: return false;
        }
    };

    return (
        <div className="w-full max-w-xl mx-auto">
            {/* Progress Bar */}
            <div className="mb-8">
                <div className="flex justify-between text-sm font-medium text-muted-foreground mb-2">
                    <span>Step {currentStep + 1} of {STEPS.length}</span>
                    <span>{Math.round(((currentStep + 1) / STEPS.length) * 100)}%</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-primary"
                        initial={{ width: 0 }}
                        animate={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                    />
                </div>
            </div>

            {/* Card */}
            <div className="relative bg-card/80 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-50" />
                
                <div className="p-8 min-h-[400px] flex flex-col">
                    <div className="mb-8 text-center">
                        <motion.h2 
                            key={STEPS[currentStep].title}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600 mb-2"
                        >
                            {STEPS[currentStep].title}
                        </motion.h2>
                        <motion.p 
                            key={STEPS[currentStep].subtitle}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="text-muted-foreground"
                        >
                            {STEPS[currentStep].subtitle}
                        </motion.p>
                    </div>

                    <div className="flex-1 relative">
                        <AnimatePresence mode="wait" custom={direction}>
                            <motion.div
                                key={currentStep}
                                custom={direction}
                                variants={variants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{
                                    x: { type: "spring", stiffness: 300, damping: 30 },
                                    opacity: { duration: 0.2 }
                                }}
                                className="w-full"
                            >
                                {renderStepContent()}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    <div className="flex justify-between items-center mt-8 pt-6 border-t border-border/50">
                        <Button
                            variant="ghost"
                            onClick={handleBack}
                            disabled={currentStep === 0 || isSubmitting}
                            className="hover:bg-primary/5"
                        >
                            <ChevronLeft className="w-4 h-4 mr-2" />
                            Back
                        </Button>
                        
                        <Button 
                            onClick={handleNext} 
                            disabled={!isStepValid() || isSubmitting}
                            className="min-w-[120px] bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white shadow-lg hover:shadow-primary/25 transition-all"
                        >
                            {isSubmitting ? (
                                <div className="flex items-center">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                                    Saving...
                                </div>
                            ) : currentStep === STEPS.length - 1 ? (
                                <div className="flex items-center">
                                    Get Started
                                    <Sparkles className="w-4 h-4 ml-2" />
                                </div>
                            ) : (
                                <div className="flex items-center">
                                    Next
                                    <ChevronRight className="w-4 h-4 ml-2" />
                                </div>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
