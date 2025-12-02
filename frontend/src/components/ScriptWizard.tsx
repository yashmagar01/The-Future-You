import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, Sparkles, ArrowRight, RefreshCw, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ScriptWizardProps {
    onScriptGenerated: (script: string) => void;
    userParams: {
        full_name: string;
        experience_level: string;
    };
}

type WizardStep = 'topic' | 'structure' | 'preview';

interface StructureData {
    title: string;
    bullets: string[];
}

export function ScriptWizard({ onScriptGenerated, userParams }: ScriptWizardProps) {
    const [step, setStep] = useState<WizardStep>('topic');
    const [topic, setTopic] = useState("");
    const [loading, setLoading] = useState(false);
    const [structure, setStructure] = useState<StructureData | null>(null);
    const [script, setScript] = useState("");
    const { toast } = useToast();

    const generateStructure = async () => {
        if (!topic.trim()) return;
        setLoading(true);
        try {
            const { data, error } = await supabase.functions.invoke('prompt-generator', {
                body: {
                    mode: 'structure',
                    topic,
                    ...userParams
                }
            });

            if (error) throw error;
            setStructure(data);
            setStep('structure');
        } catch (error) {
            console.error('Error generating structure:', error);
            toast({
                title: "Error",
                description: "Failed to generate structure. Please try again.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const generateScript = async () => {
        if (!structure) return;
        setLoading(true);
        try {
            const { data, error } = await supabase.functions.invoke('prompt-generator', {
                body: {
                    mode: 'script',
                    topic,
                    structure,
                    duration_target: 'medium', // Default to medium for now
                    ...userParams
                }
            });

            if (error) throw error;
            setScript(data.script);
            setStep('preview');
        } catch (error) {
            console.error('Error generating script:', error);
            toast({
                title: "Error",
                description: "Failed to generate script. Please try again.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmScript = () => {
        onScriptGenerated(script);
    };

    return (
        <Card className="w-full max-w-2xl mx-auto p-6 bg-card/80 backdrop-blur-sm border-primary/10 shadow-xl">
            {/* STEP 1: TOPIC PRIMING */}
            {step === 'topic' && (
                <div className="space-y-6 animate-fade-in">
                    <div className="text-center space-y-2">
                        <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Sparkles className="w-6 h-6 text-primary" />
                        </div>
                        <h2 className="text-2xl font-bold">What's on your mind?</h2>
                        <p className="text-muted-foreground">
                            Enter a topic, a conflict, or an idea you want to explore.
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <Input
                            placeholder="e.g., Dealing with a difficult client, My goals for Q4..."
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            className="text-lg py-6"
                            onKeyDown={(e) => e.key === 'Enter' && generateStructure()}
                        />
                    </div>

                    <Button 
                        className="w-full text-lg py-6" 
                        onClick={generateStructure}
                        disabled={!topic.trim() || loading}
                    >
                        {loading ? (
                            <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Thinking...</>
                        ) : (
                            <>Generate Structure <ArrowRight className="ml-2 h-5 w-5" /></>
                        )}
                    </Button>
                </div>
            )}

            {/* STEP 2: STRUCTURE REVIEW */}
            {step === 'structure' && structure && (
                <div className="space-y-6 animate-fade-in">
                    <div className="text-center space-y-2">
                        <h2 className="text-xl font-bold text-primary">{structure.title}</h2>
                        <p className="text-sm text-muted-foreground">Here's a suggested structure for your reflection.</p>
                    </div>

                    <div className="bg-muted/30 p-4 rounded-lg space-y-3 border border-border/50">
                        {structure.bullets.map((bullet, idx) => (
                            <div key={idx} className="flex items-start gap-3">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold">
                                    {idx + 1}
                                </span>
                                <p className="text-base">{bullet}</p>
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button variant="outline" className="flex-1" onClick={() => setStep('topic')}>
                            Back
                        </Button>
                        <Button variant="ghost" className="flex-1" onClick={generateStructure} disabled={loading}>
                            <RefreshCw className="mr-2 h-4 w-4" /> Spin Again
                        </Button>
                        <Button className="flex-[2]" onClick={generateScript} disabled={loading}>
                            {loading ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Writing Script...</>
                            ) : (
                                <><FileText className="mr-2 h-4 w-4" /> Generate Full Script</>
                            )}
                        </Button>
                    </div>
                </div>
            )}

            {/* STEP 3: PREVIEW */}
            {step === 'preview' && (
                <div className="space-y-6 animate-fade-in">
                    <div className="text-center">
                        <h2 className="text-xl font-bold">Your Script is Ready</h2>
                        <p className="text-muted-foreground">Review it before loading the teleprompter.</p>
                    </div>

                    <div className="bg-muted/30 p-4 rounded-lg max-h-[300px] overflow-y-auto border border-border/50 text-lg leading-relaxed whitespace-pre-wrap">
                        {script}
                    </div>

                    <div className="flex gap-3">
                        <Button variant="outline" onClick={() => setStep('structure')}>
                            Back
                        </Button>
                        <Button className="flex-1 w-full bg-green-600 hover:bg-green-700 text-white" onClick={handleConfirmScript}>
                            Start Recording
                        </Button>
                    </div>
                </div>
            )}
        </Card>
    );
}
