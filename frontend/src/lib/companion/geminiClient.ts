import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '@/integrations/supabase/client';
import { ChatMessage, UserContext } from './types';

export function buildSystemPrompt(context: UserContext): string {
  const goalsFormatted = context.goals.length > 0
    ? context.goals.map((g) => `- ${g}`).join('\n')
    : 'Not yet specified.';
  const anchorsFormatted = context.anchors.length > 0
    ? context.anchors.map((a) => `- ${a}`).join('\n')
    : 'Not yet specified.';
  const memoriesFormatted = context.memories.length > 0
    ? context.memories.map((m) => `• ${m.title}: ${m.content}`).join('\n')
    : 'No prior memories saved.';

  let speechSection = 'No recent video speech recordings analyzed yet.';
  if (context.recentScores) {
    speechSection = `Latest Reflection Scores: Overall: ${context.recentScores.overall}/100, Clarity: ${context.recentScores.clarity}/100, Pace: ${context.recentScores.pace}/100, Confidence: ${context.recentScores.confidence}/100, Tone: ${context.recentScores.tone}/100.
Strengths: ${(context.recentScores.strengths || []).join(', ') || 'Consistent practice'}
Areas to Refine: ${(context.recentScores.improvements || []).join(', ') || 'Pacing and conscious pauses'}`;
  }

  return `You are ${context.name}'s personal AI Diary & Communication Growth Companion on "The Future You" platform.
Your mission is to help ${context.name} reflect on their daily experiences, track their habits, improve speaking clarity and presence, and stay grounded in their core values.

--- User Profile Context ---
Name: ${context.name}
Bio: ${context.bio || 'Growth-minded individual'}

Personal Goals:
${goalsFormatted}

Grounding Anchors & Core Values:
${anchorsFormatted}

Habit Status:
${context.habitSummary}

Speech & Communication Profile:
${speechSection}

Key Memories & Reflection Notes:
${memoriesFormatted}

--- Coaching Guidelines ---
1. Empathy & Encouragement: Be warm, authentic, concise, and empowering.
2. Grounded Connection: When contextually relevant, reference their goals, habits, anchors, or speech metrics naturally.
3. Guided Reflection: Ask 1 concise, thought-provoking question to help them reflect deeper rather than giving long monologues.
4. Actionable Communication Advice: Provide crisp, practical tips on articulation, pause control, energy, and authenticity when they discuss speaking or self-expression.
5. Markdown: Use clean Markdown formatting with bullet points or bold text where appropriate.`;
}

export async function* streamCompanionResponse(
  message: string,
  history: ChatMessage[],
  context: UserContext,
  userId?: string
): AsyncGenerator<string> {
  const localProcessorUrl = (import.meta.env.VITE_LOCAL_PROCESSOR_URL as string) || 'http://localhost:3001';

  // Strategy 1: Try Local Processor Express SSE endpoint
  try {
    // getSession() refreshes an expired access token before returning it.
    const { data: { session } } = await supabase.auth.getSession();

    const response = await fetch(`${localProcessorUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify({
        message,
        conversationHistory: history,
        userId,
        stream: true,
      }),
    });

    if (response.ok && response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const dataStr = trimmed.slice(6);
            if (dataStr === '[DONE]') {
              return;
            }
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.chunk) {
                yield parsed.chunk;
              }
            } catch {
              // Ignore non-json data
            }
          }
        }
      }
      return;
    }
  } catch (backendError) {
    console.warn('Local processor backend not reachable, trying client-side fallback:', backendError);
  }

  // Strategy 2: Direct Google Generative AI via client VITE_GEMINI_API_KEY
  const clientApiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
  if (clientApiKey && !clientApiKey.startsWith('your_') && !clientApiKey.startsWith('xxxx')) {
    try {
      const genAI = new GoogleGenerativeAI(clientApiKey);
      const systemInstruction = buildSystemPrompt(context);
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.0-flash',
        systemInstruction,
      });

      const contents = history.map((msg) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      }));

      contents.push({
        role: 'user',
        parts: [{ text: message }],
      });

      const result = await model.generateContentStream({ contents });
      for await (const chunk of result.stream) {
        yield chunk.text();
      }
      return;
    } catch (geminiError) {
      console.error('Client Gemini SDK error:', geminiError);
    }
  }

  // Strategy 3: Local Empathetic Coach fallback generator
  const fallbackText =
    `Thank you for reflecting with me, **${context.name}**.\n\n` +
    `Regarding your thoughts on *"${message.slice(0, 60)}${message.length > 60 ? '...' : ''}"*:\n\n` +
    `• **Anchor Alignment**: Remember your foundation in **${context.anchors[0] || 'mindful focus'}**.\n` +
    `• **Habit Progress**: ${context.habitSummary}\n\n` +
    `What is one specific action or mindful adjustment you'd like to make today to stay true to your goals?`;

  for (const word of fallbackText.split(' ')) {
    yield word + ' ';
    await new Promise((r) => setTimeout(r, 25));
  }
}
