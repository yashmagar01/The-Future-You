
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Brain, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

interface CoherenceGraphProps {
  timeline: number[]; // Array of 0-1 scores
  averageScore: number;
}

const CoherenceGraph: React.FC<CoherenceGraphProps> = ({ timeline, averageScore }) => {
  // Transform data for Recharts
  const data = timeline.map((score, index) => ({
    sentence: `S${index + 1}`,
    score: Math.round(score * 100), // Convert to 0-100
    tooltipLabel: `Sentence ${index + 1}`
  }));

  // Calculate trend
  const startScore = data.length > 0 ? data[0].score : 0;
  const endScore = data.length > 0 ? data[data.length - 1].score : 0;
  const trend = endScore - startScore;

  return (
    <Card className="h-full border-border/50 hover:border-primary/20 transition-all duration-300">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Brain className="w-5 h-5 text-purple-500" />
              Logic Flow
            </CardTitle>
            <CardDescription>Sentence-by-sentence coherence analysis</CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-purple-600">
              {Math.round(averageScore * 100)}
            </div>
            <div className="text-xs text-muted-foreground flex items-center justify-end gap-1">
              {trend > 5 ? (
                <>
                  <ArrowUpRight className="w-3 h-3 text-green-500" />
                  <span className="text-green-500">Improving Flow</span>
                </>
              ) : trend < -5 ? (
                <>
                  <ArrowDownRight className="w-3 h-3 text-amber-500" />
                  <span className="text-amber-500">Losing Focus</span>
                </>
              ) : (
                <>
                  <Minus className="w-3 h-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Steady</span>
                </>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] w-full">
          {data.length > 1 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCoherence" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis 
                  dataKey="sentence" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={10} 
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  domain={[0, 100]} 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--background))", 
                    borderColor: "hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px"
                  }}
                  itemStyle={{ color: "hsl(var(--foreground))" }}
                  labelStyle={{ color: "hsl(var(--muted-foreground))" }}
                />
                <ReferenceLine y={Math.round(averageScore * 100)} stroke="#8b5cf6" strokeDasharray="3 3" opacity={0.5} />
                <Area 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#8b5cf6" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorCoherence)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
              Not enough data for flow analysis
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CoherenceGraph;
