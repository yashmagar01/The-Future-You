import { useState, useEffect, useRef } from 'react';
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Play, Pause, Type, Settings2, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface TeleprompterOverlayProps {
    script: string;
    onClose: () => void;
}

export function TeleprompterOverlay({ script, onClose }: TeleprompterOverlayProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [scrollSpeed, setScrollSpeed] = useState(30); // Pixels per second (approx)
    const [fontSize, setFontSize] = useState(24);
    const [scrollPosition, setScrollPosition] = useState(0);
    
    const containerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const animationFrameRef = useRef<number>();
    const lastTimeRef = useRef<number>(0);

    // Auto-scroll logic
    useEffect(() => {
        if (!isPlaying) {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            return;
        }

        const animate = (time: number) => {
            if (lastTimeRef.current !== 0) {
                const deltaTime = (time - lastTimeRef.current) / 1000; // Seconds
                setScrollPosition(prev => {
                    const newPos = prev + (scrollSpeed * deltaTime);
                    // Check if we reached the end
                    if (contentRef.current && containerRef.current) {
                        const maxScroll = contentRef.current.scrollHeight - containerRef.current.clientHeight;
                        if (newPos >= maxScroll + 100) { // +100 buffer
                            setIsPlaying(false);
                            return prev;
                        }
                    }
                    return newPos;
                });
            }
            lastTimeRef.current = time;
            animationFrameRef.current = requestAnimationFrame(animate);
        };

        animationFrameRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [isPlaying, scrollSpeed]);

    // Reset lastTime when playing starts
    useEffect(() => {
        if (isPlaying) {
            lastTimeRef.current = performance.now();
        }
    }, [isPlaying]);

    // Apply scroll position
    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTop = scrollPosition;
        }
    }, [scrollPosition]);

    return (
        <div className="absolute inset-0 z-50 pointer-events-none flex flex-col">
            {/* Overlay Container */}
            <div className="relative flex-1 w-full h-full overflow-hidden bg-black/20">
                
                {/* Text Area */}
                <div 
                    ref={containerRef}
                    className="absolute inset-0 overflow-y-auto no-scrollbar pointer-events-auto"
                    style={{ scrollBehavior: 'auto' }} // Disable smooth scroll for JS control
                    onScroll={(e) => {
                        // Allow manual scroll override if paused
                        if (!isPlaying) {
                            setScrollPosition(e.currentTarget.scrollTop);
                        }
                    }}
                >
                    {/* Padding to start text in middle of screen */}
                    <div style={{ height: '40vh' }} /> 
                    
                    <div 
                        ref={contentRef}
                        className="max-w-3xl mx-auto px-8 text-center font-sans font-bold text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]"
                        style={{ 
                            fontSize: `${fontSize}px`,
                            lineHeight: '1.5',
                            textShadow: '0 0 10px rgba(0,0,0,0.5)'
                        }}
                    >
                        {script}
                    </div>

                    {/* Padding to end text in middle of screen */}
                    <div style={{ height: '50vh' }} />
                </div>

                {/* Controls Bar (Bottom) */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/60 backdrop-blur-md p-3 rounded-full pointer-events-auto border border-white/10 shadow-2xl transition-opacity hover:opacity-100 opacity-80">
                    
                    <Button
                        size="icon"
                        variant="ghost"
                        className="text-white hover:bg-white/20 rounded-full h-10 w-10"
                        onClick={() => setIsPlaying(!isPlaying)}
                    >
                        {isPlaying ? <Pause className="fill-current" /> : <Play className="fill-current ml-1" />}
                    </Button>

                    <div className="w-32 px-2">
                        <p className="text-[10px] text-white/70 font-medium uppercase tracking-wider mb-1 text-center">Speed</p>
                        <Slider
                            value={[scrollSpeed]}
                            min={10}
                            max={100}
                            step={5}
                            onValueChange={(val) => setScrollSpeed(val[0])}
                            className="cursor-pointer"
                        />
                    </div>

                    <Popover>
                        <PopoverTrigger asChild>
                            <Button size="icon" variant="ghost" className="text-white hover:bg-white/20 rounded-full h-10 w-10">
                                <Type />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-40 p-3 bg-black/80 border-white/10 text-white backdrop-blur-xl" side="top">
                            <div className="space-y-2">
                                <p className="text-xs text-white/70 font-medium">Font Size</p>
                                <Slider
                                    value={[fontSize]}
                                    min={16}
                                    max={48}
                                    step={2}
                                    onValueChange={(val) => setFontSize(val[0])}
                                />
                            </div>
                        </PopoverContent>
                    </Popover>

                    <div className="w-px h-6 bg-white/20 mx-1" />

                    <Button
                        size="icon"
                        variant="ghost"
                        className="text-red-400 hover:bg-red-500/20 hover:text-red-300 rounded-full h-10 w-10"
                        onClick={onClose}
                    >
                        <X />
                    </Button>
                </div>
            </div>
        </div>
    );
}
