import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { ChevronRight, ChevronLeft, Check, Sparkles, Mic, PenTool, Brain, Target, Zap, Users, MessageSquare, AlertCircle } from 'lucide-react';
import { cn } from "@/lib/utils";

interface OnboardingData {
    fullName: string;
    experienceLevel: string;
    primaryGoal: string;
    // New Fields
    userContext: string;
    targetAudience: string;
    painPoint: string;
    confidenceLevel: number;
    // Legacy fields (kept for type safety but unused)
    reflectionStyle: 'voice' | 'text' | 'both';
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
        id: 'context',
        title: 'What is your main focus right now?',
        subtitle: 'This helps us generate relevant practice scripts.',
        icon: MessageSquare,
    },
    {
        id: 'audience',
        title: 'Who are you usually speaking to?',
        subtitle: 'Tailor your practice to your real-world audience.',
        icon: Users,
    },
    {
        id: 'pain_point',
        title: 'What is your biggest struggle?',
        subtitle: 'We will help you overcome this specific challenge.',
        icon: AlertCircle,
    },
    {
        id: 'confidence',
        title: 'How confident do you feel speaking?',
        subtitle: 'Be honest. This is your baseline.',
        icon: Zap,
    }
];

export function OnboardingWizard({ onComplete }: { onComplete: () => void }) {
    const [currentStep, setCurrentStep] = useState(0);
    const [direction, setDirection] = useState(0);
    const [data, setData] = useState<OnboardingData>({
        fullName: '',
        experienceLevel: 'intermediate', // Default
        primaryGoal: 'growth', // Default
        userContext: '',
        targetAudience: '',
        painPoint: '',
        confidenceLevel: 5,
        // Legacy defaults
        reflectionStyle: 'both',
        focusAreas: [],
        reflectionFrequency: 'daily',
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

            // Use upsert to ensure profile exists
            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id: session.user.id,
                    email: session.user.email || '',
                    full_name: data.fullName,
                    onboarding_data: {
                        // New Fields
                        user_context: data.userContext,
                        target_audience: data.targetAudience,
                        pain_point: data.painPoint,
                        confidence_level: data.confidenceLevel,
                        // Legacy Mappings (for backward compatibility if needed)
                        experience_level: data.experienceLevel,
                        primary_goal: data.primaryGoal,
                        reflection_style: data.reflectionStyle,
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
            case 2: // User Context
                return (
                    <RadioGroup
                        value={data.userContext}
                        onValueChange={(val) => setData({ ...data, userContext: val })}
                        className="grid gap-3 pt-2"
                    >
                        {[
                            { value: 'Job Interview', label: "Job Interview Prep", icon: Target },
                            { value: 'Public Speaking', label: "Public Speaking / Presentation", icon: Mic },
                            { value: 'Difficult Conversation', label: "Difficult Conversation", icon: MessageSquare },
                            { value: 'Personal Growth', label: "General Personal Growth", icon: Brain },
                        ].map((option) => (
                            <Label
                                key={option.value}
                                className={cn(
                                    "flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all hover:bg-accent/5",
                                    data.userContext === option.value
                                        ? "border-primary bg-primary/5"
                                        : "border-muted bg-card hover:border-primary/50"
                                )}
                            >
                                <RadioGroupItem value={option.value} className="sr-only" />
                                <div className={cn(
                                    "p-2 rounded-lg",
                                    data.userContext === option.value ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                                )}>
                                    <option.icon className="w-5 h-5" />
                                </div>
                                <div className="font-medium text-base">{option.label}</div>
                                {data.userContext === option.value && (
                                    <Check className="w-5 h-5 text-primary ml-auto" />
                                )}
                            </Label>
                        ))}
                    </RadioGroup>
                );
            case 3: // Target Audience
                return (
                    <RadioGroup
                        value={data.targetAudience}
                        onValueChange={(val) => setData({ ...data, targetAudience: val })}
                        className="grid gap-3 pt-2"
                    >
                        {[
                            { value: 'Hiring Manager', label: "Hiring Manager / Recruiter" },
                            { value: 'My Team', label: "My Team / Colleagues" },
                            { value: 'Large Audience', label: "Large Audience (Stage)" },
                            { value: 'Myself', label: "Just Myself (Journaling)" },
                        ].map((option) => (
                            <Label
                                key={option.value}
                                className={cn(
                                    "flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all hover:bg-accent/5",
                                    data.targetAudience === option.value
                                        ? "border-primary bg-primary/5"
                                        : "border-muted bg-card hover:border-primary/50"
                                )}
                            >
                                <RadioGroupItem value={option.value} className="sr-only" />
                                <div className="font-medium text-base ml-2">{option.label}</div>
                                {data.targetAudience === option.value && (
                                    <Check className="w-5 h-5 text-primary ml-auto" />
                                )}
                            </Label>
                        ))}
                    </RadioGroup>
                );
            case 4: // Pain Point
                return (
                    <RadioGroup
                        value={data.painPoint}
                        onValueChange={(val) => setData({ ...data, painPoint: val })}
                        className="grid gap-3 pt-2"
                    >
                        {[
                            { value: 'rambling', label: "I tend to ramble" },
                            { value: 'filler words', label: "I use too many filler words" },
                            { value: 'nervousness', label: "I get nervous and freeze up" },
                            { value: 'monotone', label: "My voice sounds flat/monotone" },
                        ].map((option) => (
                            <Label
                                key={option.value}
                                className={cn(
                                    "flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all hover:bg-accent/5",
                                    data.painPoint === option.value
                                        ? "border-primary bg-primary/5"
                                        : "border-muted bg-card hover:border-primary/50"
                                )}
                            >
                                <RadioGroupItem value={option.value} className="sr-only" />
                                <div className="font-medium text-base ml-2">{option.label}</div>
                                {data.painPoint === option.value && (
                                    <Check className="w-5 h-5 text-primary ml-auto" />
                                )}
                            </Label>
                        ))}
                    </RadioGroup>
                );
            case 5: // Confidence Level
                return (
                    <div className="space-y-8 py-4 px-2">
                        <div className="text-center space-y-2">
                            <div className="text-6xl font-bold text-primary">{data.confidenceLevel}</div>
                            <p className="text-muted-foreground">
                                {data.confidenceLevel <= 3 ? "I feel very anxious" : 
                                 data.confidenceLevel <= 6 ? "I'm somewhat comfortable" : 
                                 data.confidenceLevel <= 8 ? "I feel pretty good" : "I'm unstoppable"}
                            </p>
                        </div>
                        
                        <Slider
                            value={[data.confidenceLevel]}
                            onValueChange={(val) => setData({ ...data, confidenceLevel: val[0] })}
                            max={10}
                            min={1}
                            step={1}
                            className="py-4"
                        />
                        
                        <div className="flex justify-between text-xs text-muted-foreground px-1">
                            <span>Terrified (1)</span>
                            <span>Confident (10)</span>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    const isStepValid = () => {
        switch (currentStep) {
            case 0: return true;
            case 1: return data.fullName.trim().length > 0;
            case 2: return !!data.userContext;
            case 3: return !!data.targetAudience;
            case 4: return !!data.painPoint;
            case 5: return true; // Slider always has a value
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
