// Lesson 5: Tone and expression. Four short steps with text-only interactions.
import { useEffect, useState } from 'react'; // useState remembers values; useEffect runs code after render
import { Link } from 'react-router-dom'; // Link changes pages inside the app without a full reload
import { AppLayout } from '@/components/AppLayout'; // the frame: top bar + sidebar
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // ready-made card pieces
import { Button } from '@/components/ui/button'; // ready-made button
import { cn } from '@/lib/utils'; // cn joins class names and lets us swap colours per state

// The lesson id from learnLessons.ts, used for the progress key
const lessonId = 'tone-and-expression'; // exact id of the "Tone and Expression" lesson

// The six habits, marked as expressive (good) or flattening (bad)
const chips: { text: string; good: boolean }[] = [ // the chip list for step 2
  { text: 'Smiling as you greet', good: true }, // good: warmth shows
  { text: 'Monotone voice', good: false }, // bad: no variation
  { text: 'Raising pitch on key words', good: true }, // good: emphasises meaning
  { text: 'Frowning while explaining', good: false }, // bad: looks negative
  { text: 'Varying your pace', good: true }, // good: keeps attention
  { text: 'Reading in one flat note', good: false }, // bad: sounds robotic
]; // end of the chip list

const ToneLesson = () => { // the page: a function that returns UI
  const [step, setStep] = useState(0); // step = which part of the lesson we show, setStep changes it (starts at 0)
  const [delivery, setDelivery] = useState<'flat' | 'warm' | 'rushed' | null>(null); // delivery = chosen answer for the opening question (starts none)
  const [tappedChips, setTappedChips] = useState<number[]>([]); // indexes of the tapped chips (starts empty)
  const [answer, setAnswer] = useState<'A' | 'B' | null>(null); // answer = chosen option for the good-news question (starts none)
  const foundCount = chips.filter((chip, i) => chip.good && tappedChips.includes(i)).length; // expressive habits found
  const goodTotal = chips.filter((chip) => chip.good).length; // total expressive habits to find
  const wrongTaps = chips.filter((chip, i) => !chip.good && tappedChips.includes(i)).length; // flattening habits tapped by mistake
  const earnedThree = wrongTaps === 0 && answer === 'B'; // both conditions met
  const earnedTwo = (wrongTaps === 0) !== (answer === 'B'); // exactly one condition met
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

  const toggleChip = (index: number) => { // called when a chip is clicked
    setTappedChips((prev) => (prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index])); // remove it if already tapped, otherwise add it
  }; // end of toggleChip

  return ( // what to draw
    <AppLayout>
      {/* AppLayout puts everything below into the main area (this is {children}) */}
      <div className="mx-auto max-w-xl">
        {/* centred column, not too wide */}
        {step === 0 && ( // only show this block while we are on step 0
          <Card>
            {/* one white card */}
            <CardHeader>
              <CardTitle>Which way of saying 'Thanks for coming' sounds friendliest?</CardTitle>
              {/* the card heading */}
              <p className="text-sm text-muted-foreground">Pick the delivery you would use.</p>
              {/* the question prompt */}
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {/* the three options stacked */}
                <button
                  type="button" // plain button, no form submit
                  onClick={() => setDelivery('flat')} // remember this option
                  aria-pressed={delivery === 'flat'} // announces whether this option is picked
                  className={cn(
                    'w-full rounded-lg border p-3 text-left text-sm leading-6 transition-colors', // small card, left aligned
                    delivery === 'flat' ? 'border-primary bg-primary/10' : 'border-input bg-background' // highlight the picked one
                  )}
                >
                  {/* option card */}
                  Flat voice, no smile
                  {/* option text */}
                </button>
                <button
                  type="button" // plain button, no form submit
                  onClick={() => setDelivery('warm')} // remember this option
                  aria-pressed={delivery === 'warm'} // announces whether this option is picked
                  className={cn(
                    'w-full rounded-lg border p-3 text-left text-sm leading-6 transition-colors', // small card, left aligned
                    delivery === 'warm' ? 'border-primary bg-primary/10' : 'border-input bg-background' // highlight the picked one
                  )}
                >
                  {/* option card */}
                  Warm voice with a smile
                  {/* option text */}
                </button>
                <button
                  type="button" // plain button, no form submit
                  onClick={() => setDelivery('rushed')} // remember this option
                  aria-pressed={delivery === 'rushed'} // announces whether this option is picked
                  className={cn(
                    'w-full rounded-lg border p-3 text-left text-sm leading-6 transition-colors', // small card, left aligned
                    delivery === 'rushed' ? 'border-primary bg-primary/10' : 'border-input bg-background' // highlight the picked one
                  )}
                >
                  {/* option card */}
                  Fast, while looking away
                  {/* option text */}
                </button>
              </div>
              {delivery !== null && ( // feedback only after a choice is made
                <p className={delivery === 'warm' ? 'mt-3 text-sm text-green-600' : 'mt-3 text-sm text-amber-600'}>
                  {/* green for the warm delivery, amber for the others */}
                  {delivery === 'warm'
                    ? 'Yes: a warm voice and a smile make people feel welcome.' // praise for the correct delivery
                    : 'Look again: that delivery sounds cold or rushed.'} {/* nudge for the other deliveries */}
                </p>
              )}
              <Button className="mt-6 w-full" disabled={delivery === null} onClick={() => setStep(1)}>
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
              <CardTitle>What makes a voice expressive?</CardTitle>
              {/* the card heading */}
              <p className="text-sm text-muted-foreground">Tap the habits that bring your voice to life.</p>
              {/* the instruction line */}
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {/* the chips wrap onto multiple lines */}
                {chips.map((chip, index) => ( // one chip per habit
                  <button
                    key={index} // React needs a stable key
                    type="button" // plain button, no form submit
                    aria-pressed={tappedChips.includes(index)} // announces whether this chip is tapped
                    onClick={() => toggleChip(index)} // tap toggles this chip
                    className={cn(
                      'rounded-full border px-3 py-2 text-sm font-medium transition-colors', // small pill chip
                      tappedChips.includes(index) // has the learner tapped it?
                        ? chip.good
                          ? 'border-green-600 bg-green-100 text-green-900' // tapped expressive habit: found
                          : 'border-red-600 bg-red-100 text-red-900' // tapped flattening habit: wrong tap
                        : 'border-input bg-muted text-muted-foreground' // untapped: grey
                    )}
                  >
                    {/* the chip label */}
                    {chip.text}
                    {/* the habit text */}
                  </button>
                ))}
              </div>
              <p className="mt-4 text-sm font-medium">{foundCount}/{goodTotal} expressive habits found</p>
              {/* how many expressive habits were found */}
              {wrongTaps > 0 && ( // only show the warning when a flattening habit was tapped
                <p className="text-sm text-red-600">
                  {/* red warning line */}
                  {wrongTaps === 1 // singular wording for one wrong tap
                    ? '1 wrong tap: that one flattens your voice.' // message for exactly one wrong tap
                    : `${wrongTaps} wrong taps: those flatten your voice.`} {/* message for two or more */}
                </p>
              )}
              <p className="mt-2 text-sm text-muted-foreground">Smile, vary your pitch and change your pace.</p>
              {/* the explanation line */}
              <div className="mt-6 flex gap-2">
                {/* row holding Next and Back */}
                <Button className="flex-1" disabled={foundCount < goodTotal} onClick={() => setStep(2)}>
                  {/* next step; disabled until all expressive habits are found */}
                  Next
                  {/* the button label */}
                </Button>
                <Button className="flex-1" variant="outline" onClick={() => setStep(0)}>
                  {/* button that moves us back to step 0 */}
                  Back
                  {/* the button label */}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        {step === 2 && ( // only show this block while we are on step 2
          <Card>
            {/* one white card */}
            <CardHeader>
              <CardTitle>How should you deliver good news?</CardTitle>
              {/* the card heading */}
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {/* the two options stacked */}
                <button
                  type="button" // plain button, no form submit
                  onClick={() => setAnswer('A')} // remember option A
                  aria-pressed={answer === 'A'} // announces whether A is picked
                  className={cn(
                    'w-full rounded-lg border p-3 text-left text-sm leading-6 transition-colors', // small card, left aligned
                    answer === 'A' ? 'border-primary bg-primary/10' : 'border-input bg-background' // highlight the picked one
                  )}
                >
                  {/* option A card */}
                  In the same flat tone as everything else
                  {/* option A text */}
                </button>
                <button
                  type="button" // plain button, no form submit
                  onClick={() => setAnswer('B')} // remember option B
                  aria-pressed={answer === 'B'} // announces whether B is picked
                  className={cn(
                    'w-full rounded-lg border p-3 text-left text-sm leading-6 transition-colors', // small card, left aligned
                    answer === 'B' ? 'border-primary bg-primary/10' : 'border-input bg-background' // highlight the picked one
                  )}
                >
                  {/* option B card */}
                  Let your voice rise and smile as you say it
                  {/* option B text */}
                </button>
              </div>
              {answer !== null && ( // feedback only after a choice is made
                <p className={answer === 'B' ? 'mt-3 text-sm text-green-600' : 'mt-3 text-sm text-amber-600'}>
                  {/* green for B, amber for A */}
                  {answer === 'B'
                    ? 'Correct: your tone should match the message.' // praise for B
                    : 'Look again: flat delivery hides good news.'} {/* nudge for A */}
                </p>
              )}
              <div className="mt-6 flex gap-2">
                {/* row holding Next and Back */}
                <Button className="flex-1" disabled={answer === null} onClick={() => setStep(3)}>
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
                  onClick={() => { setStep(0); setDelivery(null); setTappedChips([]); setAnswer(null); }} // restart the whole lesson
                >
                  {/* resets step, choices and tapped chips */}
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

export default ToneLesson; // lets App.tsx import this page
