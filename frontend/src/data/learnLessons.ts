// Learn Mode — Lesson content data
// GeeksforGeeks-style communication lessons that feed into Play Mode practice.

export type LessonCategory =
  | 'Confidence'
  | 'Public Speaking'
  | 'Interview Skills'
  | 'Storytelling'
  | 'Listening'
  | 'Body Language';

export interface LessonSection {
  heading: string;
  body: string;
}

export interface Lesson {
  id: string;
  title: string;
  category: LessonCategory;
  emoji: string;
  readTimeMin: number;
  summary: string;
  /** Linked Play Mode level id (e.g. 'level-3') — used for "Start Practice" CTA. */
  playLevelId: string | null;
  sections: LessonSection[];
  takeaways: string[];
}

export const LEARN_CATEGORIES: Array<'All' | LessonCategory> = [
  'All',
  'Confidence',
  'Public Speaking',
  'Interview Skills',
  'Storytelling',
  'Listening',
  'Body Language',
];

export const LEARN_LESSONS: Lesson[] = [
  {
    id: 'confidence-nerves',
    title: 'Taming Pre-Conversation Nerves',
    category: 'Confidence',
    emoji: '🧘',
    readTimeMin: 6,
    summary:
      'Nervousness is not weakness — it is energy misfiring. Here is how to channel it into steady speech.',
    playLevelId: 'level-1',
    sections: [
      {
        heading: 'Why you feel nervous',
        body: 'When you expect judgment, your brain reads it as social threat and floods you with adrenaline. That is why your heart races and words get stuck. The good news: the physical symptoms of excitement and nerves are nearly identical, so you can literally re-label the feeling.',
      },
      {
        heading: 'Breathe before you speak',
        body: 'Do a slow exhale (longer than your inhale) for about 60 seconds before you start. This activates the parasympathetic nervous system and lowers heart rate. Then start speaking — not perfectly, just started.',
      },
      {
        heading: 'Reframe the stakes',
        body: 'Ask yourself: "What is the worst realistic outcome?" Usually it is mild awkwardness, not catastrophe. Shrinking the stakes makes it easier to take the shot.',
      },
      {
        heading: 'Start small',
        body: 'Practice in low-stakes settings first — talking to a friend, ordering at a restaurant, small talk at work. Confidence is a muscle trained by reps, not a trait you are born with.',
      },
    ],
    takeaways: [
      'Slow exhale before speaking calms your nervous system.',
      'Reframe nerves as excitement; the body cannot tell the difference.',
      'Confidence comes from reps in low-stakes situations first.',
    ],
  },
  {
    id: 'confidence-body-language',
    title: 'Body Language That Projects Quiet Confidence',
    category: 'Body Language',
    emoji: '💪',
    readTimeMin: 5,
    summary:
      'Your posture talks before you do. Small physical adjustments shift how others — and you — perceive your authority.',
    playLevelId: 'level-2',
    sections: [
      {
        heading: 'Open posture',
        body: 'Keep shoulders back and relaxed, arms uncrossed. Open posture signals safety and readiness, and it also makes you feel more grounded.',
      },
      {
        heading: 'Eye contact',
        body: 'Aim for natural eye contact about 60–70% of the time. Hold for about 3–5 seconds per person before glancing away naturally.',
      },
      {
        heading: 'Slow down physically',
        body: 'Fast movements read as anxious. Speak at a measured pace and use deliberate hand gestures instead of fidgeting.',
      },
    ],
    takeaways: [
      'Open, uncrossed posture beats "fake confidence" poses.',
      'Eye contact at 60–70% is confident and natural.',
      'Slow, deliberate movement reads as calm authority.',
    ],
  },
  {
    id: 'public-speaking-structure',
    title: 'The Simple 3-Part Structure of Any Talk',
    category: 'Public Speaking',
    emoji: '📐',
    readTimeMin: 7,
    summary:
      'Hook, core message, close. Even a 60-second talk needs this skeleton to feel composed.',
    playLevelId: 'level-3',
    sections: [
      {
        heading: 'The hook',
        body: 'Open with a question, a surprising fact, or a tiny story in the first 10 seconds. Attention is won or lost immediately.',
      },
      {
        heading: 'The core message',
        body: 'Deliver one main point with 2–3 supporting ideas. Clarity beats volume — say one thing clearly rather than five things vaguely.',
      },
      {
        heading: 'The close',
        body: 'Summarize the takeaway in one line and stop. Running out of things to say reads as nervousness; a clean close reads as control.',
      },
    ],
    takeaways: [
      'Hook in the first 10 seconds.',
      'One core message beats five vague ones.',
      'Close cleanly — a tidy ending signals confidence.',
    ],
  },
  {
    id: 'interview-intro',
    title: 'Answering "Tell Me About Yourself"',
    category: 'Interview Skills',
    emoji: '🎯',
    readTimeMin: 8,
    summary:
      'The most common interview question — and the one people freeze on. A simple framework keeps it smooth.',
    playLevelId: 'level-2',
    sections: [
      {
        heading: 'The past-present-future formula',
        body: 'Structure your answer as: where you come from / past relevant work, what you do now, and what you want next. Keep it around 60–90 seconds.',
      },
      {
        heading: 'Make it about relevance',
        body: 'Pick 1–2 highlights that connect to the role. Recruiters remember relevance, not a biography.',
      },
      {
        heading: 'Practice out loud',
        body: 'Write your 3-sentence version, then rehearse it aloud 3 times. Even 60 seconds practiced beats 3 minutes of rambling.',
      },
    ],
    takeaways: [
      'Past → present → future is the classic, reliable frame.',
      'Tailor the highlights to the job you are applying for.',
      'Rehearse out loud; keep it tight (60–90 seconds).',
    ],
  },
  {
    id: 'interview-weakness',
    title: 'Turning Weaknesses Into Strengths',
    category: 'Interview Skills',
    emoji: '🔄',
    readTimeMin: 6,
    summary:
      'Nobody wants the humble-brag weakness. The trick is to name a real development area and show the system you built around it.',
    playLevelId: 'level-5',
    sections: [
      {
        heading: 'Pick a real but fixable weakness',
        body: 'Choose something true but not disqualifying — e.g., public speaking nerves, delegating too much detail. Avoid fake weaknesses like "I work too hard".',
      },
      {
        heading: 'Show the loop you closed',
        body: 'For each weakness, describe the action taken and the result. Example: "I used to take on too many small tasks myself — I now timebox and delegate, and shipped X faster."',
      },
      {
        heading: 'Keep it confident',
        body: 'Deliver it with calm, matter-of-fact energy. Confidence here means owning the growth, not apologizing for it.',
      },
    ],
    takeaways: [
      'Choose real, fixable weaknesses — never fake ones.',
      'Always pair the weakness with the action + result.',
      'Deliver it calmly; owning growth reads as confidence.',
    ],
  },
  {
    id: 'storytelling-star',
    title: 'The STAR Story Method',
    category: 'Storytelling',
    emoji: '📖',
    readTimeMin: 9,
    summary:
      'Stories are how humans remember — and interviews run on stories. STAR keeps yours crisp and credible.',
    playLevelId: 'level-6',
    sections: [
      {
        heading: 'Situation',
        body: 'Set the scene in one or two sentences. Context is enough; no long backstories.',
      },
      {
        heading: 'Task',
        body: 'What was your responsibility or the goal? Keep it short.',
      },
      {
        heading: 'Action',
        body: 'What you actually did, in your own words, with specifics. This is the heart of the story.',
      },
      {
        heading: 'Result',
        body: 'The measurable or meaningful outcome. If you lack numbers, use qualitative impact ("team hit deadline early").',
      },
    ],
    takeaways: [
      'STAR gives structure: Situation, Task, Action, Result.',
      'The Action is the heart — make it specific.',
      'End with a result, even if small.',
    ],
  },
  {
    id: 'public-speaking-hook',
    title: 'Writing an Opening Hook That Grabs Attention',
    category: 'Public Speaking',
    emoji: '🎣',
    readTimeMin: 6,
    summary:
      'You lose half your audience before you say your second sentence. A strong hook fixes that instantly.',
    playLevelId: 'level-7',
    sections: [
      {
        heading: 'Start with tension or curiosity',
        body: 'A question, a number, a mini-story. For example: "I once spent 6 months preparing for a talk that changed nothing." Curiosity beats agenda.',
      },
      {
        heading: 'Ditch throat-clearing',
        body: 'Avoid "So, um, today I want to talk about..." Open with the hook and let the topic follow naturally.',
      },
      {
        heading: 'Land it fast',
        body: 'Deliver the hook in under 15 seconds, then transition into your structure. Momentum kills awkwardness.',
      },
    ],
    takeaways: [
      'Hook in the first 10–15 seconds.',
      'Drop throat-clearing; go straight to the hook.',
      'Transition quickly into structure.',
    ],
  },
  {
    id: 'public-speaking-pacing',
    title: 'Speak Slower — Mean More',
    category: 'Public Speaking',
    emoji: '🐢',
    readTimeMin: 5,
    summary:
      'Fast talkers are usually nervous talkers. Slowing down is the single biggest delivery upgrade you can make.',
    playLevelId: 'level-6',
    sections: [
      {
        heading: 'Why slow is powerful',
        body: 'Slow speech signals control and confidence, and gives listeners time to absorb. Nervous speakers rush because they are anxious; calm speakers linger.',
      },
      {
        heading: 'Use pauses',
        body: 'Replace filler words ("um", "like") with silent pauses. One pause after an important point feels louder than any emphasis.',
      },
      {
        heading: 'Practice with a timer',
        body: 'Record yourself reading a 60-second script and check: are you finishing before the timer? Slow down to hit the target.',
      },
    ],
    takeaways: [
      'Nervous speakers speed up; calm speakers slow down.',
      'Replace fillers with purposeful pauses.',
      'Time yourself — deliberate slowness hits duration targets.',
    ],
  },
  {
    id: 'listening-active',
    title: 'Active Listening: The Skill Everyone Skips',
    category: 'Listening',
    emoji: '👂',
    readTimeMin: 7,
    summary:
      'Listening is a superpower in conversations, negotiations, and interviews. Most people listen to reply, not to understand.',
    playLevelId: null,
    sections: [
      {
        heading: 'Listen to understand, not to respond',
        body: 'Fight the urge to formulate your reply while the other person is talking. Take notes or paraphrase what you heard.',
      },
      {
        heading: 'Use the 2:1 rule',
        body: 'For every point the other person makes, ask at least one clarifying question before sharing your view.',
      },
      {
        heading: 'Paraphrase before disagreeing',
        body: '"So what you are saying is X — did I get that right?" This makes disagreement feel collaborative instead of combative.',
      },
    ],
    takeaways: [
      'Ask clarifying questions before rebutting.',
      'Paraphrase to confirm understanding before disagreeing.',
      'Listening builds trust faster than any rebuttal.',
    ],
  },
  {
    id: 'listening-disagree',
    title: 'Disagreeing Without Destroying the Conversation',
    category: 'Listening',
    emoji: '🤝',
    readTimeMin: 6,
    summary:
      'You can disagree and still be liked. The difference is delivery and framing.',
    playLevelId: null,
    sections: [
      {
        heading: 'Use "I" statements',
        body: 'Frame your view as your perspective: "I see it differently because..." instead of "You are wrong."',
      },
      {
        heading: 'Agree on the goal',
        body: 'Start from shared ground: "We both want this to work." Agreement on purpose makes disagreement on method safe.',
      },
      {
        heading: 'Separate idea from ego',
        body: 'Treat arguments as ideas to test, not attacks on identity. That keeps the convo productive.',
      },
    ],
    takeaways: [
      'Agree on the goal before disagreeing on the method.',
      'Use I-statements; avoid "you are wrong".',
      'Keep ideas and egos separate.',
    ],
  },
  {
    id: 'interview-avoid-questions',
    title: 'Handling Interview Questions You Don’t Know',
    category: 'Interview Skills',
    emoji: '❓',
    readTimeMin: 6,
    summary:
      'The panic question: "Why should we hire you?" Also: any curveball. Here is how to answer without freezing.',
    playLevelId: 'level-5',
    sections: [
      {
        heading: 'For "Why should we hire you"',
        body: 'Use a tight formula: relevant skill + past proof + enthusiasm. 30–45 seconds beats 2 minutes of rambling.',
      },
      {
        heading: 'For unknown questions',
        body: 'Buy time honestly: "Great question — let me think for a moment." Then structure your answer with a quick framework (STAR or past example).',
      },
      {
        heading: 'Bridge with experience',
        body: 'If you truly lack experience, bridge with transferable skills and learning speed. Honesty + speed beats bluffing.',
      },
    ],
    takeaways: [
      'Use skill + proof + enthusiasm for "hire you" answers.',
      'Buy time with "let me think", then structure the answer.',
      'Honesty plus learning speed beats bluffing.',
    ],
  },
  {
    id: 'confidence-boundaries',
    title: 'Saying No With Confidence',
    category: 'Confidence',
    emoji: '🛡️',
    readTimeMin: 6,
    summary:
      'Every strong communicator knows when to say no — and how to do it without guilt or drama.',
    playLevelId: 'level-9',
    sections: [
      {
        heading: 'Decide before you speak',
        body: 'Clarity comes from a decided answer. Vagueness creates anxiety; a calm "no" is powerful.',
      },
      {
        heading: 'Use the broken record politely',
        body: 'Repeat your boundary briefly if pressed: "I can’t take that on right now, but I can help next week."',
      },
      {
        heading: 'Reframe the cost',
        body: 'Saying no protects the relationships and work you actually care about. Protect your focus.',
      },
    ],
    takeaways: [
      'Decide your answer before the conversation starts.',
      'A calm, repeated "no" is a complete answer.',
      'Saying no protects focus and relationships.',
    ],
  },
];

export const getLessonById = (id: string): Lesson | undefined =>
  LEARN_LESSONS.find((l) => l.id === id);

export const getLessonsByCategory = (category: 'All' | LessonCategory): Lesson[] =>
  category === 'All' ? LEARN_LESSONS : LEARN_LESSONS.filter((l) => l.category === category);

export const getLessonsForPlayLevel = (playLevelId: string | null): Lesson[] =>
  playLevelId ? LEARN_LESSONS.filter((l) => l.playLevelId === playLevelId) : [];
