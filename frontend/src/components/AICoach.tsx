import React from 'react';
import { Lightbulb, CheckSquare, ArrowRight, PlayCircle } from 'lucide-react';

interface ActionItem {
  id: string;
  text: string;
  timestamp?: number;
  completed?: boolean;
}

interface AICoachProps {
  takeaways: string[];
  actionItems: ActionItem[];
  onSeek: (time: number) => void;
}

const AICoach: React.FC<AICoachProps> = ({ takeaways, actionItems, onSeek }) => {
  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Key Takeaways Card */}
      <div className="bg-white rounded-2xl border border-indigo-100 p-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-50" />
        
        <div className="flex items-center gap-3 mb-5 relative z-10">
          <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600">
            <Lightbulb size={20} className="stroke-[2.5px]" />
          </div>
          <h3 className="font-bold text-gray-800 text-lg">Key Takeaways</h3>
        </div>
        
        <ul className="space-y-4 relative z-10">
          {takeaways.map((takeaway, idx) => (
            <li key={idx} className="flex gap-3 text-gray-600 leading-relaxed text-[15px]">
              <span className="text-indigo-500 font-bold text-lg leading-none mt-0.5">•</span>
              {takeaway}
            </li>
          ))}
        </ul>
      </div>

      {/* Actionable Fixes Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex-1 flex flex-col">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600">
            <CheckSquare size={20} className="stroke-[2.5px]" />
          </div>
          <h3 className="font-bold text-gray-800 text-lg">Actionable Fixes</h3>
        </div>

        <div className="space-y-3 flex-1 overflow-y-auto pr-1 custom-scrollbar">
          {actionItems.map((item) => (
            <div 
              key={item.id} 
              className="group p-4 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all cursor-pointer relative"
              onClick={() => item.timestamp && onSeek(item.timestamp)}
            >
              <div className="flex justify-between items-start gap-3">
                <div className="flex gap-3.5">
                  <div className={`mt-0.5 w-5 h-5 rounded-md border-2 ${item.completed ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300 group-hover:border-indigo-300'} flex items-center justify-center transition-colors`}>
                    {item.completed && <ArrowRight size={12} className="text-white stroke-[3px]" />}
                  </div>
                  <div>
                    <span className={`text-[15px] font-medium transition-colors ${item.completed ? 'text-gray-400 line-through decoration-gray-300' : 'text-gray-700 group-hover:text-indigo-900'}`}>
                      {item.text}
                    </span>
                    {item.timestamp && (
                      <div className="flex items-center gap-1.5 mt-1.5 text-xs text-gray-400 font-medium group-hover:text-indigo-500 transition-colors">
                        <PlayCircle size={12} />
                        <span>Jump to {Math.floor(item.timestamp / 60)}:{(item.timestamp % 60).toString().padStart(2, '0')}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AICoach;
