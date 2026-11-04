// Lesson 4: Voice energy and volume. Four short steps with text-only interactions.
import { useEffect, useState } from 'react'; // useState remembers values; useEffect runs code after render
import { Link } from 'react-router-dom'; // Link changes pages inside the app without a full reload
import { AppLayout } from '@/components/AppLayout'; // the frame: top bar + sidebar
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // ready-made card pieces
import { Button } from '@/components/ui/button'; // ready-made button
import { cn } from '@/lib/utils'; // cn joins class names and lets us swap colours per state

// The lesson id from learnLessons.ts, used for the progress key
const lessonId = 'voice-energy-and-volume'; // exact id of the "Voice Energy and Volume" lesson

// The sentence words, marked when they are worth stressing
const words: { text: string; key: boolean }[] = [ // the word chips for step 2
  { text: 'Our', key: false }, // not a key word
  { text: 'app', key: false }, // not a key word
  { text: 'gives', key: false }, // not a key word
  { text: 'you', key: false }, // not a key word
  { text: 'instant', key: true }, // key word
  { text: 'feedback', key: true }, // key word
  { text: 'on', key: false }, // not a key word
  { text: 'your', key: false }, // not a key word
  { text: 'speaking', key: true }, // key word
]; // end of the word list

const VoiceLesson = () => { // the page: a function that returns UI
  const [step, setStep] = useState(0); // step = which part of the lesson we show, setStep changes it (starts at 0)
  const [energy, setEnergy] = useState(5); // energy = slider value from 0 to 10 (starts at the middle)
  const [tappedWords, setTappedWords] = useState<number[]>([]); // indexes of the tapped word chips (starts empty)
  const [answer, setAnswer] = useState<'A' | 'B' | null>(null); // answer = chosen option for the volume question (starts none)
  const isFlat = energy < 3; // below the engaged band
  const isIntense = energy > 7; // above the engaged band
  const energyLabel = isFlat ? 'Flat and quiet' : isIntense ? 'Too intense' : 'Engaged'; // 3 to 7 is the engaged band
  const foundCount = words.filter((word, i) => word.key && tappedWords.includes(i)).length; // key words found
  const keyTotal = words.filter((word) => word.key).length; // total key words to find
  const wrongTaps = words.filter((word, i) => !word.key && tappedWords.includes(i)).length; // non-key words tapped by mistake
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

  const toggleWord = (index: number) => { // called when a word chip is clicked
    setTappedWords((prev) => (prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index])); // remove it if already tapped, otherwise add it
  }; // end of toggleWord

  return ( // what to draw
    <AppLayout>
      {/* AppLayout puts everything below into the main area (this is {children}) */}
      <div className="mx-auto max-w-xl">
        {/* centred column, not too wide */}
        {step === 0 && ( // only show this block while we are on step 0
          <Card>
            {/* one white card */}
            <CardHeader>
              <CardTitle>How energetic do you sound?</CardTitle>
              {/* the card heading */}
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Drag the slider: how lively does your voice feel?</p>
              {/* the instruction line */}
              <div className={cn('my-6 text-center text-6xl font-bold', isFlat ? 'text-amber-600' : isIntense ? 'text-red-600' : 'text-green-600')}>
                {/* the big number, coloured by energy */}
                {energy}
                {/* the current energy value */}
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                {/* the grey bar behind */}
                <div className="h-full bg-green-500 transition-all" style={{ width: `${energy * 10}%` }} />
                {/* the green bar fills as energy goes from 0 to 10 */}
              </div>
              <input
                type="range" // a slider
                min={0} // lowest energy
                max={10} // highest energy
                value={energy} // the slider shows our remembered value
                onChange={(e) => setEnergy(Number(e.target.value))} // when dragged, remember the new value as a number
                className="mt-6 w-full" // spacing on top, full width
              />
              <p className={cn('mt-2 text-center font-medium', isFlat ? 'text-amber-600' : isIntense ? 'text-red-600' : 'text-green-600')}>
                {/* the energy label, coloured amber / green / red */}
                {energyLabel}
                {/* Flat and quiet, Engaged or Too intense */}
              </p>
              <p className="mt-1 text-center text-sm text-muted-foreground">A warm, lively voice keeps listeners with you.</p>
              {/* the explanation line */}
              <Button className="mt-6 w-full" onClick={() => setStep(1)}>
                {/* button that moves us to step 1 */}
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
              <CardTitle>Stress the key words</CardTitle>
              {/* the card heading */}
              <p className="text-sm text-muted-foreground">Tap the words that carry the meaning.</p>
              {/* the instruction line */}
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {/* the word chips wrap onto multiple lines */}
                {words.map((word, index) => ( // one chip per word
                  <button
                    key={index} // React needs a stable key
                    type="button" // plain button, no form submit
                    aria-pressed={tappedWords.includes(index)} // announces whether this chip is tapped
                    onClick={() => toggleWord(index)} // tap toggles this chip
                    className={cn(
                      'rounded-full border px-3 py-2 text-sm font-medium transition-colors', // small pill chip
                      tappedWords.includes(index) // has the learner tapped it?
                        ? word.key
                          ? 'border-green-600 bg-green-100 text-green-900' // tapped key word: found
                          : 'border-red-600 bg-red-100 text-red-900' // tapped other word: wrong tap
                        : 'border-input bg-muted text-muted-foreground' // untapped: grey
                    )}
                  >
                    {/* the chip label */}
                    {word.text}
                    {/* the word text */}
                  </button>
                ))}
              </div>
              <p className="mt-4 text-sm font-medium">{foundCount}/{keyTotal} key words found</p>
              {/* how many key words were found */}
              {wrongTaps > 0 && ( // only show the warning when a non-key word was tapped
                <p className="text-sm text-red-600">
                  {/* red warning line */}
                  {wrongTaps === 1 // singular wording for one wrong tap
                    ? '1 wrong tap: that word is not worth stressing.' // message for exactly one wrong tap
                    : `${wrongTaps} wrong taps: those words are not worth stressing.`} {/* message for two or more */}
                </p>
              )}
              <p className="mt-2 text-sm text-muted-foreground">Stress the words that carry the meaning.</p>
              {/* the explanation line */}
              <div className="mt-6 flex gap-2">
                {/* row holding Next and Back */}
                <Button className="flex-1" disabled={foundCount < keyTotal} onClick={() => setStep(2)}>
                  {/* next step; disabled until all key words are found */}
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
              <CardTitle>The audience is at the back of the room. What helps most?</CardTitle>
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
                  Shout the whole time
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
                  Breathe deeply, slow down a little and aim your voice at the back wall
                  {/* option B text */}
                </button>
              </div>
              {answer !== null && ( // feedback only after a choice is made
                <p className={answer === 'B' ? 'mt-3 text-sm text-green-600' : 'mt-3 text-sm text-amber-600'}>
                  {/* green for B, amber for A */}
                  {answer === 'B'
                    ? 'Correct: support and aim beat shouting.' // praise for B
                    : 'Look again: shouting tires you and the audience.'} {/* nudge for A */}
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
                  onClick={() => { setStep(0); setEnergy(5); setTappedWords([]); setAnswer(null); }} // restart the whole lesson
                >
                  {/* resets step, slider, tapped words and answer */}
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

export default VoiceLesson; // lets App.tsx import this page
