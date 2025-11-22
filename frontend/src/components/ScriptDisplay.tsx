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
                .select('onboarding_data')
                .eq('id', userId)
                .single();

            if (error) throw error;

            setProfileData(data?.onboarding_data);

            if (data?.onboarding_data?.script) {
                console.log("ScriptDisplay: Found existing script:", data.onboarding_data.script);
                setScript(data.onboarding_data.script);
            } else {
                console.log("ScriptDisplay: No script found, generating...");
                // No script found, generate one
                generateScript(data?.onboarding_data);
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
            
            // TODO: Implement local LLM generation (e.g. WebLLM or Transformers.js) per Final Tech Stack.pdf
            // Cloud API calls (Gemini) are disabled for MVP local-first compliance.
            console.log("TODO: Generate script using local LLM. Using static template for now.");

            // Simulate generation delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            const newScript = {
                variations: {
                    short: `Hi ${profileData.name || 'Friend'}, take a moment to reflect. What was the most significant part of your day? (Local Template)`,
                    medium: `Hi ${profileData.name || 'Friend'}. Reflection is key to growth. Think about your goal of ${profileData.primary_goal || 'self-improvement'}. What steps did you take today? (Local Template)`,
                    long: `Hello ${profileData.name || 'Friend'}. Let's dive deep. You are focusing on ${profileData.focus_areas || 'general reflection'}. Walk through your day. What went well? What could be improved? Remember, every step counts. (Local Template)`
                }
            };

            console.log("ScriptDisplay: Generated local script:", newScript);
            setScript(newScript);

            // Save to profile
            const { error } = await supabase
                .from('profiles')
                .update({
                    onboarding_data: {
                        ...profileData,
                        script: newScript
                    }
                })
                .eq('id', userId);

            if (error) console.error('Error saving script:', error);

        } catch (error) {
            console.error('Error generating script:', error);
            toast({
                title: "Generation Failed",
                description: "Could not generate script locally.",
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
                            
                            return (
                                <TabsContent key={type} value={type} className="h-full m-0 p-0">
                                    <ScrollArea className="h-[400px] p-6">
                                        <div className="prose prose-sm dark:prose-invert max-w-none">
                                            {content ? (
                                                <div className="whitespace-pre-wrap font-medium leading-relaxed text-lg">
                                                    {content as string}
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
                                    {content && (
                                        <div className="absolute bottom-4 right-4">
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                className="shadow-lg backdrop-blur-md bg-background/80 hover:bg-background/90"
                                                onClick={() => copyToClipboard(content as string)}
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
