import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, RefreshCw, Copy, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Script {
    variations?: {
        short: string;
        medium: string;
        long: string;
    };
    short?: string;
    medium?: string;
    long?: string;
    meta?: any;
}

interface OnboardingData {
    script?: Script;
    [key: string]: any;
}

export function ScriptDisplay({ userId }: { userId: string }) {
    const [script, setScript] = useState<Script | null>(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [copied, setCopied] = useState(false);
    const { toast } = useToast();

    const [profileData, setProfileData] = useState<any>(null);

    useEffect(() => {
        fetchScript();
    }, [userId]);

    const fetchScript = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('profiles')
                .select('onboarding_data, full_name')
                .eq('id', userId)
                .single();

            if (error) throw error;

            const onboardingData = data?.onboarding_data as unknown as OnboardingData | null;
            
            // Default values
            let userContext = "improving my communication skills";
            let targetAudience = "my future self";
            let painPoint = "speaking with clarity";
            let confidenceLevel = 5;

            if (onboardingData) {
                confidenceLevel = onboardingData.confidence_level || 5;
                const tier = onboardingData.tier;

                if (tier === 'beta') {
                    // Beta Path Mapping
                    // 1. Map 'deep_struggle' to 'pain_point' if available, otherwise fallback to existing pain_point
                    painPoint = onboardingData.deep_struggle || onboardingData.pain_point || painPoint;
                    
                    // 2. Append accent to user_context if not already there
                    // If DB already has it normalized, this might be redundant but safe.
                    // We check if user_context is just the default or empty, then construct it.
                    if (onboardingData.accent) {
                        const baseContext = onboardingData.user_context || "General Practice";
                        if (!baseContext.includes(onboardingData.accent)) {
                            userContext = `${baseContext} (Accent: ${onboardingData.accent})`;
                        } else {
                            userContext = baseContext;
                        }
                    } else {
                        userContext = onboardingData.user_context || "General Practice";
                    }

                    // 3. Default target audience for Beta
                    targetAudience = onboardingData.target_audience || "my audience";

                } else {
                    // Standard / Legacy Path Mapping
                    userContext = onboardingData.user_context || onboardingData.primary_goal || userContext;
                    targetAudience = onboardingData.target_audience || targetAudience;
                    painPoint = onboardingData.pain_point || painPoint;
                }
            }

            // Merge full_name and new fields into the data we use
            const fullProfileData = {
                ...onboardingData,
                full_name: data.full_name,
                user_context: userContext,
                target_audience: targetAudience,
                pain_point: painPoint,
                confidence_level: confidenceLevel
            };
            
            setProfileData(fullProfileData);

            if (onboardingData?.script) {
                console.log("ScriptDisplay: Found existing script:", onboardingData.script);
                setScript(onboardingData.script);
            } else {
                console.log("ScriptDisplay: No script found, generating...");
                // No script found, generate one
                generateScript(fullProfileData);
            }
        } catch (error) {
            console.error('Error fetching script:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRegenerate = () => {
        if (profileData) {
            generateScript(profileData);
        } else {
            fetchScript();
        }
    };

    const generateScript = async (profileData: any) => {
        if (!profileData) return;
        
        try {
            setGenerating(true);
            
            console.log("ScriptDisplay: Calling local backend /generate-script with data:", profileData);

            // Determine backend URL from env (useful for Vercel deploy). Falls back to localhost for dev.
            const API_BASE = import.meta.env.VITE_LOCAL_PROCESSOR_URL || 'http://localhost:3001';

            // Call backend generate endpoint
            const response = await fetch(`${API_BASE.replace(/\/$/, '')}/generate-script`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ profileData }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Backend error: ${response.status} ${errorText}`);
            }

            const newScript = await response.json();

            
            console.log("ScriptDisplay: Generated AI script");
            
            setScript(newScript);

            // Save to profile - remove old script first to avoid overwriting
            const { script: oldScript, ...profileDataWithoutScript } = profileData || {};
            const updatedOnboardingData = {
                ...profileDataWithoutScript,
                script: newScript
            };

            console.log("ScriptDisplay: Saving to database:", updatedOnboardingData);

            const { error } = await supabase
                .from('profiles')
                .update({
                    onboarding_data: updatedOnboardingData
                })
                .eq('id', userId);

            if (error) {
                console.error('Error saving script:', error);
            } else {
                console.log('ScriptDisplay: Successfully saved to database');
                // Update local state with the new data
                setProfileData(updatedOnboardingData);
            }

            toast({
                title: "Script Generated!",
                description: "Your personalized script is ready.",
            });

        } catch (error) {
            console.error('Error generating script:', error);
            toast({
                title: "Generation Failed",
                description: error instanceof Error ? error.message : "Could not generate script.",
                variant: "destructive"
            });
        } finally {
            setGenerating(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast({
            title: "Copied!",
            description: "Script copied to clipboard.",
        });
    };

    if (loading) {
        return (
            <Card className="p-6 h-full flex items-center justify-center min-h-[300px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </Card>
        );
    }

    return (
        <Card className="h-full flex flex-col overflow-hidden bg-card/50 backdrop-blur-sm border-primary/10">
            <div className="p-4 border-b border-border/50 flex justify-between items-center bg-muted/30">
                <h3 className="font-semibold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    Your Script (Local Template)
                </h3>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleRegenerate} 
                    disabled={generating}
                    className="h-8 w-8 p-0"
                >
                    <RefreshCw className={`h-4 w-4 ${generating ? 'animate-spin' : ''}`} />
                </Button>
            </div>

            {script ? (
                <Tabs defaultValue="medium" className="flex-1 flex flex-col">
                    <div className="px-4 pt-4">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="short">Short (~1 min)</TabsTrigger>
                            <TabsTrigger value="medium">Medium (~3 min)</TabsTrigger>
                            <TabsTrigger value="long">Long (~5 min)</TabsTrigger>
                        </TabsList>
                    </div>

                    <div className="flex-1 overflow-hidden relative">
                        {['short', 'medium', 'long'].map((type) => {
                            // Check for nested variations or direct properties or capitalized properties
                            const content = 
                                script.variations?.[type as keyof typeof script.variations] || 
                                script[type as keyof Script] || 
                                script[type.charAt(0).toUpperCase() + type.slice(1) as keyof Script];
                            
                            // Ensure content is a string, not an object
                            const contentString = typeof content === 'string' ? content : null;
                            
                            return (
                                <TabsContent key={type} value={type} className="h-full m-0 p-0">
                                    <ScrollArea className="h-[400px] p-6">
                                        <div className="prose prose-sm dark:prose-invert max-w-none">
                                            {contentString ? (
                                                <div className="whitespace-pre-wrap font-medium leading-relaxed text-lg">
                                                    {contentString}
                                                </div>
                                            ) : (
                                                <div className="text-muted-foreground italic">
                                                    Content not found for {type}. 
                                                    <br/>
                                                    Raw data: <pre className="text-xs mt-2 p-2 bg-muted rounded">{JSON.stringify(script, null, 2)}</pre>
                                                </div>
                                            )}
                                        </div>
                                    </ScrollArea>
                                    {contentString && (
                                        <div className="absolute bottom-4 right-4">
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                className="shadow-lg backdrop-blur-md bg-background/80 hover:bg-background/90"
                                                onClick={() => copyToClipboard(contentString)}
                                            >
                                                {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                                                {copied ? 'Copied' : 'Copy Text'}
                                            </Button>
                                        </div>
                                    )}
                                </TabsContent>
                            );
                        })}
                    </div>
                </Tabs>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                    <p>No script generated yet.</p>
                    <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => fetchScript()}
                    >
                        Generate Script
                    </Button>
                </div>
            )}
        </Card>
    );
}
