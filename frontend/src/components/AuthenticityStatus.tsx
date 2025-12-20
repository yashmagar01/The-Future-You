
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, ShieldAlert, Fingerprint, Activity, Mic, Video, Type } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface Metrics {
    pitch_stability?: number;
    voice_quality?: number;
    text_sentiment?: number;
    body_openness?: number;
}

interface AuthenticityStatusProps {
    incongruenceIndex: number; // 0-1 (Lower is better)
    hasWarning: boolean;
    breakdown?: Metrics;
}

const AuthenticityStatus: React.FC<AuthenticityStatusProps> = ({ incongruenceIndex, hasWarning, breakdown }) => {
    // Determine status
    // Note: Backend threshold is > 0.1 for warning
    const isAuthentic = !hasWarning; 
    
    // Scale index for display: 0.0 -> 100% Match, 0.4+ -> 0% Match
    // If index = 0, Match = 100. If index = 0.2, Match = 50.
    const matchPercentage = Math.max(0, Math.round((1 - (incongruenceIndex * 2.5)) * 100));

  return (
    <Card className={`h-full border-2 transition-all duration-300 ${isAuthentic ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
            <div className="space-y-1">
                <CardTitle className="flex items-center gap-2 text-lg">
                    {isAuthentic ? (
                        <ShieldCheck className="w-5 h-5 text-green-600" />
                    ) : (
                        <ShieldAlert className="w-5 h-5 text-red-600 animate-pulse" />
                    )}
                    Authenticity Check
                </CardTitle>
                <CardDescription>
                    {isAuthentic 
                        ? "Signals are aligned and natural" 
                        : "Mismatch detected between signals"}
                </CardDescription>
            </div>
            <Badge variant={isAuthentic ? "outline" : "destructive"} className={isAuthentic ? "text-green-600 border-green-600/30" : ""}>
                {isAuthentic ? "VERIFIED" : "WARNING"}
            </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Main Score */}
        <div className="flex items-end justify-between">
            <div>
                <div className={`text-3xl font-bold ${isAuthentic ? 'text-green-700' : 'text-red-700'}`}>
                    {matchPercentage}%
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                    Signal Alignment Score
                </div>
            </div>
            <Fingerprint className={`w-12 h-12 opacity-10 ${isAuthentic ? 'text-green-500' : 'text-red-500'}`} />
        </div>

        {/* Signal Breakdown */}
        {breakdown && (
            <div className="space-y-3 pt-2 border-t border-border/10">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Signal Breakdown</p>
                
                {/* Text Sentiment */}
                <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                        <span className="flex items-center gap-1.5"><Type className="w-3 h-3"/> Text Content</span>
                        <span>{Math.round((breakdown.text_sentiment || 0) * 100)}%</span>
                    </div>
                    <Progress value={(breakdown.text_sentiment || 0) * 100} className="h-1.5" />
                </div>

                {/* Voice Stability */}
                <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                        <span className="flex items-center gap-1.5"><Mic className="w-3 h-3"/> Voice Stability</span>
                        <span>{Math.round((breakdown.pitch_stability || 0) * 100)}%</span>
                    </div>
                    <Progress value={(breakdown.pitch_stability || 0) * 100} className="h-1.5" />
                </div>

                {/* Body Language */}
                <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                        <span className="flex items-center gap-1.5"><Video className="w-3 h-3"/> Body Openness</span>
                        <span>{Math.round((breakdown.body_openness || 0) * 100)}%</span>
                    </div>
                    <Progress value={(breakdown.body_openness || 0) * 100} className="h-1.5" />
                </div>
            </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AuthenticityStatus;
