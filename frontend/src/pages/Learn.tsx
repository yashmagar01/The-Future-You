// Learn mode landing page: the redesigned lesson path inside AppLayout.
import { useEffect, useState } from 'react'; // hooks: load saved progress once and keep it in state
import { Link } from 'react-router-dom'; // Link for in-app navigation, never <a href>
import { // lucide icons used on the lesson tiles
  BookOpen, // fallback icon for unknown lesson ids
  Clock3, // icon for the pace lesson
  LucideIcon, // type for an icon component
  MessageCircle, // icon for the filler words lesson
  Mic2, // icon for the voice lesson
  Sparkles, // icon for the tone lesson
  Users, // icon for the posture lesson
} from 'lucide-react';
import { AppLayout } from '@/components/AppLayout'; // app shell with top bar and sidebar
import { Card } from '@/components/ui/card'; // simple card container
import { Button } from '@/components/ui/button'; // shadcn button, green via className
import { Badge } from '@/components/ui/badge'; // small status tag
import { learnLessons } from '@/data/learnLessons'; // the real lesson catalog
import { cn } from '@/lib/utils'; // cn joins class names

// Saved progress shape written by each lesson on completion.
interface LessonProgress {
  done?: boolean; // true once the lesson is finished
  stars?: number; // stars earned, 0 to 3
  xp?: number; // XP earned
}
// Progress for every lesson, keyed by lesson id.
type ProgressMap = Record<string, LessonProgress>;
// One entry of the icon lookup.
type IconMap = Record<string, LucideIcon>;

// Icon per lesson id; unknown ids fall back to BookOpen at render time.
const lessonIcons: IconMap = {
  'cutting-filler-words': MessageCircle, // filler words lesson icon
  'finding-your-pace': Clock3, // pacing lesson icon
  'posture-and-body-language': Users, // posture lesson icon
  'voice-energy-and-volume': Mic2, // voice lesson icon
  'tone-and-expression': Sparkles, // tone lesson icon
  'structuring-your-thoughts': BookOpen, // structure lesson icon
};

// Tile colour classes per lesson id, so colours never depend on list order.
const lessonTiles: Record<string, string> = {
  'cutting-filler-words': 'bg-rose-100 text-rose-600', // warm rose tile
  'finding-your-pace': 'bg-sky-100 text-sky-600', // cool sky tile
  'posture-and-body-language': 'bg-violet-100 text-violet-600', // violet tile
  'voice-energy-and-volume': 'bg-amber-100 text-amber-600', // amber tile
  'tone-and-expression': 'bg-fuchsia-100 text-fuchsia-600', // fuchsia tile
  'structuring-your-thoughts': 'bg-emerald-100 text-emerald-600', // emerald tile
};
// Tile colour for a lesson id, with a neutral default.
const tileClassFor = (id: string) => lessonTiles[id] ?? 'bg-muted text-muted-foreground';
// Icon component for a lesson id, with a neutral default.
const iconFor = (id: string) => lessonIcons[id] ?? BookOpen;

