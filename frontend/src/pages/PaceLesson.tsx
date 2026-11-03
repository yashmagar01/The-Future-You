// Lesson 2: finding your pace. This file has Step 0 only (the Hook slider).
import { useState } from 'react'; // useState lets a component remember a value, like remember { mutableStateOf() } in Compose
import { AppLayout } from '@/components/AppLayout'; // the frame: top bar + sidebar
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // ready-made card pieces
import { Button } from '@/components/ui/button'; // ready-made button
import { cn } from '@/lib/utils'; // cn joins class names and lets us swap colours per state

const PaceLesson = () => { // the page: a function that returns UI
  const [wpm, setWpm] = useState(150); // wpm = current slider value (words per minute), starts at a comfortable 150
  const [step, setStep] = useState(0); // step = which part of the lesson we show, setStep changes it (starts at 0)
  const isTooSlow = wpm < 110; // below the comfortable band
  const isTooFast = wpm > 160; // above the comfortable band
  const paceLabel = isTooSlow ? 'Too slow' : isTooFast ? 'Too fast' : 'Good pace'; // 110 to 160 is the good band

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
              <CardTitle>Steady pace</CardTitle>
              {/* the card heading */}
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Step 2 coming next</p>
              {/* placeholder text for the next step */}
              <Button className="mt-6 w-full" variant="outline" onClick={() => setStep(0)}>
                {/* button that moves us back to step 0 */}
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
