import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { supabase, supabaseUrl } from '@/integrations/supabase/client';

interface OnboardingData {
    fullName: string;
    experienceLevel: string;
    primaryGoal: string;
    reflectionFrequency: string;
    notificationsEnabled: boolean;
}

const STEPS = [
    {
        id: 'intro',
        title: 'Welcome to The Future You',
        description: "Let's get to know you better to personalize your experience.",
    },
    {
        id: 'name',
        title: 'What should we call you?',
        description: 'Your name will be used to personalize your reflections.',
    },
    {
        id: 'experience',
        title: 'Have you practiced self-reflection before?',
        description: 'This helps us tailor the guidance level.',
    },
    {
        id: 'goals',
        title: 'What is your primary goal?',
        description: 'Choose the one that resonates most with you right now.',
    },
    {
        id: 'frequency',
        title: 'How often do you want to reflect?',
        description: 'Consistency is key to seeing results.',
    }
];

export function OnboardingWizard({ onComplete }: { onComplete: () => void }) {
    const [currentStep, setCurrentStep] = useState(0);
    const [data, setData] = useState<OnboardingData>({
        fullName: '',
        experienceLevel: '',
        primaryGoal: '',
        reflectionFrequency: '',
        notificationsEnabled: true,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const handleNext = () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            handleSubmit();
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
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

            const response = await fetch(`${supabaseUrl}/functions/v1/onboard`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({
                    full_name: data.fullName,
                    onboarding_data: {
                        experience_level: data.experienceLevel,
                        primary_goal: data.primaryGoal,
                        reflection_frequency: data.reflectionFrequency,
                        notifications_enabled: data.notificationsEnabled
                    }
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to save onboarding data');
            }

            toast({
                title: "Onboarding Complete!",
                description: "Your profile has been set up.",
            });

            onComplete();

        } catch (error: any) {
            console.error('Onboarding error:', error);
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Something went wrong.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 0: // Intro
                return (
                    <div className="space-y-4">
                        <p className="text-muted-foreground">
                            We're excited to help you on your journey of self-discovery. This quick setup will take less than a minute.
                        </p>
                    </div>
                );
            case 1: // Name
                return (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="fullName">Full Name</Label>
                            <Input
                                id="fullName"
                                placeholder="Enter your name"
                                value={data.fullName}
                                onChange={(e) => setData({ ...data, fullName: e.target.value })}
                            />
                        </div>
                    </div>
                );
            case 2: // Experience
                return (
                    <RadioGroup
                        value={data.experienceLevel}
                        onValueChange={(val) => setData({ ...data, experienceLevel: val })}
                        className="space-y-3"
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="beginner" id="exp-beginner" />
                            <Label htmlFor="exp-beginner">I'm new to this</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="intermediate" id="exp-intermediate" />
                            <Label htmlFor="exp-intermediate">I reflect occasionally</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="advanced" id="exp-advanced" />
                            <Label htmlFor="exp-advanced">It's a regular habit</Label>
                        </div>
                    </RadioGroup>
                );
            case 3: // Goals
                return (
                    <RadioGroup
                        value={data.primaryGoal}
                        onValueChange={(val) => setData({ ...data, primaryGoal: val })}
                        className="space-y-3"
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="clarity" id="goal-clarity" />
                            <Label htmlFor="goal-clarity">Gain mental clarity</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="growth" id="goal-growth" />
                            <Label htmlFor="goal-growth">Track personal growth</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="decisions" id="goal-decisions" />
                            <Label htmlFor="goal-decisions">Make better decisions</Label>
                        </div>
                    </RadioGroup>
                );
            case 4: // Frequency
                return (
                    <RadioGroup
                        value={data.reflectionFrequency}
                        onValueChange={(val) => setData({ ...data, reflectionFrequency: val })}
                        className="space-y-3"
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="daily" id="freq-daily" />
                            <Label htmlFor="freq-daily">Daily</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="weekly" id="freq-weekly" />
                            <Label htmlFor="freq-weekly">Weekly</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="monthly" id="freq-monthly" />
                            <Label htmlFor="freq-monthly">Monthly</Label>
                        </div>
                    </RadioGroup>
                );
            default:
                return null;
        }
    };

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader>
                <CardTitle>{STEPS[currentStep].title}</CardTitle>
                <CardDescription>{STEPS[currentStep].description}</CardDescription>
            </CardHeader>
            <CardContent>
                {renderStepContent()}
            </CardContent>
            <CardFooter className="flex justify-between">
                <Button
                    variant="outline"
                    onClick={handleBack}
                    disabled={currentStep === 0 || isSubmitting}
                >
                    Back
                </Button>
                <Button onClick={handleNext} disabled={isSubmitting}>
                    {currentStep === STEPS.length - 1 ? (isSubmitting ? 'Saving...' : 'Finish') : 'Next'}
                </Button>
            </CardFooter>
        </Card>
    );
}
