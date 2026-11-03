// Lesson 1: Cutting filler words. This file has Step 1 only (the slider).
import { useState } from 'react'; // useState lets a component remember a value, like remember { mutableStateOf() } in Compose
import { AppLayout } from '@/components/AppLayout'; // the frame: top bar + sidebar
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // ready-made card pieces

// The app's fluency formula, written as a small function
const fluencyScore = (fillersPerMinute: number) => // takes fillers per minute, returns a score
  Math.round(100 * Math.exp(-0.15 * Math.max(0, fillersPerMinute - 1))); // 100 * e^(-0.15 * max(0, x - 1)), rounded

const FillerWordsLesson = () => { // the page: a function that returns UI
  const [fillers, setFillers] = useState(0); // fillers = current slider value, setFillers changes it (starts at 0)
  const score = fluencyScore(fillers); // recalculated every time the slider moves

  return ( // what to draw
    <AppLayout>
      {/* AppLayout puts everything below into the main area (this is {children}) */}
      <div className="mx-auto max-w-xl">
        {/* centred column, not too wide */}
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
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  ); // end of what we draw
}; // end of the page function

export default FillerWordsLesson; // lets App.tsx import this page