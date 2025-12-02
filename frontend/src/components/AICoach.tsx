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
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-white rounded-lg shadow-sm text-indigo-600">
            <Lightbulb size={20} />
          </div>
          <h3 className="font-bold text-gray-800">Key Takeaways</h3>
        </div>
        
        <ul className="space-y-3">
          {takeaways.map((takeaway, idx) => (
            <li key={idx} className="flex gap-3 text-sm text-gray-700 leading-relaxed">
              <span className="text-indigo-500 font-bold">•</span>
              {takeaway}
            </li>
          ))}
        </ul>
      </div>

      {/* Actionable Fixes Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex-1">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-gray-50 rounded-lg text-gray-600">
            <CheckSquare size={20} />
          </div>
          <h3 className="font-bold text-gray-800">Actionable Fixes</h3>
        </div>

        <div className="space-y-3">
          {actionItems.map((item) => (
            <div 
              key={item.id} 
              className="group p-3 rounded-lg border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all cursor-pointer"
              onClick={() => item.timestamp && onSeek(item.timestamp)}
            >
              <div className="flex justify-between items-start gap-3">
                <div className="flex gap-3">
                  <div className={`mt-0.5 w-4 h-4 rounded border ${item.completed ? 'bg-green-500 border-green-500' : 'border-gray-300'} flex items-center justify-center`}>
                    {item.completed && <ArrowRight size={10} className="text-white" />}
                  </div>
                  <span className="text-sm text-gray-700 font-medium">{item.text}</span>
                </div>
                
                {item.timestamp && (
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity text-indigo-600">
                    <PlayCircle size={16} />
                  </div>
                )}
              </div>
              {item.timestamp && (
                <div className="ml-7 mt-1 text-xs text-gray-400 font-mono">
                  Jump to {Math.floor(item.timestamp / 60)}:{(item.timestamp % 60).toString().padStart(2, '0')}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AICoach;
