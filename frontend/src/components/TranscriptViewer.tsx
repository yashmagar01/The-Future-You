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
              className="bg-[rgba(251,191,36,0.2)] text-[#92400e] px-1 rounded mx-0.5 font-medium border border-amber-200/30"
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
    <div className="bg-white rounded-[20px] border border-[#E8F0EC] shadow-sm flex flex-col h-[500px] overflow-hidden font-sans tracking-tight">
      <div className="p-5 lg:p-6 border-b border-[#E8F0EC] flex justify-between items-center">
        <h3 className="text-[22px] font-bold text-gray-900 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#F4F4F5] flex items-center justify-center">
            <Clock className="w-5 h-5 text-gray-700" />
          </div>
          Transcript
        </h3>
        <span className="text-[12px] font-bold text-gray-500 uppercase tracking-widest bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm">
          Auto-scroll
        </span>
      </div>
      
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto p-0 scroll-smooth"
      >
        {transcript.map((segment, idx) => {
          // Determine if this segment is active based on time
          const nextSegment = transcript[idx + 1];
          const isActive = currentTime >= segment.time && (!nextSegment || currentTime < nextSegment.time);
          
          return (
            <div 
              key={idx}
              ref={isActive ? activeRef : null}
              className={`group transition-all duration-300 p-5 border-b border-[#E8F0EC]/50 ${
                isActive 
                  ? 'bg-[#EAF8F2]/30 shadow-sm z-10 relative border-l-4 border-l-[#16C784]' 
                  : 'hover:bg-gray-50 border-l-4 border-l-transparent'
              }`}
            >
              <div className="flex gap-4 items-start ml-[-4px]">
                {/* Timestamp Column */}
                <div className="flex-shrink-0 w-16 pt-0.5">
                  <button
                    onClick={() => onSeek(segment.time)}
                    className={`text-[13px] font-semibold transition-colors px-2 py-1 rounded bg-gray-100 ${
                      isActive 
                        ? 'text-[#16C784] bg-[#16C784]/10' 
                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    {Math.floor(segment.time / 60)}:{(segment.time % 60).toString().padStart(2, '0')}
                  </button>
                </div>

                {/* Text Content */}
                <p className={`text-[16px] leading-[1.7] flex-1 font-medium ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>
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
