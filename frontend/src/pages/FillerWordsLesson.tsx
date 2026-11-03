// Lesson 1: Cutting filler words. Step 0 is the slider; Step 1 is the "spot the fillers" game.
import { useEffect, useState } from 'react'; // useState remembers values; useEffect runs code after render, like LaunchedEffect
import { Link } from 'react-router-dom'; // Link changes pages inside the app without a full reload
import { AppLayout } from '@/components/AppLayout'; // the frame: top bar + sidebar
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // ready-made card pieces
import { Button } from '@/components/ui/button'; // ready-made button
import { cn } from '@/lib/utils'; // cn joins class names and lets us swap colours per token

// The sentence broken into words; filler = true marks a real filler word
const tokens: { text: string; filler: boolean }[] = [ // the list of words for the game
  { text: 'So,', filler: false }, // not a filler
  { text: 'um,', filler: true }, // filler
  { text: 'I', filler: false }, // not a filler
  { text: 'think', filler: false }, // not a filler
  { text: 'our', filler: false }, // not a filler
  { text: 'plan', filler: false }, // not a filler
  { text: 'looks', filler: false }, // not a filler (the trap word)
  { text: 'like', filler: false }, // NOT a filler: "looks like"
  { text: 'a', filler: false }, // not a filler
  { text: 'good', filler: false }, // not a filler
  { text: 'one,', filler: false }, // not a filler
  { text: 'you know,', filler: true }, // filler
  { text: 'and', filler: false }, // not a filler
  { text: "it's", filler: false }, // not a filler
  { text: 'like,', filler: true }, // IS a filler here (no word before it that it describes)
  { text: 'really', filler: false }, // not a filler
  { text: 'useful', filler: false }, // not a filler
  { text: 'uh,', filler: true }, // filler
  { text: 'today.', filler: false }, // not a filler
]; // end of the token list

// The app's fluency formula, written as a small function
const fluencyScore = (fillersPerMinute: number) => // takes fillers per minute, returns a score
  Math.round(100 * Math.exp(-0.15 * Math.max(0, fillersPerMinute - 1))); // 100 * e^(-0.15 * max(0, x - 1)), rounded

