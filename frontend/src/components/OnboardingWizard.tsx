import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { 
    ChevronRight, ChevronLeft, Check, Sparkles, Mic, 
    MessageSquare, AlertCircle, Zap, Ghost, Vault, Database,
    Target, Brain, Users, PenTool
} from 'lucide-react';
import { cn } from "@/lib/utils";

interface OnboardingData {
    fullName: string;
    // Core Branching
    userTier: 'standard' | 'beta' | null;
    
    // Standard Path
    userContext: string;
    painPoint: string;
    confidenceLevel: number;
    
    // Beta Path
    betaConsent: boolean;
    timeline: string;
    accent: string;
    deepStruggle: string;

    // Legacy / Defaults
    experienceLevel: string;
    primaryGoal: string;
    targetAudience: string; // Kept for type safety, though unused in new Standard flow
    reflectionStyle: 'voice' | 'text' | 'both';
    focusAreas: string[];
    reflectionFrequency: string;
    notificationsEnabled: boolean;
}

export function OnboardingWizard({ onComplete }: { onComplete: () => void }) {
    const [currentStep, setCurrentStep] = useState(0);
    const [direction, setDirection] = useState(0);
    const [data, setData] = useState<OnboardingData>({
        fullName: '',
        userTier: null,
        
        // Standard defaults
        userContext: '',
        painPoint: '',
        confidenceLevel: 5,
        
        // Beta defaults
        betaConsent: false,
        timeline: '',
        accent: '',
        deepStruggle: '',

        // Legacy defaults (kept for type safety but unused in new flow)
        experienceLevel: 'intermediate',
        primaryGoal: 'growth',
        targetAudience: '',
        reflectionStyle: 'both',
        focusAreas: [],
        reflectionFrequency: 'daily',
        notificationsEnabled: true,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    // Dynamic Steps Configuration
    const getSteps = () => {
        const commonSteps = [
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
                id: 'fork',
                title: 'How do you want to practice?',
                subtitle: 'Choose the path that fits your goals.',
                icon: Target,
            }
        ];

        // Path A: Standard (Ghost Mode)
        if (data.userTier === 'standard') {
            return [
                ...commonSteps,
                {
                    id: 'context',
                    title: 'What is your main focus?',
                    subtitle: 'This helps us generate relevant practice scripts.',
                    icon: MessageSquare,
                },
                {
                    id: 'audience',
                    title: 'Who are you speaking to?',
                    subtitle: 'Tailor the experience to your audience.',
                    icon: Users,
                },
                {
                    id: 'pain_point',
                    title: 'What is your struggle?',
                    subtitle: 'We will help you overcome this specific challenge.',
                    icon: AlertCircle,
                },
                {
                    id: 'confidence',
                    title: 'How confident do you feel?',
                    subtitle: 'Be honest. This is your baseline.',
                    icon: Zap,
                }
            ];
        }

        // Path B: Beta (Vault Mode)
        if (data.userTier === 'beta') {
            return [
                ...commonSteps,
                {
                    id: 'consent',
                    title: 'The Inner Circle Agreement',
                    subtitle: 'To build the world\'s best AI coach, we need real data.',
                    icon: Database,
                },
                {
                    id: 'deep_struggle',
                    title: 'In your own words...',
                    subtitle: 'Describe the specific moment you lose confidence.',
                    icon: PenTool,
                },
                {
                    id: 'accent',
                    title: 'Help us understand your voice.',
                    subtitle: 'Essential for tweaking our AI model accuracy.',
                    icon: Mic,
                },
                {
                    id: 'timeline',
                    title: 'When is your big moment?',
                    subtitle: 'Helps us understand the urgency of your practice.',
                    icon: Target,
                },
                {
                    id: 'confidence',
                    title: 'How confident do you feel?',
                    subtitle: 'Be honest. This is your baseline.',
                    icon: Zap,
                }
            ];
        }

        return commonSteps;
    };

    const steps = getSteps();

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
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

            // Prepare the JSONB object based on tier
            const onboardingPayload: any = {
                tier: data.userTier,
                completed_at: new Date().toISOString(),
                confidence_level: data.confidenceLevel, // Shared closing step
                // Legacy fields
                experience_level: data.experienceLevel,
                primary_goal: data.primaryGoal,
                reflection_style: data.reflectionStyle,
            };

            if (data.userTier === 'standard') {
                onboardingPayload.user_context = data.userContext;
                onboardingPayload.target_audience = data.targetAudience;
                onboardingPayload.pain_point = data.painPoint;
            } else if (data.userTier === 'beta') {
                onboardingPayload.data_consent = data.betaConsent;
                onboardingPayload.timeline = data.timeline;
                onboardingPayload.accent = data.accent;
                onboardingPayload.deep_struggle = data.deepStruggle;
                
                // MAPPING FOR SERVER.JS COMPATIBILITY
                // 1. Map 'deep_struggle' to 'pain_point'
                onboardingPayload.pain_point = data.deepStruggle;
                
                // 2. Map 'accent' to 'user_context' (or append)
                // Since Beta doesn't ask for context, we infer it.
                onboardingPayload.user_context = `General Practice (Accent: ${data.accent})`;
                
                // 3. Default 'target_audience'
                onboardingPayload.target_audience = "my audience";
            }

            // Use upsert to ensure profile exists
            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id: session.user.id,
                    email: session.user.email || '',
                    full_name: data.fullName,
                    onboarding_data: onboardingPayload,
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
        const stepId = steps[currentStep].id;

        switch (stepId) {
            case 'intro':
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
            case 'name':
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
            case 'fork':
                return (
                    <div className="grid gap-4 pt-2">
                        <div 
                            onClick={() => setData({ ...data, userTier: 'standard' })}
                            className={cn(
                                "cursor-pointer relative overflow-hidden rounded-xl border-2 p-6 transition-all hover:bg-accent/5",
                                data.userTier === 'standard' 
                                    ? "border-primary bg-primary/5" 
                                    : "border-muted bg-card hover:border-primary/50"
                            )}
                        >
                            <div className="flex items-start gap-4">
                                <div className={cn(
                                    "p-3 rounded-lg",
                                    data.userTier === 'standard' ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                                )}>
                                    <Ghost className="w-6 h-6" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-semibold text-lg">Ghost Mode (Standard)</h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        Analyze and vanish. Your video is deleted immediately after processing. Perfect for quick checks.
                                    </p>
                                </div>
                                {data.userTier === 'standard' && (
                                    <div className="absolute top-4 right-4">
                                        <Check className="w-5 h-5 text-primary" />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div 
                            onClick={() => setData({ ...data, userTier: 'beta' })}
                            className={cn(
                                "cursor-pointer relative overflow-hidden rounded-xl border-2 p-6 transition-all hover:bg-accent/5",
                                data.userTier === 'beta' 
                                    ? "border-primary bg-primary/5" 
                                    : "border-muted bg-card hover:border-primary/50"
                            )}
                        >
                            <div className="flex items-start gap-4">
                                <div className={cn(
                                    "p-3 rounded-lg",
                                    data.userTier === 'beta' ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                                )}>
                                    <Vault className="w-6 h-6" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-semibold text-lg">Vault Mode (Beta)</h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        Join the Committee. We save your audio to track progress. You help train our AI.
                                    </p>
                                </div>
                                {data.userTier === 'beta' && (
                                    <div className="absolute top-4 right-4">
                                        <Check className="w-5 h-5 text-primary" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            
            // Standard Path Steps
            case 'context':
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
            case 'audience':
                return (
                    <div className="space-y-6 py-2">
                        <div className="space-y-4">
                            <Label htmlFor="targetAudience" className="text-lg font-medium">Who are you speaking to?</Label>
                            <Input
                                id="targetAudience"
                                placeholder="e.g. My Boss, Investors, A large crowd..."
                                value={data.targetAudience}
                                onChange={(e) => setData({ ...data, targetAudience: e.target.value })}
                                className="h-14 text-lg px-6 bg-background/50 border-primary/20 focus:border-primary transition-all"
                                autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && data.targetAudience && handleNext()}
                            />
                        </div>
                    </div>
                );
            case 'pain_point':
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
            
            // Beta Path Steps
            case 'consent':
                return (
                    <div className="space-y-6 py-4">
                        <div className="p-6 rounded-xl bg-primary/5 border border-primary/10 space-y-4">
                            <div className="flex items-start gap-3">
                                <Database className="w-6 h-6 text-primary mt-1" />
                                <div className="space-y-1">
                                    <h4 className="font-medium text-foreground">Data Usage Policy</h4>
                                    <p className="text-sm text-muted-foreground">
                                        Your voice data will be anonymized and used solely for training our AI models to improve accuracy for accents and speech patterns. We will never sell your data.
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex items-center space-x-3 p-4 rounded-lg border border-input hover:bg-accent/5 transition-colors">
                            <Checkbox 
                                id="consent" 
                                checked={data.betaConsent}
                                onCheckedChange={(checked) => setData({ ...data, betaConsent: checked as boolean })}
                            />
                            <Label 
                                htmlFor="consent" 
                                className="text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                                I agree to let Yash AI use my anonymized voice data for training models.
                            </Label>
                        </div>
                    </div>
                );
            case 'deep_struggle':
                return (
                    <div className="space-y-6 py-2">
                        <div className="space-y-4">
                            <Label htmlFor="deepStruggle" className="text-lg font-medium">Describe the moment you lose confidence</Label>
                            <Textarea
                                id="deepStruggle"
                                placeholder="I freeze when people look at me..."
                                value={data.deepStruggle}
                                onChange={(e) => setData({ ...data, deepStruggle: e.target.value })}
                                className="min-h-[150px] text-lg p-4 bg-background/50 border-primary/20 focus:border-primary transition-all resize-none"
                                autoFocus
                            />
                        </div>
                    </div>
                );
            case 'accent':
                return (
                    <div className="space-y-6 py-2">
                        <div className="space-y-4">
                            <Label htmlFor="accent" className="text-lg font-medium">Primary Language / Accent</Label>
                            <Input
                                id="accent"
                                placeholder="e.g. Indian English, Hindi, US English..."
                                value={data.accent}
                                onChange={(e) => setData({ ...data, accent: e.target.value })}
                                className="h-14 text-lg px-6 bg-background/50 border-primary/20 focus:border-primary transition-all"
                                autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && data.accent && handleNext()}
                            />
                            <p className="text-sm text-muted-foreground">
                                Being specific helps us select the right speech recognition model for you.
                            </p>
                        </div>
                    </div>
                );
            case 'timeline':
                return (
                    <RadioGroup
                        value={data.timeline}
                        onValueChange={(val) => setData({ ...data, timeline: val })}
                        className="grid gap-3 pt-2"
                    >
                        {[
                            { value: 'urgent', label: "This week (Urgent)" },
                            { value: 'preparation', label: "In 1 month (Preparation)" },
                            { value: 'continuous', label: "No specific date (Continuous Growth)" },
                        ].map((option) => (
                            <Label
                                key={option.value}
                                className={cn(
                                    "flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all hover:bg-accent/5",
                                    data.timeline === option.value
                                        ? "border-primary bg-primary/5"
                                        : "border-muted bg-card hover:border-primary/50"
                                )}
                            >
                                <RadioGroupItem value={option.value} className="sr-only" />
                                <div className="font-medium text-base ml-2">{option.label}</div>
                                {data.timeline === option.value && (
                                    <Check className="w-5 h-5 text-primary ml-auto" />
                                )}
                            </Label>
                        ))}
                    </RadioGroup>
                );

            // Shared Closing Step
            case 'confidence':
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
        const stepId = steps[currentStep].id;
        switch (stepId) {
            case 'intro': return true;
            case 'name': return data.fullName.trim().length > 0;
            case 'fork': return !!data.userTier;
            
            // Standard
            case 'context': return !!data.userContext;
            case 'audience': return data.targetAudience.trim().length > 0;
            case 'pain_point': return !!data.painPoint;
            
            // Beta
            case 'consent': return data.betaConsent;
            case 'deep_struggle': return data.deepStruggle.trim().length > 0;
            case 'accent': return data.accent.trim().length > 0;
            case 'timeline': return !!data.timeline;
            
            // Shared
            case 'confidence': return true;
            
            default: return false;
        }
    };

    return (
        <div className="w-full max-w-xl mx-auto">
            {/* Progress Bar */}
            <div className="mb-8">
                <div className="flex justify-between text-sm font-medium text-muted-foreground mb-2">
                    <span>Step {currentStep + 1} of {steps.length}</span>
                    <span>{Math.round(((currentStep + 1) / steps.length) * 100)}%</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-primary"
                        initial={{ width: 0 }}
                        animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
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
                            key={steps[currentStep].title}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600 mb-2"
                        >
                            {steps[currentStep].title}
                        </motion.h2>
                        <motion.p 
                            key={steps[currentStep].subtitle}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="text-muted-foreground"
                        >
                            {steps[currentStep].subtitle}
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
                            ) : currentStep === steps.length - 1 ? (
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