const Learn = () => { // the page: a function that returns UI
  // Saved progress per lesson id; starts empty so the first paint has no tags.
  const [progress, setProgress] = useState<ProgressMap>({});
  // How many lessons are done, for the progress card.
  const doneCount = learnLessons.filter((lesson) => progress[lesson.id]?.done).length;
  // Percent of the path finished; guarded against dividing by zero.
  const percent = learnLessons.length === 0
    ? 0 // nothing to divide by
    : Math.round((doneCount / learnLessons.length) * 100); // rounded share of done lessons

  // Read saved progress once after the first render.
  useEffect(() => {
    // Build the map locally so one bad entry never breaks the page.
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
  }, []); // empty list: run once on mount

  return ( // what to draw
    <AppLayout>
      {/* single content column, centred and capped in width */}
      <div className="mx-auto max-w-6xl">
        {/* small pill above the heading */}
        <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          {/* pill text */}
          Your learning path
        </span>
        {/* big page heading */}
        <h1 className="mt-4 text-4xl font-bold tracking-tight">Learn</h1>
        {/* one-line explanation under the heading */}
        <p className="mt-2 text-muted-foreground">
          Short lessons that make you clearer and more confident on camera.
        </p>

        {/* progress card with the percent bar */}
        <Card className="mt-8 p-6">
          {/* row holding the numbers and the percent */}
          <div className="flex items-center justify-between gap-4">
            {/* left side: what the bar means */}
            <div>
              {/* small caption */}
              <p className="text-sm font-medium text-muted-foreground">Your progress</p>
              {/* count line */}
              <p className="mt-1 text-lg font-semibold">
                {doneCount} of {learnLessons.length} lessons completed
              </p>
            </div>
            {/* right side: percent number */}
            <span className="text-3xl font-bold">{percent}%</span>
          </div>
          {/* grey bar behind */}
          <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-muted">
            {/* green bar fills to the percent */}
            <div
              className="h-full bg-green-500 transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>
        </Card>

        {/* row label above the grid */}
        <div className="mt-10 flex items-center justify-between">
          {/* section title */}
          <h2 className="text-lg font-semibold">All lessons</h2>
          {/* count of lessons in the catalog */}
          <span className="text-sm text-muted-foreground">{learnLessons.length} lessons</span>
        </div>

        {/* responsive grid of lesson cards */}
        <div className="mt-4 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {/* one card per lesson in the real catalog */}
          {learnLessons.map((lesson) => {
            // progress saved for this lesson, if any
            const saved = progress[lesson.id];
            // true when this lesson has been finished
            const isDone = saved?.done === true;
            // stars clamped to 0..3 (kept from the previous version)
            const stars = Math.min(3, Math.max(0, Math.round(saved?.stars ?? 0)));
            // icon component chosen by lesson id
            const Icon = iconFor(lesson.id);
            // tag shown in the card corner
            const tag = isDone ? 'Complete' : lesson.available ? 'Available' : 'Coming soon';
            // tag colours per state
            const tagClass = isDone
              ? 'bg-green-100 text-green-700 hover:bg-green-100' // done
              : lesson.available
                ? 'bg-sky-100 text-sky-700 hover:bg-sky-100' // open
                : 'bg-muted text-muted-foreground hover:bg-muted'; // locked
            return (
              <Card
                key={lesson.id}
                className="flex flex-col p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
              >
                {/* top row: icon tile and status tag */}
                <div className="flex items-start justify-between">
                  {/* coloured icon tile */}
                  <span className={cn('flex h-11 w-11 items-center justify-center rounded-xl', tileClassFor(lesson.id))}>
                    {/* the lesson icon */}
                    <Icon className="h-5 w-5" />
                  </span>
                  {/* status tag */}
                  <Badge className={tagClass}>{tag}</Badge>
                </div>
                {/* lesson title */}
                <h3 className="mt-4 text-base font-semibold">{lesson.title}</h3>
                {/* lesson topic */}
                <p className="mt-1 text-sm text-muted-foreground">{lesson.topic}</p>
                {/* stars and duration row */}
                <div className="mt-3 flex items-center justify-between text-sm">
                  {/* stars only when completed */}
                  <span
                    aria-label={`${stars} of 3 stars`}
                    className={isDone ? 'text-amber-500' : 'text-muted-foreground/40'}
                  >
                    {[1, 2, 3].map((n) => (
                      <span key={n}>{isDone && n <= stars ? '★' : '☆'}</span>
                    ))}
                  </span>
                  {/* lesson length */}
                  <span className="text-muted-foreground">{lesson.minutes} min</span>
                </div>
                {/* action area pushed to the card bottom */}
                <div className="mt-5">
                  {isDone ? (
                    <Button asChild variant="outline" className="w-full">
                      {/* replay link for a finished lesson */}
                      <Link to={`/learn/${lesson.id}`}>Replay lesson</Link>
                    </Button>
                  ) : lesson.available ? (
                    <Button
                      asChild
                      className="w-full bg-green-600 text-white hover:bg-green-700"
                    >
                      {/* green start button for an open lesson */}
                      <Link to={`/learn/${lesson.id}`}>Start lesson</Link>
                    </Button>
                  ) : (
                    <Button variant="outline" disabled className="w-full">
                      {/* locked lesson */}
                      Coming soon
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </AppLayout>
  ); // end of what we draw
}; // end of the page function

// Default export for the /learn route.
export default Learn;
