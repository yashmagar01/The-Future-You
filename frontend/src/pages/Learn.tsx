import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  LEARN_LESSONS,
  LEARN_CATEGORIES,
  getLessonById,
  getLessonsByCategory,
  type Lesson,
  type LessonCategory,
} from '@/data/learnLessons';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  Play,
} from 'lucide-react';

export default function Learn() {
  const [category, setCategory] = useState<'All' | LessonCategory>('All');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const navigate = useNavigate();

  const lessons = useMemo(() => getLessonsByCategory(category), [category]);
  const selected = selectedId ? getLessonById(selectedId) ?? null : null;

  const startPractice = (lesson: Lesson) => {
    if (lesson.playLevelId) {
      navigate(`/record?level=${lesson.playLevelId}`);
    } else {
      navigate('/play');
    }
  };

  /* ------------------------- Lesson Detail ------------------------- */
  if (selected) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Button
            variant="ghost"
            size="sm"
            className="mb-6 text-muted-foreground hover:text-foreground"
            onClick={() => setSelectedId(null)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Lessons
          </Button>

          <div className="animate-fade-in">
            <div className="flex items-center gap-4 mb-3">
              <div className="text-5xl">{selected.emoji}</div>
              <div>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  <BookOpen className="h-3 w-3" /> {selected.category}
                </span>
                <h1 className="text-3xl font-bold mt-1">{selected.title}</h1>
                <p className="text-muted-foreground text-sm flex items-center gap-1 mt-1">
                  <Clock className="h-3.5 w-3.5" /> {selected.readTimeMin} min read
                  {selected.playLevelId && (
                    <span className="ml-2 text-primary font-semibold">· Linked to Play Level</span>
                  )}
                </p>
              </div>
            </div>

            <p className="text-lg text-muted-foreground mb-8">{selected.summary}</p>

            {/* Article sections */}
            <div className="space-y-6 mb-10">
              {selected.sections.map((section, idx) => (
                <div key={section.heading}>
                  <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
                    <span className="text-primary">{idx + 1}.</span> {section.heading}
                  </h2>
                  <p className="text-foreground/90 leading-relaxed">{section.body}</p>
                </div>
              ))}
            </div>

            {/* Takeaways */}
            <Card className="mb-8 bg-accent/5 border-accent/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-accent" /> Key Takeaways
                </CardTitle>
                <CardDescription>Lock these in before you go practice.</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {selected.takeaways.map((t) => (
                    <li key={t} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                className="bg-brand-green text-white hover:bg-brand-green/90"
                onClick={() => startPractice(selected)}
              >
                <Play className="h-4 w-4 mr-2" /> Start This in Play Mode
              </Button>
              <Button variant="outline" onClick={() => setSelectedId(null)}>
                More Lessons <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  /* ------------------------- Lesson List ------------------------- */
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold mb-2">Learn Mode</h1>
          <p className="text-muted-foreground text-lg">
            Knowledge before action. Read the lesson, then go practice it in Play Mode.
          </p>
        </div>

        {/* Category pills */}
        <div className="flex flex-wrap gap-2 mb-8">
          {LEARN_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                category === cat
                  ? 'bg-brand-green text-white shadow-md shadow-emerald-500/25'
                  : 'bg-muted text-muted-foreground hover:bg-muted/70'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Lesson grid */}
        {lessons.length === 0 ? (
          <p className="text-muted-foreground">No lessons in this category yet.</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {lessons.map((lesson) => (
              <Card
                key={lesson.id}
                className="hover-lift border-border/50 cursor-pointer transition-all duration-300"
                onClick={() => setSelectedId(lesson.id)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="text-3xl">{lesson.emoji}</div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      <BookOpen className="h-3 w-3" /> {lesson.category}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold mb-2">{lesson.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{lesson.summary}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> {lesson.readTimeMin} min
                    </span>
                    {lesson.playLevelId && <span className="text-primary font-semibold">Play-linked</span>}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      startPractice(lesson);
                    }}
                  >
                    <Play className="h-4 w-4 mr-2" /> Start Practice
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Cross-link to Play */}
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground mb-3">Done reading? Time to practice.</p>
          <Button asChild className="bg-brand-green text-white hover:bg-brand-green/90">
            <Link to="/play">
              Go to Play Mode <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </Layout>
  );
}
