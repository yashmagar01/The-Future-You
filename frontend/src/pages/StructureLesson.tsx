// Lesson 6: Structuring your thoughts. Four short steps with text-only interactions.
import { useEffect, useState } from 'react'; // useState remembers values; useEffect runs code after render
import { Link } from 'react-router-dom'; // Link changes pages inside the app without a full reload
import { AppLayout } from '@/components/AppLayout'; // the frame: top bar + sidebar
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // ready-made card pieces
import { Button } from '@/components/ui/button'; // ready-made button
import { cn } from '@/lib/utils'; // cn joins class names and lets us swap colours per state

// The lesson id from learnLessons.ts, used for the progress key
const lessonId = 'structuring-your-thoughts'; // exact id of the "Structuring Your Thoughts" lesson

// One line of the ordering game, with its position in the correct order
type OrderLine = { id: string; text: string; order: number }; // id identifies it, order is 1 to 3

// The three lines shown shuffled (Example, Point, Reason); correct order is Point, Reason, Example
const lines: OrderLine[] = [ // the shuffled list for step 2
  { id: 'example', text: 'Example: last week a student cut her fillers from 8 to 2 per minute.', order: 3 }, // comes third
  { id: 'point', text: 'Point: practising short answers makes you clearer.', order: 1 }, // comes first
  { id: 'reason', text: 'Reason: short answers force you to pick your main idea.', order: 2 }, // comes second
]; // end of the shuffled list

