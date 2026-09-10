import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { streamCompanionResponse } from '@/lib/companion/geminiClient';
import { ChatMessage, UserContext } from '@/lib/companion/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  Send, 
  Sparkles, 
  Bookmark, 
  RotateCcw, 
  Copy, 
  Check, 
  Bot, 
  User, 
  Loader2,
  Lightbulb
} from 'lucide-react';

interface CompanionChatProps {
  context: UserContext;
  onRefreshContext?: () => void;
}

const QUICK_PROMPTS = [
  { icon: '🎙️', label: 'Review my speaking confidence', prompt: 'Can you review my recent speech analysis metrics and give me 2 actionable pointers for my next video?' },
  { icon: '🧘', label: 'Daily reflection & gratitude', prompt: 'Help me do a quick 3-minute evening reflection on what went well today and how my habits held up.' },
  { icon: '🎯', label: 'Align with my core goals', prompt: 'Based on my stated goals and grounding anchors, what should be my primary focus for tomorrow?' },
  { icon: '💡', label: 'Speech pacing & filler words tip', prompt: 'How can I stay calm and eliminate filler words when presenting complex ideas under pressure?' },
];

export function CompanionChat({ context, onRefreshContext }: CompanionChatProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [savedIndex, setSavedIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadChatHistory();
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  const loadChatHistory = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('companion_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(30);

      if (!error && data && data.length > 0) {
        setMessages(
          data.map((m) => ({
            id: m.id,
            role: m.role as 'user' | 'assistant' | 'system',
            content: m.content,
            created_at: m.created_at || undefined,
          }))
        );
      } else {
        // Initial greeting if no previous messages
        setMessages([
          {
            role: 'assistant',
            content: `Hello **${context.name || 'there'}**! I am your AI Diary & Communication Companion. I'm connected with your personal goals, daily habits, and speech reflections. How are you feeling today?`,
          },
        ]);
      }
    } catch (err) {
      console.error('Error loading chat history:', err);
    }
  };

  const handleSend = async (customText?: string) => {
    const textToSend = (customText || input).trim();
    if (!textToSend || isStreaming) return;

    setInput('');
    const newHistory: ChatMessage[] = [...messages, { role: 'user', content: textToSend }];
    setMessages(newHistory);
    setIsStreaming(true);

    // Add placeholder assistant message
    const assistantMsgIndex = newHistory.length;
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

    try {
      let accumulated = '';
      const stream = streamCompanionResponse(textToSend, messages, context, user?.id);

      for await (const chunk of stream) {
        accumulated += chunk;
        setMessages((prev) => {
          const updated = [...prev];
          if (updated[assistantMsgIndex]) {
            updated[assistantMsgIndex] = {
              ...updated[assistantMsgIndex],
              content: accumulated,
            };
          }
          return updated;
        });
      }

      // Refresh context (habits, stats) after meaningful interaction
      onRefreshContext?.();
    } catch (err) {
      console.error('Chat error:', err);
      toast({
        title: 'Error generating response',
        description: 'Please check your connection and try again.',
        variant: 'destructive',
      });
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const copyMessage = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
    toast({
      title: 'Copied to clipboard',
      description: 'Reflection text copied successfully.',
    });
  };

  const saveAsMemory = async (content: string, index: number) => {
    if (!user) return;
    try {
      const title = content.slice(0, 40).replace(/[*#]/g, '').trim() || 'Key Reflection';
      const { error } = await supabase.from('reflections_memories').insert({
        user_id: user.id,
        title,
        content,
        category: 'reflection',
        tags: ['ai-companion', 'insights'],
      });

      if (error) throw error;

      setSavedIndex(index);
      setTimeout(() => setSavedIndex(null), 2500);
      toast({
        title: 'Saved to Reflections',
        description: 'This reflection is now stored in your permanent memory bank.',
      });
      onRefreshContext?.();
    } catch (err) {
      console.error('Error saving memory:', err);
      toast({
        title: 'Save failed',
        description: 'Could not save memory to Supabase.',
        variant: 'destructive',
      });
    }
  };

  const clearChat = async () => {
    if (!user) return;
    try {
      await supabase.from('companion_messages').delete().eq('user_id', user.id);
      setMessages([
        {
          role: 'assistant',
          content: `New reflection session started. What's on your mind today, **${context.name}**?`,
        },
      ]);
      toast({
        title: 'Conversation reset',
        description: 'Started a fresh reflection session.',
      });
    } catch (err) {
      console.error('Error clearing chat:', err);
    }
  };

  return (
    <div className="flex flex-col h-[700px] bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500 text-white rounded-lg shadow-sm">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              Reflection & AI Coach
              <span className="text-xs bg-emerald-100 text-emerald-800 font-medium px-2 py-0.5 rounded-full">
                Gemini 2.0 Flash
              </span>
            </h3>
            <p className="text-xs text-gray-500">
              Personalized with your goals, anchors, habit streaks, and speech scores
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={clearChat}
          className="text-gray-600 hover:text-gray-900 border-gray-200 text-xs"
        >
          <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
          New Session
        </Button>
      </div>

      {/* Quick Prompts Bar */}
      <div className="px-6 py-2.5 bg-gray-50 border-b border-gray-100 overflow-x-auto flex gap-2">
        {QUICK_PROMPTS.map((qp, idx) => (
          <button
            key={idx}
            disabled={isStreaming}
            onClick={() => handleSend(qp.prompt)}
            className="flex-shrink-0 text-xs bg-white border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50 text-gray-700 px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 shadow-2xs"
          >
            <span>{qp.icon}</span>
            <span>{qp.label}</span>
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {messages.map((msg, index) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={index}
              className={`flex gap-3.5 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="h-8 w-8 rounded-full bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                  <Bot className="h-4 w-4" />
                </div>
              )}

              <div
                className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  isUser
                    ? 'bg-emerald-600 text-white shadow-xs rounded-br-xs'
                    : 'bg-gray-100 text-gray-800 border border-gray-200/70 rounded-bl-xs'
                }`}
              >
                <div className="whitespace-pre-wrap select-text">{msg.content}</div>

                {!isUser && msg.content && (
                  <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-200/60 text-xs text-gray-500">
                    <button
                      onClick={() => copyMessage(msg.content, index)}
                      className="hover:text-gray-800 flex items-center gap-1 transition-colors"
                    >
                      {copiedIndex === index ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      <span>{copiedIndex === index ? 'Copied' : 'Copy'}</span>
                    </button>

                    <button
                      onClick={() => saveAsMemory(msg.content, index)}
                      className="hover:text-emerald-700 flex items-center gap-1 ml-2 transition-colors"
                    >
                      {savedIndex === index ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <Bookmark className="h-3.5 w-3.5" />
                      )}
                      <span>{savedIndex === index ? 'Saved Memory' : 'Pin to Memories'}</span>
                    </button>
                  </div>
                )}
              </div>

              {isUser && (
                <div className="h-8 w-8 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center flex-shrink-0">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          );
        })}

        {isStreaming && messages[messages.length - 1]?.role !== 'assistant' && (
          <div className="flex gap-3 justify-start items-center text-gray-500 text-xs">
            <div className="h-8 w-8 rounded-full bg-emerald-600 text-white flex items-center justify-center">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
            <span>AI Companion is reflecting...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="p-4 border-t border-gray-100 bg-white">
        <div className="relative flex items-end gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Share a reflection, ask for speaking coaching, or check habit progress... (Shift + Enter for newline)"
            rows={2}
            className="resize-none pr-12 text-sm bg-gray-50 border-gray-200 focus:bg-white focus:border-emerald-500 rounded-xl"
            disabled={isStreaming}
          />
          <Button
            size="icon"
            disabled={!input.trim() || isStreaming}
            onClick={() => handleSend()}
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-10 w-10 flex-shrink-0 shadow-xs"
          >
            {isStreaming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-[11px] text-gray-400 mt-2 text-center">
          Encrypted & securely synced with your Supabase profile and speech reflections.
        </p>
      </div>
    </div>
  );
}
