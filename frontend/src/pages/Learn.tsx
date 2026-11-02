// Learn mode landing page: renders lesson cards inside AppLayout.

// React Router link for lesson detail navigation.
import { Link } from 'react-router-dom';
// App shell with TopNav and Sidebar.
import { AppLayout } from '@/components/AppLayout';
// shadcn Card primitives.
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
// shadcn Badge for availability display.
import { Badge } from '@/components/ui/badge';
// shadcn Button for lesson actions.
import { Button } from '@/components/ui/button';
// Learn mode lesson catalog.
import { learnLessons } from '@/data/learnLessons';

// Learn mode page component showing lesson cards.
const Learn = () => {
  // Map over the catalog to render one card per lesson.
  return (
    <AppLayout>
      {/* Page heading block. */}
      <div className="mb-8">
        {/* Main heading. */}
        <h1 className="text-3xl font-bold">Learn</h1>
        {/* Supporting subtitle. */}
        <p className="text-muted-foreground">Pick a lesson to sharpen your communication skills.</p>
      </div>

      {/* Responsive grid of lesson cards. */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Render a card for each lesson. */}
        {learnLessons.map((lesson) => (
          <Card key={lesson.id}>
            {/* Card header with title and topic. */}
            <CardHeader>
              <CardTitle>{lesson.title}</CardTitle>
              <CardDescription>{lesson.topic}</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Availability badge. */}
              <Badge variant={lesson.available ? 'default' : 'secondary'}>
                {lesson.available ? 'Available' : 'Coming soon'}
              </Badge>
              {/* Lesson duration. */}
              <p className="mt-2 text-sm text-muted-foreground">{lesson.minutes} min</p>
            </CardContent>
            <CardFooter>
              {/* Link to lesson when available, else disabled state. */}
              {lesson.available ? (
                <Button asChild>
                  <Link to={`/learn/${lesson.id}`}>Start lesson</Link>
                </Button>
              ) : (
                <Button variant="outline" disabled>Coming soon</Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </AppLayout>
  );
};

// Default export for the /learn route.
export default Learn;
