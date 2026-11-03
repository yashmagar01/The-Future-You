// Lesson 2: finding your pace. Step 0 is the Hook slider, step 1 is the "Tap the pauses" game.
import { useState } from 'react'; // useState lets a component remember a value, like remember { mutableStateOf() } in Compose
import { AppLayout } from '@/components/AppLayout'; // the frame: top bar + sidebar
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // ready-made card pieces
import { Button } from '@/components/ui/button'; // ready-made button
import { cn } from '@/lib/utils'; // cn joins class names and lets us swap colours per state

// One piece of the practice sentence: a plain word, or a gap where a pause could go
type PaceToken = { type: 'word'; text: string } | { type: 'gap'; good: boolean }; // union of the two token shapes

// The sentence in order; good = true marks a gap at a full thought boundary
const tokens: PaceToken[] = [ // the practice sentence broken into words and gaps
  { type: 'word', text: 'Hello' }, // first word
  { type: 'word', text: 'everyone' }, // second word
  { type: 'gap', good: true }, // natural pause after the greeting
  { type: 'word', text: 'today' }, // word
  { type: 'word', text: 'I' }, // word
  { type: 'word', text: 'want' }, // word
  { type: 'word', text: 'to' }, // word
  { type: 'word', text: 'talk' }, // word
  { type: 'word', text: 'about' }, // word
  { type: 'word', text: 'our' }, // word
  { type: 'gap', good: false }, // bad pause: it splits "our project"
  { type: 'word', text: 'project' }, // word
  { type: 'gap', good: true }, // natural pause after the subject
  { type: 'word', text: 'it' }, // word
  { type: 'word', text: 'helps' }, // word
  { type: 'word', text: 'students' }, // word
  { type: 'word', text: 'practise' }, // word
  { type: 'word', text: 'speaking' }, // word
  { type: 'gap', good: true }, // natural pause between two ideas
  { type: 'word', text: 'and' }, // word
  { type: 'word', text: 'it' }, // word
  { type: 'word', text: 'gives' }, // word
  { type: 'word', text: 'instant' }, // word
  { type: 'word', text: 'feedback.' }, // final word
]; // end of the practice sentence

