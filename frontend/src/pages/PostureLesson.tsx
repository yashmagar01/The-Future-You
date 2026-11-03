// Lesson 3: Posture and body language. Four short steps with text-only interactions.
import { useEffect, useState } from 'react'; // useState remembers values; useEffect runs code after render
import { Link } from 'react-router-dom'; // Link changes pages inside the app without a full reload
import { AppLayout } from '@/components/AppLayout'; // the frame: top bar + sidebar
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // ready-made card pieces
import { Button } from '@/components/ui/button'; // ready-made button
import { cn } from '@/lib/utils'; // cn joins class names and lets us swap colours per state

// The six habits or helpful behaviours, marked as bad or useful
const chips: { text: string; bad: boolean }[] = [ // the chip list for step 2
  { text: 'Swaying side to side', bad: true }, // bad: nervous movement
  { text: 'Looking at the camera lens', bad: false }, // good: simulated eye contact
  { text: 'Fidgeting with your hands', bad: true }, // bad: restless movement
  { text: 'Relaxed open gestures', bad: false }, // good: natural expression
  { text: 'Looking down at the floor', bad: true }, // bad: weak eye contact
  { text: 'Shoulders relaxed', bad: false }, // good: calm posture
]; // end of the chip list

const PostureLesson = () => { // the page: a function that returns UI
  const [step, setStep] = useState(0); // step = which part of the lesson we show, setStep changes it (starts at 0)
  const [stance, setStance] = useState<'slouched' | 'upright' | 'stiff' | null>(null); // stance = chosen answer for the opening question (starts none)
  const [tappedChips, setTappedChips] = useState<number[]>([]); // indexes of the tapped chips (starts empty)
  const [look, setLook] = useState<'A' | 'B' | null>(null); // look = chosen answer for the eye-contact question (starts none)
  const foundCount = chips.filter((chip, i) => chip.bad && tappedChips.includes(i)).length; // bad habits found
  const badTotal = chips.filter((chip) => chip.bad).length; // total bad habits to find
  const wrongTaps = chips.filter((chip, i) => !chip.bad && tappedChips.includes(i)).length; // helpful behaviours tapped by mistake
  const earnedThree = wrongTaps === 0 && look === 'B'; // both conditions met
  const earnedTwo = (wrongTaps === 0) !== (look === 'B'); // exactly one condition met
  const stars = earnedThree ? 3 : earnedTwo ? 2 : 1; // 3 for both, 2 for one, otherwise 1
  const xp = 10 + 5 * stars; // base 10 XP plus 5 per star

  useEffect(() => { // runs after render whenever step changes
    if (step !== 3) return; // only save when the lesson is finished
    try { // storage can throw (private mode, quota), so guard it
      localStorage.setItem('learn:posture-and-body-language', JSON.stringify({ done: true, stars, xp })); // save the result
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
              <CardTitle>Which stance looks most confident?</CardTitle>
              {/* the card heading */}
              <p className="text-sm text-muted-foreground">Pick the stance you would use on camera.</p>
              {/* the question prompt */}
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {/* the three options stacked */}
                <button
                  type="button" // plain button, no form submit
                  onClick={() => setStance('slouched')} // remember this option
                  aria-pressed={stance === 'slouched'} // announces whether this option is picked
                  className={cn(
                    'w-full rounded-lg border p-3 text-left text-sm leading-6 transition-colors', // small card, left aligned
                    stance === 'slouched' ? 'border-primary bg-primary/10' : 'border-input bg-background' // highlight the picked one
                  )}
                >
                  {/* option card */}
                  Slouched, shoulders forward
                  {/* option text */}
                </button>
                <button
                  type="button" // plain button, no form submit
                  onClick={() => setStance('upright')} // remember this option
                  aria-pressed={stance === 'upright'} // announces whether this option is picked
                  className={cn(
                    'w-full rounded-lg border p-3 text-left text-sm leading-6 transition-colors', // small card, left aligned
                    stance === 'upright' ? 'border-primary bg-primary/10' : 'border-input bg-background' // highlight the picked one
                  )}
                >
                  {/* option card */}
                  Upright, shoulders relaxed
                  {/* option text */}
                </button>
                <button
                  type="button" // plain button, no form submit
                  onClick={() => setStance('stiff')} // remember this option
                  aria-pressed={stance === 'stiff'} // announces whether this option is picked
                  className={cn(
                    'w-full rounded-lg border p-3 text-left text-sm leading-6 transition-colors', // small card, left aligned
                    stance === 'stiff' ? 'border-primary bg-primary/10' : 'border-input bg-background' // highlight the picked one
                  )}
                >
                  {/* option card */}
                  Stiff, arms locked at the sides
                  {/* option text */}
                </button>
              </div>
              {stance !== null && ( // feedback only after a choice is made
                <p className={stance === 'upright' ? 'mt-3 text-sm text-green-600' : 'mt-3 text-sm text-amber-600'}>
                  {/* green for the best stance, amber for the others */}
                  {stance === 'upright'
                    ? 'Yes: upright and relaxed looks calm and confident.' // praise for the correct stance
                    : 'Look again: that stance looks tense or tired.'} {/* nudge for the other stances */}
                </p>
              )}
              <Button className="mt-6 w-full" disabled={stance === null} onClick={() => setStep(1)}>
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
              <CardTitle>Spot the bad habits</CardTitle>
              {/* the card heading */}
              <p className="text-sm text-muted-foreground">Tap the habits that make you look less confident.</p>
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
                        ? chip.bad
                          ? 'border-green-600 bg-green-100 text-green-900' // tapped bad habit: found
                          : 'border-red-600 bg-red-100 text-red-900' // tapped good habit: wrong tap
                        : 'border-input bg-muted text-muted-foreground' // untapped: grey
                    )}
                  >
                    {/* the chip label */}
                    {chip.text}
                    {/* the habit text */}
                  </button>
                ))}
              </div>
              <p className="mt-4 text-sm font-medium">{foundCount}/{badTotal} bad habits found</p>
              {/* how many bad habits were found */}
              {wrongTaps > 0 && ( // only show the warning when a helpful behaviour was tapped
                <p className="text-sm text-red-600">
                  {/* red warning line */}
                  {wrongTaps === 1 // singular wording for one wrong tap
                    ? '1 wrong tap: that one actually helps you.' // message for exactly one wrong tap
                    : `${wrongTaps} wrong taps: those actually help you.`} {/* message for two or more */}
                </p>
              )}
              <p className="mt-2 text-sm text-muted-foreground">Good posture looks relaxed, steady and open.</p>
              {/* the explanation line */}
              <div className="mt-6 flex gap-2">
                {/* row holding Next and Back */}
                <Button className="flex-1" disabled={foundCount < badTotal} onClick={() => setStep(2)}>
                  {/* next step; disabled until all bad habits are found */}
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
              <CardTitle>Where should you look on a video call?</CardTitle>
              {/* the card heading */}
              <p className="text-sm text-muted-foreground">Pick the option that feels like eye contact.</p>
              {/* the question prompt */}
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {/* the two options stacked */}
                <button
                  type="button" // plain button, no form submit
                  onClick={() => setLook('A')} // remember option A
                  aria-pressed={look === 'A'} // announces whether A is picked
                  className={cn(
                    'w-full rounded-lg border p-3 text-left text-sm leading-6 transition-colors', // small card, left aligned
                    look === 'A' ? 'border-primary bg-primary/10' : 'border-input bg-background' // highlight the picked one
                  )}
                >
                  {/* option A card */}
                  At my own face on the screen
                  {/* option A text */}
                </button>
                <button
                  type="button" // plain button, no form submit
                  onClick={() => setLook('B')} // remember option B
                  aria-pressed={look === 'B'} // announces whether B is picked
                  className={cn(
                    'w-full rounded-lg border p-3 text-left text-sm leading-6 transition-colors', // small card, left aligned
                    look === 'B' ? 'border-primary bg-primary/10' : 'border-input bg-background' // highlight the picked one
                  )}
                >
                  {/* option B card */}
                  At the camera lens
                  {/* option B text */}
                </button>
              </div>
              {look !== null && ( // feedback only after a choice is made
                <p className={look === 'B' ? 'mt-3 text-sm text-green-600' : 'mt-3 text-sm text-amber-600'}>
                  {/* green for B, amber for A */}
                  {look === 'B'
                    ? 'Correct: looking at the lens feels like eye contact to your audience.' // praise for B
                    : 'Look again: looking at your own face looks like looking away.'} {/* nudge for A */}
                </p>
              )}
              <div className="mt-6 flex gap-2">
                {/* row holding Next and Back */}
                <Button className="flex-1" disabled={look === null} onClick={() => setStep(3)}>
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
                  onClick={() => { setStep(0); setStance(null); setTappedChips([]); setLook(null); }} // restart the whole lesson
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

export default PostureLesson; // lets App.tsx import this page
