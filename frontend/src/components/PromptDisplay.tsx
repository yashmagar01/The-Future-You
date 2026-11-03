import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, Maximize2, Minimize2 } from "lucide-react";
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Prompt {
    id: string;
    text: string;
    category: string;
}

export function PromptDisplay() {
    const [prompt, setPrompt] = useState<Prompt | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isTeleprompter, setIsTeleprompter] = useState(false);

    const fetchPrompt = async () => {
        setIsLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const response = await fetch(`${supabaseUrl}/functions/v1/generate-prompt`, {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setPrompt(data.prompt);
            }
        } catch (error) {
            console.error("Failed to fetch prompt:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPrompt();
    }, []);

    if (isLoading) {
        return <Skeleton className="h-32 w-full rounded-xl" />;
    }

    if (!prompt) {
        return (
            <Card>
                <CardContent className="p-6 text-center">
                    <p className="text-muted-foreground">No prompt available.</p>
                    <Button variant="outline" onClick={fetchPrompt} className="mt-4">
                        <RefreshCw className="mr-2 h-4 w-4" /> Try Again
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={`transition-all duration-500 ${isTeleprompter ? 'fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur' : ''}`}>
            <CardContent className="p-6 relative w-full max-w-4xl mx-auto">
                <div className="absolute top-4 right-4 flex gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsTeleprompter(!isTeleprompter)}
                        title={isTeleprompter ? "Exit Teleprompter" : "Teleprompter Mode"}
                        aria-label={isTeleprompter ? "Exit Teleprompter" : "Teleprompter Mode"}
                    >
                        {isTeleprompter ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={fetchPrompt} title="New Prompt" aria-label="New Prompt">
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </div>

                <div className={`text-center transition-all ${isTeleprompter ? 'text-4xl md:text-6xl font-bold leading-tight py-20' : 'text-xl font-medium'}`}>
                    {prompt.text}
                </div>

                {!isTeleprompter && (
                    <div className="mt-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary capitalize">
                            {prompt.category}
                        </span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
