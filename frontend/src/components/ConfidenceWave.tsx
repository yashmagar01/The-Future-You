
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Line, LineChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Activity, Zap } from "lucide-react";

interface ConfidenceWaveProps {
  pitchTimeline?: number[]; // F0 (Hz)
  gestureTimeline?: number[]; // Movement energy
}

const ConfidenceWave: React.FC<ConfidenceWaveProps> = ({ pitchTimeline = [], gestureTimeline = [] }) => {
  // Normalize lengths to match (use shorter length)
  const length = Math.min(pitchTimeline.length, gestureTimeline.length);
  
  // Transform data for Recharts
  // Normalize values to 0-100 scale for comparison overlay
  const maxPitch = Math.max(...pitchTimeline) || 1;
  const maxGesture = Math.max(...gestureTimeline) || 1;

  const data = Array.from({ length }).map((_, i) => ({
    time: `T${i}`,
    vocalEnergy: Math.round((pitchTimeline[i] / maxPitch) * 100),
    physicalEnergy: Math.round((gestureTimeline[i] / maxGesture) * 100),
  }));

  return (
    <Card className="h-full border-border/50 hover:border-primary/20 transition-all duration-300">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="w-5 h-5 text-blue-500" />
              Confidence Wave
            </CardTitle>
            <CardDescription>Vocal vs. Physical Energy Alignment</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] w-full">
          {data.length > 1 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis 
                  dataKey="time" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={10} 
                  tickLine={false}
                  axisLine={false}
                  tick={false} 
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
                  itemStyle={{ fontSize: "12px" }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                
                <Line 
                  type="monotone" 
                  dataKey="vocalEnergy" 
                  name="Vocal Energy" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="physicalEnergy" 
                  name="Physical Energy" 
                  stroke="#f97316" 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
              Not enough data for confidence wave
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ConfidenceWave;
