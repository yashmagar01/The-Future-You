import React, { useEffect, useRef } from 'react';
import { Clock } from 'lucide-react';

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

  // Helper to identify filler words
  const isFillerWord = (word: string) => {
    const fillers = ['um', 'uh', 'ah', 'like', 'basically', 'actually', 'literally'];
    return fillers.includes(word.toLowerCase().replace(/[^a-z]/g, ''));
  };

  // Helper to render text with highlighted filler words
  const renderTextWithHighlights = (text: string) => {
    const words = text.split(' ');
    return words.map((word, index) => {
      const isFiller = isFillerWord(word);
      if (isFiller) {
        return (
          <React.Fragment key={index}>
            <span 
              className="bg-amber-100 text-amber-800 px-1 rounded mx-0.5 font-medium border border-amber-200/50"
              title="Filler word"
            >
              {word}
            </span>
            {' '}
          </React.Fragment>
        );
      }
      return <React.Fragment key={index}>{word} </React.Fragment>;
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col h-[500px] overflow-hidden">
      <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-500" />
          Transcript
        </h3>
        <span className="text-xs font-medium text-gray-500 bg-gray-200/50 px-2 py-1 rounded-full">
          Auto-scroll enabled
        </span>
      </div>
      
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth"
      >
        {transcript.map((segment, idx) => {
          // Determine if this segment is active based on time
          const nextSegment = transcript[idx + 1];
          const isActive = currentTime >= segment.time && (!nextSegment || currentTime < nextSegment.time);
          
          return (
            <div 
              key={idx}
              ref={isActive ? activeRef : null}
              className={`group transition-all duration-300 rounded-xl p-4 border-l-4 ${
                isActive 
                  ? 'bg-blue-50/50 border-blue-500 shadow-sm' 
                  : 'hover:bg-gray-50 border-transparent hover:border-gray-200'
              }`}
            >
              <div className="flex gap-4 items-start">
                {/* Timestamp Column */}
                <div className="flex-shrink-0 w-12 pt-1">
                  <button
                    onClick={() => onSeek(segment.time)}
                    className={`text-xs font-mono px-2 py-0.5 rounded transition-colors w-full text-center ${
                      isActive 
                        ? 'bg-blue-100 text-blue-700 font-bold' 
                        : 'text-gray-400 bg-gray-100 group-hover:bg-gray-200 group-hover:text-gray-600'
                    }`}
                  >
                    {Math.floor(segment.time / 60)}:{(segment.time % 60).toString().padStart(2, '0')}
                  </button>
                </div>

                {/* Text Content */}
                <p className={`text-base leading-relaxed flex-1 ${isActive ? 'text-gray-900' : 'text-gray-600'}`}>
                  {renderTextWithHighlights(segment.text)}
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