const PaceLesson = () => { // the page: a function that returns UI
  const [wpm, setWpm] = useState(150); // wpm = current slider value (words per minute), starts at a comfortable 150
  const [step, setStep] = useState(0); // step = which part of the lesson we show, setStep changes it (starts at 0)
  const [tappedGaps, setTappedGaps] = useState<number[]>([]); // indexes of the gaps the learner has tapped (starts empty)
  const isTooSlow = wpm < 110; // below the comfortable band
  const isTooFast = wpm > 160; // above the comfortable band
  const paceLabel = isTooSlow ? 'Too slow' : isTooFast ? 'Too fast' : 'Good pace'; // 110 to 160 is the good band
  const goodFound = tokens.filter((t, i) => t.type === 'gap' && t.good && tappedGaps.includes(i)).length; // correct pauses tapped
  const goodTotal = tokens.filter((t) => t.type === 'gap' && t.good).length; // how many correct pauses exist (3)
  const wrongTaps = tokens.filter((t, i) => t.type === 'gap' && !t.good && tappedGaps.includes(i)).length; // bad gaps tapped

  const toggleGap = (index: number) => { // called when a gap is clicked
    setTappedGaps((prev) => (prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index])); // remove it if already tapped, otherwise add it
  }; // end of toggleGap

  return ( // what to draw
    <AppLayout>
      {/* AppLayout puts everything below into the main area (this is {children}) */}
      <div className="mx-auto max-w-xl">
        {/* centred column, not too wide */}
        {step === 0 && ( // only show this block while we are on step 0
          <Card>
            {/* one white card */}
            <CardHeader>
              <CardTitle>Find your pace</CardTitle>
              {/* the card heading */}
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Drag the slider: how fast do you speak, in words per minute?</p>
              {/* the instruction line */}
              <div className={cn('my-6 text-center text-6xl font-bold', isTooSlow ? 'text-amber-600' : isTooFast ? 'text-red-600' : 'text-green-600')}>
                {/* the big number, coloured by pace */}
                {wpm}
                {/* the current words per minute */}
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                {/* the grey bar behind */}
                <div className="h-full bg-green-500 transition-all" style={{ width: `${Math.round(((wpm - 60) / 200) * 100)}%` }} />
                {/* the green bar fills as wpm goes from 60 to 260 */}
              </div>
              <input
                type="range" // a slider
                min={60} // slowest pace
                max={260} // fastest pace
                value={wpm} // the slider shows our remembered value
                onChange={(e) => setWpm(Number(e.target.value))} // when dragged, remember the new value as a number
                className="mt-6 w-full" // spacing on top, full width
              />
              <p className={cn('mt-2 text-center font-medium', isTooSlow ? 'text-amber-600' : isTooFast ? 'text-red-600' : 'text-green-600')}>
                {/* the pace label, coloured amber / green / red */}
                {paceLabel}
                {/* Too slow, Good pace or Too fast */}
              </p>
              <p className="mt-1 text-center text-sm text-muted-foreground">
                {/* the explanation line */}
                110 to 160 words per minute is a comfortable speaking pace.
                {/* why the band matters */}
              </p>
              <Button className="mt-6 w-full" onClick={() => setStep(1)}>
                {/* button that moves us to step 1 */}
                Next: keep a steady beat
                {/* the button label */}
              </Button>
              <Button className="mt-2 w-full" variant="outline" onClick={() => setStep(0)}>
                {/* button that stays on step 0 (placeholder for the next step's Back) */}
                Back
                {/* the button label */}
              </Button>
            </CardContent>
          </Card>
        )}
        {step === 1 && ( // only show this block while we are on step 1
          <Card>
            {/* one white card */}
            <CardHeader>
              <CardTitle>Tap the pauses</CardTitle>
              {/* the card heading */}
              <p className="text-sm text-muted-foreground">Tap every "/" where a pause belongs.</p>
              {/* the instruction line */}
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-1.5 text-lg leading-8">
                {/* the sentence, words and gaps wrap like text */}
                {tokens.map((token, index) => ( // one element per token
                  token.type === 'word' ? ( // plain text for words
                    <span key={index}>{token.text}</span> // the word itself
                  ) : ( // a clickable gap for pauses
                    <button
                      key={index} // React needs a stable key
                      type="button" // plain button, no form submit
                      aria-label={`Gap ${index}`} // helpful name for screen readers
                      aria-pressed={tappedGaps.includes(index)} // announces whether it is tapped
                      onClick={() => toggleGap(index)} // tap toggles this gap
                      className={cn(
                        'inline-flex h-6 w-6 items-center justify-center rounded border text-sm font-medium', // small square
                        tappedGaps.includes(index) // has the learner tapped it?
                          ? token.good
                            ? 'border-green-600 bg-green-100 text-green-900' // tapped and good: green
                            : 'border-red-600 bg-red-100 text-red-900' // tapped and not good: red
                          : 'border-input bg-muted text-muted-foreground' // untapped: grey
                      )}
                    >
                      {/* the gap marker */}
                      /
                      {/* shows the slash */}
                    </button>
                  ) // end of word or gap
                ))}
              </div>
              <p className="mt-4 text-sm font-medium">{goodFound}/{goodTotal} pauses found</p>
              {/* how many correct pauses were tapped */}
              {wrongTaps > 0 && ( // only show the warning when a bad gap was tapped
                <p className="text-sm text-red-600">
                  {/* red warning line */}
                  {wrongTaps === 1 // singular wording for one wrong tap
                    ? '1 wrong tap: a pause there breaks the phrase.' // message for exactly one wrong tap
                    : `${wrongTaps} wrong taps: those pauses break the phrase.`} {/* message for two or more */}
                </p>
              )}
              <p className="mt-2 text-sm text-muted-foreground">Pause after a full thought, not in the middle of one.</p>
              {/* the explanation line */}
              <div className="mt-6 flex gap-2">
                {/* row holding Next and Back */}
                <Button className="flex-1" disabled={goodFound < goodTotal} onClick={() => setStep(2)}>
                  {/* next step; disabled until all good gaps are tapped */}
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
              <CardTitle>Step 3 coming next</CardTitle>
              {/* placeholder heading for the future step 3 */}
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Step 3 coming next</p>
              {/* placeholder text for the future step 3 */}
              <Button className="mt-6 w-full" variant="outline" onClick={() => setStep(1)}>
                {/* button that moves us back to step 1 */}
                Back
                {/* the button label */}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  ); // end of what we draw
}; // end of the page function

export default PaceLesson; // lets App.tsx import this page