const StructureLesson = () => { // the page: a function that returns UI
  const [step, setStep] = useState(0); // step = which part of the lesson we show, setStep changes it (starts at 0)
  const [opening, setOpening] = useState<'A' | 'B' | null>(null); // opening = chosen answer for the map question (starts none)
  const [placed, setPlaced] = useState<string[]>([]); // placed = ids of the lines placed so far, in order (starts empty)
  const [wrongTaps, setWrongTaps] = useState(0); // wrongTaps = number of wrong line taps (starts at 0)
  const [ending, setEnding] = useState<'A' | 'B' | null>(null); // ending = chosen answer for the ending question (starts none)
  const earnedThree = wrongTaps === 0 && ending === 'B'; // both conditions met
  const earnedTwo = (wrongTaps === 0) !== (ending === 'B'); // exactly one condition met
  const stars = earnedThree ? 3 : earnedTwo ? 2 : 1; // 3 for both, 2 for one, otherwise 1
  const xp = 10 + 5 * stars; // base 10 XP plus 5 per star

  useEffect(() => { // runs after render whenever step changes
    if (step !== 3) return; // only save when the lesson is finished
    try { // storage can throw (private mode, quota), so guard it
      localStorage.setItem(`learn:${lessonId}`, JSON.stringify({ done: true, stars, xp })); // save the result under the lesson id
    } catch { // ignore storage errors so the page never crashes
      // nothing to do: the lesson still works without saved progress
    } // end of try/catch
  }, [step, stars, xp]); // re-run if the step or the result changes

  const tapLine = (line: OrderLine) => { // called when a line is tapped
    if (placed.includes(line.id)) return; // already placed lines are locked
    if (line.order === placed.length + 1) { // is this the next correct line?
      setPlaced((prev) => [...prev, line.id]); // place it at the end of the order
    } else { // wrong line tapped
      setWrongTaps((prev) => prev + 1); // count the mistake
    } // end of the correct or wrong branch
  }; // end of tapLine

  return ( // what to draw
    <AppLayout>
      {/* AppLayout puts everything below into the main area (this is {children}) */}
      <div className="mx-auto max-w-xl">
        {/* centred column, not too wide */}
        {step === 0 && ( // only show this block while we are on step 0
          <Card>
            {/* one white card */}
            <CardHeader>
              <CardTitle>Which opening gives listeners a map?</CardTitle>
              {/* the card heading */}
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {/* the two options stacked */}
                <button
                  type="button" // plain button, no form submit
                  onClick={() => setOpening('A')} // remember option A
                  aria-pressed={opening === 'A'} // announces whether A is picked
                  className={cn(
                    'w-full rounded-lg border p-3 text-left text-sm leading-6 transition-colors', // small card, left aligned
                    opening === 'A' ? 'border-primary bg-primary/10' : 'border-input bg-background' // highlight the picked one
                  )}
                >
                  {/* option A card */}
                  So yeah, um, I wanted to talk about some stuff.
                  {/* option A text */}
                </button>
                <button
                  type="button" // plain button, no form submit
                  onClick={() => setOpening('B')} // remember option B
                  aria-pressed={opening === 'B'} // announces whether B is picked
                  className={cn(
                    'w-full rounded-lg border p-3 text-left text-sm leading-6 transition-colors', // small card, left aligned
                    opening === 'B' ? 'border-primary bg-primary/10' : 'border-input bg-background' // highlight the picked one
                  )}
                >
                  {/* option B card */}
                  I will cover three points: the problem, our fix and the result.
                  {/* option B text */}
                </button>
              </div>
              {opening !== null && ( // feedback only after a choice is made
                <p className={opening === 'B' ? 'mt-3 text-sm text-green-600' : 'mt-3 text-sm text-amber-600'}>
                  {/* green for B, amber for A */}
                  {opening === 'B'
                    ? 'Yes: a short map tells listeners where you are going.' // praise for B
                    : 'Look again: A gives no map, so listeners get lost.'} {/* nudge for A */}
                </p>
              )}
              <Button className="mt-6 w-full" disabled={opening === null} onClick={() => setStep(1)}>
                {/* next step; disabled until a choice is made */}
                Next
                {/* the button label */}
              </Button>
            </CardContent>
          </Card>
        )}
        {step === 1 && ( // only show this block while we are on step 1
          <Card>
            {/* one white card */}
            <CardHeader>
              <CardTitle>Build the answer: Point, Reason, Example</CardTitle>
              {/* the card heading */}
              <p className="text-sm text-muted-foreground">Tap the lines in the order they should be spoken.</p>
              {/* the instruction line */}
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {/* the three lines stacked */}
                {lines.map((line) => { // one button per line
                  const position = placed.indexOf(line.id); // -1 when not placed yet
                  const isPlaced = position !== -1; // shorthand for the check above
                  return (
                    <button
                      key={line.id} // stable id from the data
                      type="button" // plain button, no form submit
                      disabled={isPlaced} // placed lines can no longer be tapped
                      onClick={() => tapLine(line)} // tap places it or counts a mistake
                      className={cn(
                        'w-full rounded-lg border p-3 text-left text-sm leading-6 transition-colors', // small card, left aligned
                        isPlaced ? 'border-green-600 bg-green-100 text-green-900' : 'border-input bg-background' // green once placed
                      )}
                    >
                      {/* a number badge then the line text */}
                      {isPlaced ? `${position + 1}. ` : ''}{line.text}
                      {/* shows 1, 2 or 3 before placed lines */}
                    </button>
                  );
                })}
              </div>
              <p className="mt-4 text-sm font-medium">{placed.length}/3 placed</p>
              {/* how many lines are correctly placed */}
              {wrongTaps > 0 && ( // only show the warning when a wrong line was tapped
                <p className="text-sm text-red-600">
                  {/* red warning line (works for both 1 and N) */}
                  {wrongTaps} wrong taps: think Point first, then Reason, then Example.
                  {/* the warning text */}
                </p>
              )}
              <div className="mt-6 flex gap-2">
                {/* row holding Next and Start over */}
                <Button className="flex-1" disabled={placed.length < 3} onClick={() => setStep(2)}>
                  {/* next step; disabled until all three lines are placed */}
                  Next
                  {/* the button label */}
                </Button>
                <Button className="flex-1" variant="outline" onClick={() => setPlaced([])}>
                  {/* clears the order but keeps the wrong-tap count */}
                  Start over
                  {/* the button label */}
                </Button>
              </div>
              <Button className="mt-2 w-full" variant="ghost" onClick={() => setStep(0)}>
                {/* button that moves us back to step 0 */}
                Back
                {/* the button label */}
              </Button>
            </CardContent>
          </Card>
        )}
        {step === 2 && ( // only show this block while we are on step 2
          <Card>
            {/* one white card */}
            <CardHeader>
              <CardTitle>How should you end a short talk?</CardTitle>
              {/* the card heading */}
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {/* the two options stacked */}
                <button
                  type="button" // plain button, no form submit
                  onClick={() => setEnding('A')} // remember option A
                  aria-pressed={ending === 'A'} // announces whether A is picked
                  className={cn(
                    'w-full rounded-lg border p-3 text-left text-sm leading-6 transition-colors', // small card, left aligned
                    ending === 'A' ? 'border-primary bg-primary/10' : 'border-input bg-background' // highlight the picked one
                  )}
                >
                  {/* option A card */}
                  Just stop and say that's it
                  {/* option A text */}
                </button>
                <button
                  type="button" // plain button, no form submit
                  onClick={() => setEnding('B')} // remember option B
                  aria-pressed={ending === 'B'} // announces whether B is picked
                  className={cn(
                    'w-full rounded-lg border p-3 text-left text-sm leading-6 transition-colors', // small card, left aligned
                    ending === 'B' ? 'border-primary bg-primary/10' : 'border-input bg-background' // highlight the picked one
                  )}
                >
                  {/* option B card */}
                  Repeat your main point in one sentence and say what to do next
                  {/* option B text */}
                </button>
              </div>
              {ending !== null && ( // feedback only after a choice is made
                <p className={ending === 'B' ? 'mt-3 text-sm text-green-600' : 'mt-3 text-sm text-amber-600'}>
                  {/* green for B, amber for A */}
                  {ending === 'B'
                    ? 'Correct: a clear ending makes the message stick.' // praise for B
                    : 'Look again: a sudden stop leaves the message hanging.'} {/* nudge for A */}
                </p>
              )}
              <div className="mt-6 flex gap-2">
                {/* row holding Next and Back */}
                <Button className="flex-1" disabled={ending === null} onClick={() => setStep(3)}>
                  {/* next step; disabled until a choice is made */}
                  Next
                  {/* the button label */}
                </Button>
                <Button className="flex-1" variant="outline" onClick={() => setStep(1)}>
                  {/* button that moves us back to step 1 */}
                  Back
                  {/* the button label */}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        {step === 3 && ( // only show this block while we are on step 3
          <Card>
            {/* one white card */}
            <CardHeader>
              <CardTitle>Lesson complete!</CardTitle>
              {/* the card heading */}
            </CardHeader>
            <CardContent>
              <div className="text-center text-4xl" aria-label={`${stars} of 3 stars`}>
                {/* stars row: filled for earned, empty otherwise */}
                {[1, 2, 3].map((n) => (
                  <span key={n}>{n <= stars ? '★' : '☆'}</span> // one star per slot
                ))}
              </div>
              <div className="mt-2 text-center text-3xl font-bold">+{xp} XP</div>
              {/* total XP earned */}
              <div className="mt-6 space-y-2">
                {/* the three action buttons stacked */}
                <Button asChild className="w-full">
                  {/* styled as a button, renders a router link */}
                  <Link to="/record">Try it now</Link>
                  {/* goes to the recording page */}
                </Button>
                <Button asChild variant="outline" className="w-full">
                  {/* secondary styled link */}
                  <Link to="/learn">Back to lessons</Link>
                  {/* goes to the lessons list */}
                </Button>
                <Button
                  variant="ghost" // quiet look for replay
                  className="w-full" // full width
                  onClick={() => { setStep(0); setOpening(null); setPlaced([]); setWrongTaps(0); setEnding(null); }} // restart the whole lesson
                >
                  {/* resets step, choices, placed lines and wrong taps */}
                  Replay
                  {/* the button label */}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  ); // end of what we draw
}; // end of the page function

export default StructureLesson; // lets App.tsx import this page
