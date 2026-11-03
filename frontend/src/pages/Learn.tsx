// Learn mode landing page: renders lesson cards inside AppLayout.

// React hooks: useEffect loads saved progress, useState keeps it in memory.
import { useEffect, useState } from 'react';
// React Router link for lesson detail navigation.
import { Link } from 'react-router-dom';
// App shell with TopNav and Sidebar.
import { AppLayout } from '@/components/AppLayout';
// shadcn Card primitives.
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
// shadcn Badge for availability and completion display.
import { Badge } from '@/components/ui/badge';
// shadcn Button for lesson actions.
import { Button } from '@/components/ui/button';
// Learn mode lesson catalog.
import { learnLessons } from '@/data/learnLessons';

// Saved progress for one lesson, as written by FillerWordsLesson on completion.
interface LessonProgress {
  done?: boolean; // true once the lesson is finished
  stars?: number; // stars earned, 1 to 3
  xp?: number; // XP earned
}

// Progress for every lesson, keyed by lesson id.
type ProgressMap = Record<string, LessonProgress>;

// Learn mode page component showing lesson cards.
const Learn = () => {
  // Saved progress per lesson id; starts empty so the first paint has no badges.
  const [progress, setProgress] = useState<ProgressMap>({});
  // Count of lessons marked done, used for the "X of 6" line.
  const doneCount = learnLessons.filter((lesson) => progress[lesson.id]?.done).length;
  // Read saved progress once after the first render.
  useEffect(() => {
    // Build the map here so a bad entry never breaks the page.
    const next: ProgressMap = {};
    // Check each lesson in the catalog.
    learnLessons.forEach((lesson) => {
      // Storage can throw (private mode, blocked cookies), so guard every read.
      try {
        // Read the raw JSON string for this lesson.
        const raw = localStorage.getItem(`learn:${lesson.id}`);
        // Only parse when something was actually saved.
        if (raw) next[lesson.id] = JSON.parse(raw) as LessonProgress;
      } catch {
        // Ignore broken JSON or storage errors and treat the lesson as not done.
      }
    });
    // Hand the collected map to state so the cards re-render.
    setProgress(next);
    // Empty dependency list: run this once on mount.
  }, []);

  // Render the page.
  return (
    <AppLayout>
      {/* Page heading block. */}
      <div className="mb-8">
        {/* Main heading. */}
        <h1 className="text-3xl font-bold">Learn</h1>
        {/* Supporting subtitle. */}
        <p className="text-muted-foreground">Pick a lesson to sharpen your communication skills.</p>
        {/* Overall progress line. */}
        <p className="mt-1 text-sm font-medium text-muted-foreground">{doneCount} of {learnLessons.length} lessons completed</p>
      </div>

      {/* Responsive grid of lesson cards. */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Render a card for each lesson. */}
        {learnLessons.map((lesson) => {
          // Progress for this specific lesson, if any.
          const saved = progress[lesson.id];
          // True when this lesson has been finished.
          const isDone = saved?.done === true;
          // Stars to fill; falls back to 0 when missing or invalid.
          const stars = Math.min(3, Math.max(0, Math.round(saved?.stars ?? 0)));
          // One card per lesson, keyed by id.
          return (
            <Card key={lesson.id}>
              {/* Card header with title and topic. */}
              <CardHeader>
                <CardTitle>{lesson.title}</CardTitle>
                <CardDescription>{lesson.topic}</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Badge changes once the lesson is completed. */}
                {isDone ? (
                  <div className="flex items-center gap-2">
                    {/* Green completion badge. */}
                    <Badge className="bg-green-600 text-white hover:bg-green-600">Completed</Badge>
                    {/* Stars row: filled for earned, empty for not. */}
                    <span aria-label={`${stars} of 3 stars`} className="text-amber-500">
                      {[1, 2, 3].map((n) => (
                        <span key={n}>{n <= stars ? '★' : '☆'}</span>
                      ))}
                    </span>
                  </div>
                ) : (
                  <Badge variant={lesson.available ? 'default' : 'secondary'}>
                    {lesson.available ? 'Available' : 'Coming soon'}
                  </Badge>
                )}
                {/* Lesson duration. */}
                <p className="mt-2 text-sm text-muted-foreground">{lesson.minutes} min</p>
              </CardContent>
              <CardFooter>
                {/* Link to lesson when available, else disabled state. */}
                {lesson.available ? (
                  <Button asChild>
                    <Link to={`/learn/${lesson.id}`}>{isDone ? 'Replay lesson' : 'Start lesson'}</Link>
                  </Button>
                ) : (
                  <Button variant="outline" disabled>Coming soon</Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </AppLayout>
  );
};

// Default export for the /learn route.
export default Learn;
