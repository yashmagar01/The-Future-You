import { useMemo, useRef, useState } from 'react';
import { Check, Download, FileText, Image as ImageIcon, LoaderCircle, Sparkles } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import ExportReport from './ExportReport';

interface Props { analysisData: any; transcript: { time: number; text: string }[]; recording: any; }
const EXPORT_STEPS = ['Analyzing performance', 'Rendering charts', 'Optimizing image', 'Finalizing download'];
const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function ExportButton({ analysisData, transcript, recording }: Props) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<number | null>(null);
  const [error, setError] = useState('');
  const pngRef = useRef<HTMLDivElement>(null);
  const pdfRef = useRef<HTMLDivElement>(null);
  const takeaways = useMemo<string[]>(() => {
    const metrics = analysisData?.metrics;
    if (!metrics) return ['Every reflection gives you a clearer picture of your communication.'];
    const fillers = metrics.clarity?.filler_word_count ?? 0;
    return [fillers > 5 ? `Reduce filler words (${fillers} detected) by letting key moments breathe.` : 'Crystal-clear delivery with minimal filler words.', (metrics.pacing?.score ?? 70) < 60 ? (metrics.pacing?.feedback || 'Slow down slightly to make key points land.') : 'Your pacing kept the message easy to follow.', 'Vary your pitch around important ideas to sustain attention.'];
  }, [analysisData]);
  const actionItems = useMemo(() => [{ id: '1', text: "Replace 'actually' with a pause for emphasis.", timestamp: 35, completed: false }, { id: '2', text: 'Slow down when explaining key lists.', timestamp: 50, completed: false }, { id: '3', text: 'Maintain eye contact during transitions.', timestamp: 12, completed: true }], []);
  const sentimentData = useMemo(() => [{ time: '0:00', score: 30, label: 'Neutral' }, { time: '0:10', score: 45, label: 'Positive' }, { time: '0:20', score: 60, label: 'Positive' }, { time: '0:30', score: 80, label: 'High energy' }, { time: '0:40', score: 50, label: 'Neutral' }, { time: '0:50', score: 20, label: 'Concern' }, { time: '1:00', score: 40, label: 'Neutral' }, { time: '1:10', score: 70, label: 'Positive' }], []);

  const prepareCapture = async () => {
    await document.fonts?.ready;
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    const images = Array.from((pngRef.current || pdfRef.current)?.querySelectorAll('img') || []);
    await Promise.all(images.map((image) => image.complete ? Promise.resolve() : new Promise<void>((resolve) => { image.addEventListener('load', () => resolve(), { once: true }); image.addEventListener('error', () => resolve(), { once: true }); })));
  };
  const runExport = async (type: 'png' | 'pdf') => {
    try {
      setError(''); setStep(0); await pause(260); setStep(1); await prepareCapture(); await pause(180); setStep(2);
      const stamp = new Date().toISOString().slice(0, 10);
      if (type === 'png') {
        if (!pngRef.current) throw new Error('The report is still preparing. Please try again.');
        const canvas = await html2canvas(pngRef.current, { scale: 3, backgroundColor: '#FAFBFA', useCORS: true, logging: false });
        const link = document.createElement('a'); link.download = `TheFutureYou_Communication_Report_${stamp}.png`; link.href = canvas.toDataURL('image/png'); link.click();
      } else {
        if (!pdfRef.current) throw new Error('The report is still preparing. Please try again.');
        const pdf = new jsPDF({ format: 'a4' }); const pages = pdfRef.current.querySelectorAll('[data-pdf-page]');
        for (let index = 0; index < pages.length; index += 1) { const canvas = await html2canvas(pages[index] as HTMLElement, { scale: 2, useCORS: true, backgroundColor: '#FFFFFF', logging: false }); if (index > 0) pdf.addPage(); pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, 210, 297); }
        pdf.save(`TheFutureYou_Full_Report_${stamp}.pdf`);
      }
      setStep(3); await pause(800); setOpen(false); setStep(null);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'We could not generate that report. Please try again.'); setStep(null); }
  };
  const progress = step === null ? 0 : ((step + 1) / EXPORT_STEPS.length) * 100;
  const selectingFormat = <div>
    <div className="mb-6 flex items-start gap-3"><div className="rounded-2xl bg-[#EAF8F2] p-3 text-[#16C784]"><Sparkles className="h-6 w-6" /></div><div><h2 className="text-xl font-bold text-[#111827]">Export report</h2><p className="mt-1 text-sm text-slate-500">Choose a format made for the moment.</p></div></div>
    <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Choose format</p><div className="space-y-3">
      <button onClick={() => runExport('png')} className="flex w-full items-center gap-4 rounded-2xl border border-[#16C784] bg-[#F5FCF8] p-4 text-left transition hover:bg-[#EAF8F2]"><span className="rounded-xl bg-white p-3 text-[#16C784] shadow-sm"><ImageIcon className="h-5 w-5" /></span><span className="flex-1"><span className="block font-bold text-[#111827]">PNG</span><span className="block text-sm text-slate-500">Social card · 1080 × 1350</span></span><span className="text-sm font-semibold text-[#16C784]">Generate</span></button>
      <button onClick={() => runExport('pdf')} className="flex w-full items-center gap-4 rounded-2xl border border-slate-200 p-4 text-left transition hover:border-slate-300 hover:bg-slate-50"><span className="rounded-xl bg-slate-100 p-3 text-slate-600"><FileText className="h-5 w-5" /></span><span className="flex-1"><span className="block font-bold text-[#111827]">PDF</span><span className="block text-sm text-slate-500">Full six-page report</span></span><span className="text-sm font-semibold text-slate-500">Generate</span></button>
    </div>{error && <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
  </div>;
  const loading = <div className="space-y-4"><div className="flex items-center gap-3"><div className="rounded-2xl bg-[#EAF8F2] p-3 text-[#16C784]"><LoaderCircle className="h-6 w-6 animate-spin" /></div><div><h2 className="text-xl font-bold text-[#111827]">Preparing your report…</h2><p className="mt-1 text-sm text-slate-500">Usually takes less than 10 seconds.</p></div></div><progress className="h-2 w-full overflow-hidden rounded-full accent-[#16C784]" value={progress} max="100" /><p className="text-sm font-medium text-[#111827]">{EXPORT_STEPS[step ?? 0]}</p></div>;
  return <><button onClick={() => { setError(''); setOpen(true); }} className="inline-flex items-center gap-2 rounded-xl bg-[#16C784] px-5 py-2.5 font-semibold text-white shadow-sm transition-colors hover:bg-[#12a86e]"><Download className="h-4 w-4" /> Export Report</button>{open && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm" onClick={() => step === null && setOpen(false)}><section className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-7 shadow-2xl" onClick={(event) => event.stopPropagation()} aria-live="polite">{step === null ? selectingFormat : loading}</section></div>}<ExportReport analysis={analysisData} takeaways={takeaways} transcript={transcript} recordingTitle={recording?.title || 'Untitled Session'} recordingDate={recording?.created_at || new Date().toISOString()} recordingDuration={recording?.duration_seconds} actionItems={actionItems} sentimentData={sentimentData} pngRef={pngRef} pdfRef={pdfRef} /></>;
}
