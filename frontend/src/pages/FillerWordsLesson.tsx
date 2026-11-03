// Lesson 1: Cutting filler words. Step 0 is the slider; Step 1 is a placeholder for "spot them".
import { useState } from 'react'; // useState lets a component remember a value, like remember { mutableStateOf() } in Compose
import { AppLayout } from '@/components/AppLayout'; // the frame: top bar + sidebar
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // ready-made card pieces
import { Button } from '@/components/ui/button'; // ready-made button

// The app's fluency formula, written as a small function
const fluencyScore = (fillersPerMinute: number) => // takes fillers per minute, returns a score
  Math.round(100 * Math.exp(-0.15 * Math.max(0, fillersPerMinute - 1))); // 100 * e^(-0.15 * max(0, x - 1)), rounded

const FillerWordsLesson = () => { // the page: a function that returns UI
  const [fillers, setFillers] = useState(0); // fillers = current slider value, setFillers changes it (starts at 0)
  const [step, setStep] = useState(0); // step = which part of the lesson we show, setStep changes it (starts at 0)
  const score = fluencyScore(fillers); // recalculated every time the slider moves

  return ( // what to draw
    <AppLayout>
      {/* AppLayout puts everything below into the main area (this is {children}) */}
      <div className="mx-auto max-w-xl">
        {/* centred column, not too wide */}
        {step === 0 && ( // only show this block while we are on step 0
          <Card>
            {/* one white card */}
            <CardHeader>
              <CardTitle>Fillers cost you points</CardTitle>
              {/* the card heading */}
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Drag the slider: how many fillers per minute do you say?</p>
              {/* the instruction line */}
              <div className="my-6 text-center text-6xl font-bold">{score}</div>
              {/* the big score number */}
              <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                {/* the grey bar behind */}
                <div className="h-full bg-green-500 transition-all" style={{ width: `${score}%` }} />
                {/* the green bar; its width is the score in percent */}
              </div>
              <input
                type="range" // a slider
                min={0} // lowest value
                max={12} // highest value
                value={fillers} // the slider shows our remembered value
                onChange={(e) => setFillers(Number(e.target.value))} // when dragged, remember the new value as a number
                className="mt-6 w-full" // spacing on top, full width
              />
              <p className="mt-2 text-center"><b>{fillers}</b> fillers per minute</p>
              {/* shows the current slider number */}
              <Button className="mt-6 w-full" onClick={() => setStep(1)}>
                {/* button that moves us to step 1 */}
                Next: spot them
                {/* the button label */}
              </Button>
            </CardContent>
          </Card>
        )}
        {step === 1 && ( // only show this block while we are on step 1
          <Card>
            {/* one white card */}
            <CardHeader>
              <CardTitle>Tap every filler word</CardTitle>
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

export default FillerWordsLesson; // lets App.tsx import this page
