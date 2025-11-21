// Prompt Generator Module
// Handles deterministic template selection and token replacement

export interface UserProfile {
    name: string;
    role?: string; // e.g., 'founder', 'student', 'professional'
    goals?: string[]; // e.g., 'clarity', 'growth', 'content'
    style?: string; // e.g., 'casual', 'formal', 'structured'
    topics?: string[]; // Specific topics they want to cover
}

export interface PromptTemplate {
    id: string;
    role: string[];
    goal: string[];
    style: string[];
    variations: {
        short: string; // <= 60s
        medium: string; // 90-150s
        long: string; // 300-450s
    };
}

export interface GeneratedPrompts {
    short: string;
    medium: string;
    long: string;
    teleprompter: {
        short: string;
        medium: string;
        long: string;
    };
}

// 1. Templates Repository
const TEMPLATES: PromptTemplate[] = [
    {
        id: "daily-reflection-generic",
        role: ["any"],
        goal: ["clarity", "growth"],
        style: ["casual", "structured"],
        variations: {
            short: "Hi {name}, let's do a quick check-in. What is the one main thing you learned today about {topic1}? You have {duration_s} seconds. Go.",
            medium: "Hello {name}. Take a moment to breathe. Today, I want you to reflect on {topic1}. How did it impact your day? What challenges did you face, and how did you overcome them? Finally, what is your one-line takeaway: {one_line_takeaway}?",
            long: "Welcome back, {name}. Let's go deep today. We're focusing on {topic1}. Start by describing the situation in detail. How did it make you feel initially? Walk through your decision-making process. What alternatives did you consider? Now, looking back, what would you do differently? Conclude with a strong statement about how this experience contributes to your goal of {goal_primary}."
        }
    },
    {
        id: "founder-update",
        role: ["founder", "entrepreneur"],
        goal: ["content", "transparency"],
        style: ["professional", "engaging"],
        variations: {
            short: "Hey everyone, {name} here. Quick update on {topic1}. Here's what happened and why it matters. {one_line_takeaway}.",
            medium: "Hi guys, {name} from the team. I want to share a behind-the-scenes look at {topic1}. It wasn't easy. Here's the context... [Pause]. And here's the solution we found. If you're building something similar, remember: {one_line_takeaway}.",
            long: "This is {name}. Today I'm sharing a deep dive into {topic1}. This is something we've struggled with for a while. I'm going to break down the problem, our hypothesis, the experiment we ran, and the surprising results. Let's get into the data... [Pause]. So, what does this mean for the future? Here is my analysis..."
        }
    },
    {
        id: "student-learning",
        role: ["student", "learner"],
        goal: ["retention", "understanding"],
        style: ["structured", "academic"],
        variations: {
            short: "Self-test: Explain {topic1} in under 60 seconds as if teaching a beginner. Ready? Start.",
            medium: "Reflect on your study session about {topic1}. What were the key concepts? Connect {topic1} to something you already knew. How does this change your understanding of the subject?",
            long: "Let's consolidate your learning on {topic1}. First, summarize the main argument. Next, identify three supporting evidence points. Then, discuss a counter-argument or limitation. Finally, synthesize everything into a conclusion. This structure will help you master the material."
        }
    }
];

// 2. Helper: Select Template
function selectTemplate(profile: UserProfile): PromptTemplate {
    // Simple scoring system
    let bestMatch = TEMPLATES[0];
    let maxScore = -1;

    for (const template of TEMPLATES) {
        let score = 0;

        // Role match
        if (template.role.includes("any") || (profile.role && template.role.includes(profile.role))) {
            score += 2;
        }

        // Goal match
        if (profile.goals) {
            const goalMatch = profile.goals.some(g => template.goal.includes(g));
            if (goalMatch) score += 1;
        }

        // Style match
        if (profile.style && template.style.includes(profile.style)) {
            score += 1;
        }

        if (score > maxScore) {
            maxScore = score;
            bestMatch = template;
        }
    }

    return bestMatch;
}

// 3. Helper: Fill Tokens
function fillTokens(text: string, profile: UserProfile, duration: string): string {
    let filled = text;

    // {name}
    filled = filled.replace(/{name}/g, profile.name || "there");

    // {topic1} - Fallback logic
    const topic = profile.topics && profile.topics.length > 0
        ? profile.topics[0]
        : "your day";
    filled = filled.replace(/{topic1}/g, topic);

    // {duration_s}
    filled = filled.replace(/{duration_s}/g, duration);

    // {one_line_takeaway}
    filled = filled.replace(/{one_line_takeaway}/g, "what's the bottom line?");

    // {goal_primary}
    const goal = profile.goals && profile.goals.length > 0 ? profile.goals[0] : "growth";
    filled = filled.replace(/{goal_primary}/g, goal);

    return filled;
}

// 4. Helper: Teleprompter Formatter
export function generateTeleprompterLines(text: string, wpm: number = 150): string {
    // Average words per line for teleprompter is usually 3-5 words for readability
    // But here we just want line breaks for visual pacing
    const words = text.split(' ');
    let lines: string[] = [];
    let currentLine: string[] = [];

    for (const word of words) {
        currentLine.push(word);
        if (currentLine.length >= 5 || word.endsWith('.') || word.endsWith(',') || word.endsWith('?')) {
            lines.push(currentLine.join(' '));
            currentLine = [];
        }
    }
    if (currentLine.length > 0) lines.push(currentLine.join(' '));

    return lines.join('\n');
}

// 5. Main Generator Function
export function generatePrompts(profile: UserProfile): GeneratedPrompts {
    const template = selectTemplate(profile);

    const short = fillTokens(template.variations.short, profile, "60");
    const medium = fillTokens(template.variations.medium, profile, "120");
    const long = fillTokens(template.variations.long, profile, "300");

    return {
        short,
        medium,
        long,
        teleprompter: {
            short: generateTeleprompterLines(short),
            medium: generateTeleprompterLines(medium),
            long: generateTeleprompterLines(long)
        }
    };
}