const FillerWordsLesson = () => { // the page: a function that returns UI
  const [fillers, setFillers] = useState(0); // fillers = current slider value, setFillers changes it (starts at 0)
  const [step, setStep] = useState(0); // step = which part of the lesson we show, setStep changes it (starts at 0)
  const [selected, setSelected] = useState<number[]>([]); // selected = indexes of words the learner tapped (starts empty)
  const [checked, setChecked] = useState(false); // checked = true once the learner pressed Check (starts false)
  const score = fluencyScore(fillers); // recalculated every time the slider moves
  const foundCount = tokens.filter((t, i) => t.filler && selected.includes(i)).length; // how many real fillers were tapped
  const fillerTotal = tokens.filter((t) => t.filler).length; // how many real fillers exist in total
  const fellForTrap = selected.includes(6) || selected.includes(7); // true if "looks" or the first "like" was tapped
  const wrongCount = tokens.filter((t, i) => !t.filler && selected.includes(i)).length; // how many tapped words are NOT fillers
  const [answer, setAnswer] = useState<'A' | 'B' | null>(null); // answer = which option was picked on step 3 (starts none)
  const stars = foundCount === fillerTotal && wrongCount === 0 ? 3 : foundCount >= 3 ? 2 : 1; // 3 perfect, 2 for three or more found, else 1
  const xp = 10 + 5 * stars; // base 10 XP plus 5 per star

  useEffect(() => { // runs after render whenever step changes
    if (step !== 3) return; // only save when the lesson is finished
    try { // storage can throw (private mode, quota), so guard it
      localStorage.setItem('learn:cutting-filler-words', JSON.stringify({ done: true, stars, xp })); // save the result
    } catch { // ignore storage errors so the page never crashes
      // nothing to do: the lesson still works without saved progress
    } // end of try/catch
  }, [step, stars, xp]); // re-run if the step or the result changes

  const toggleToken = (index: number) => { // called when a word button is clicked
    setSelected((prev) => (prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index])); // remove it if already picked, otherwise add it
  }; // end of toggleToken

  const tokenClasses = (index: number) => { // picks the colour classes for a word
    const isSelected = selected.includes(index); // did the learner tap this word?
    const isFiller = tokens[index].filler; // is this word a real filler?
    if (!checked) return isSelected ? 'border-primary bg-primary/10' : 'border-input bg-background'; // before checking: just a highlight for picked words
    if (isSelected && isFiller) return 'border-green-600 bg-green-100 text-green-900'; // correct pick: green
    if (isSelected && !isFiller) return 'border-red-600 bg-red-100 text-red-900'; // wrong pick: red
    if (isFiller) return 'border-amber-500 border-dashed bg-amber-100 text-amber-900'; // missed filler: amber with a dashed border
    return 'border-input bg-background'; // untouched non-filler: plain
  }; // end of tokenClasses

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
              <p className="text-sm text-muted-foreground">Careful: not every like is a filler.</p>
              {/* the subtitle warning */}
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {/* the words wrap onto new lines like text */}
                {tokens.map((token, index) => ( // one button per word
                  <Button
                    key={index} // React needs a stable key
                    type="button" // plain button, no form submit
                    variant="outline" // base look: bordered
                    size="sm" // small size
                    disabled={checked} // locked after checking
                    onClick={() => toggleToken(index)} // tap toggles this word
                    className={cn('rounded-full', tokenClasses(index))} // pill shape plus the per-state colours
                  >
                    {/* the label */}
                    {token.text}
                    {/* the word itself */}
                  </Button>
                ))}
              </div>
              <div className="mt-6 flex gap-2">
                {/* row holding Check and Back */}
                <Button className="flex-1" onClick={() => setChecked(true)} disabled={checked}>
                  {/* check the answers, then lock */}
                  Check
                  {/* the button label */}
                </Button>
                <Button
                  className="flex-1" // shares the row
                  variant="outline" // secondary look
                  onClick={() => { setStep(0); setSelected([]); setChecked(false); }} // go back and reset the game
                >
                  {/* button that moves us back to step 0 */}
                  Back
                  {/* the button label */}
                </Button>
              </div>
              {checked && ( // results only appear after checking
                <div className="mt-4 space-y-1 text-sm">
                  {/* results block */}
                  <p className="font-medium">{foundCount}/{fillerTotal} fillers found.</p>
                  {/* score line */}
                  {wrongCount > 0 && ( // only show the warning when there were wrong taps
                    <p className="text-red-600">
                      {/* red warning line */}
                      {wrongCount} wrong tap(s): those words are not fillers.
                      {/* the warning text */}
                    </p>
                  )}
                  <p className="text-muted-foreground">
                    {/* hint line */}
                    {fellForTrap
                      ? 'After looks, feel or sounds, like is not a filler.' // trap explanation
                      : 'Nice, you did not fall for the looks like trap!'} {/* praise */}
                  </p>
                </div>
              )}
              {checked && ( // the next-step button only appears after checking
                <Button className="mt-4 w-full" onClick={() => setStep(2)}>
                  {/* button that moves us to step 2 (step 3 of the lesson) */}
                  Next: learn the trick
                  {/* the button label */}
                </Button>
              )}
            </CardContent>
          </Card>
        )}
        {step === 2 && ( // only show this block while we are on step 2
          <Card>
            {/* one white card */}
            <CardHeader>
              <CardTitle>The pause trick</CardTitle>
              {/* the card heading */}
              <p className="text-sm text-muted-foreground">
                {/* the explanation */}
                Instead of saying um, stay silent for one second. Silence feels longer to you than it does to your listener.
                {/* the explanation text */}
              </p>
            </CardHeader>
            <CardContent>
              <p className="font-medium">Which sounds more confident?</p>
              {/* the mini-question */}
              <div className="mt-3 space-y-2">
                {/* the two options stacked */}
                <Button
                  className="w-full justify-start whitespace-normal text-left" // full width, left aligned so long text wraps
                  variant={answer === 'A' ? 'secondary' : 'outline'} // highlight the picked option
                  onClick={() => setAnswer('A')} // remember option A
                >
                  {/* option A */}
                  So... um... I think we should... like... start.
                  {/* option A text */}
                </Button>
                <Button
                  className="w-full justify-start whitespace-normal text-left" // full width, left aligned so long text wraps
                  variant={answer === 'B' ? 'secondary' : 'outline'} // highlight the picked option
                  onClick={() => setAnswer('B')} // remember option B
                >
                  {/* option B */}
                  So... [pause] I think we should [pause] start.
                  {/* option B text */}
                </Button>
              </div>
              {answer !== null && ( // feedback only after an option is picked
                <p className={answer === 'B' ? 'mt-3 text-green-600' : 'mt-3 text-amber-600'}>
                  {/* green when B, amber when A */}
                  {answer === 'B'
                    ? 'Right: pauses beat fillers.' // praise for B
                    : 'Look again: A has three fillers.'} {/* nudge for A */}
                </p>
              )}
              <div className="mt-6 flex gap-2">
                {/* row holding Next and Back */}
                <Button className="flex-1" disabled={answer === null} onClick={() => { setStep(3); setAnswer(null); }}>
                  {/* finish step 3; disabled until an option is picked, and resets the question */}
                  Next: finish
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
                  <Link to="/record">Try it now: record a real practice</Link>
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
                  onClick={() => { setStep(0); setSelected([]); setChecked(false); setAnswer(null); }} // restart the whole lesson
                >
                  {/* resets every step back to the start */}
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

export default FillerWordsLesson; // lets App.tsx import this page
