import React, { useEffect, useRef } from 'react';
import { ScrollArea } from '@radix-ui/react-scroll-area';

interface TranscriptSegment {
  time: number;
  text: string;
  isFiller?: boolean;
}

interface TranscriptViewerProps {
  transcript: TranscriptSegment[];
  currentTime: number;
  onSeek: (time: number) => void;
}

const TranscriptViewer: React.FC<TranscriptViewerProps> = ({ transcript, currentTime, onSeek }) => {
  const activeRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to active segment
  useEffect(() => {
    if (activeRef.current && containerRef.current) {
      const container = containerRef.current;
      const active = activeRef.current;
      
      const containerHeight = container.clientHeight;
      const activeTop = active.offsetTop;
      const activeHeight = active.clientHeight;
      
      // Scroll so active element is in the middle
      container.scrollTo({
        top: activeTop - containerHeight / 2 + activeHeight / 2,
        behavior: 'smooth'
      });
    }
  }, [currentTime]);

  // Helper to identify filler words (simple list for MVP)
  const isFillerWord = (word: string) => {
    const fillers = ['um', 'uh', 'ah', 'like', 'basically', 'actually', 'literally'];
    return fillers.includes(word.toLowerCase().replace(/[^a-z]/g, ''));
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col h-[400px] overflow-hidden">
      <div className="p-4 border-b border-gray-100 bg-gray-50/50">
        <h3 className="font-semibold text-gray-800">Transcript</h3>
      </div>
      
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto p-6 space-y-4 scroll-smooth"
      >
        {transcript.map((segment, idx) => {
          // Determine if this segment is active based on time
          // Assuming segments are ordered by time
          const nextSegment = transcript[idx + 1];
          const isActive = currentTime >= segment.time && (!nextSegment || currentTime < nextSegment.time);
          
          return (
            <div 
              key={idx}
              ref={isActive ? activeRef : null}
              className={`transition-all duration-300 cursor-pointer p-2 rounded-lg ${
                isActive 
                  ? 'bg-blue-50/50 border-l-4 border-blue-500 pl-3' 
                  : 'hover:bg-gray-50 border-l-4 border-transparent'
              }`}
              onClick={() => onSeek(segment.time)}
            >
              <div className="flex gap-3">
                <span className="text-xs text-gray-400 font-mono mt-1 min-w-[35px]">
                  {Math.floor(segment.time / 60)}:{(segment.time % 60).toString().padStart(2, '0')}
                </span>
                <p className={`text-sm leading-relaxed ${isActive ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                  {segment.text.split(' ').map((word, wIdx) => (
                    <span key={wIdx}>
                      {isFillerWord(word) ? (
                        <span className="bg-orange-100 text-orange-700 px-1 rounded mx-0.5 font-medium">
                          {word}
                        </span>
                      ) : (
                        word
                      )}
                      {' '}
                    </span>
                  ))}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TranscriptViewer;
