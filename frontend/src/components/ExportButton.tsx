import { useMemo, useRef, useState } from 'react';
import { Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import ExportReport from './ExportReport';

interface Props {
  analysisData: any;
  transcript: { time: number; text: string }[];
  recording: any;
}

const STEPS = ['Analyzing Layout...', 'Rendering Charts...', 'Generating File...', 'Done! ✓'];

export default function ExportButton({ analysisData, transcript, recording }: Props) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(-1);
  const pngRef = useRef<HTMLDivElement>(null);
  const pdfRef = useRef<HTMLDivElement>(null);

  const takeaways = useMemo<string[]>(() => {
    const out: string[] = [];
    const m = analysisData?.metrics;
    if (!m) return ['Great effort! Keep practicing to improve your confidence score.'];
    if ((m.clarity?.filler_word_count ?? 0) > 5) out.push(`Cut filler words (${m.clarity.filler_word_count} detected) — pause instead of saying 'um'.`);
    else out.push('Crystal clear delivery! You minimized filler words effectively.');
    if ((m.pacing?.score ?? 70) < 60) out.push(m.pacing?.feedback || 'Watch your pacing. Keep a steady rhythm.');
    else out.push('Strong, steady pacing kept your message easy to follow.');
    out.push('Vary your pitch to keep the audience engaged.');
    return out.slice(0, 4);
  }, [analysisData]);

  const actionItems = useMemo(
    () => [
      { id: '1', text: "Replace 'actually' with a pause for emphasis.", timestamp: 35, completed: false },
      { id: '2', text: "Slow down when explaining key lists.", timestamp: 50, completed: false },
      { id: '3', text: "Maintain eye contact during transitions.", timestamp: 12, completed: true },
    ],
    []
  );

  const sentimentData = useMemo(
    () => [
      { time: '0:00', score: 30, label: 'Neutral' },
      { time: '0:10', score: 45, label: 'Positive' },
      { time: '0:20', score: 60, label: 'Positive' },
      { time: '0:30', score: 80, label: 'High Energy' },
      { time: '0:40', score: 50, label: 'Neutral' },
      { time: '0:50', score: 20, label: 'Concern' },
      { time: '1:00', score: 40, label: 'Neutral' },
      { time: '1:10', score: 70, label: 'Positive' },
    ],
    []
  );

  const runSteps = async (fn: () => Promise<void>) => {
    for (let i = 0; i < 3; i++) {
      setStep(i);
      await new Promise((r) => setTimeout(r, 350));
    }
    await fn();
    setStep(3);
    await new Promise((r) => setTimeout(r, 600));
    setStep(-1);
    setOpen(false);
  };

  const stamp = new Date().toISOString().slice(0, 10);

  const exportPNG = () =>
    runSteps(async () => {
      const el = pngRef.current!;
      const canvas = await html2canvas(el, { scale: 3, backgroundColor: '#FAFBFA', useCORS: true });
      const out = document.createElement('canvas');
      out.width = 1080;
      out.height = 1350;
      out.getContext('2d')!.drawImage(canvas, 0, 0, 1080, 1350);
      const a = document.createElement('a');
      a.download = `TheFutureYou_Summary_${stamp}.png`;
      a.href = out.toDataURL('image/png');
      a.click();
    });

  const exportPDF = () =>
    runSteps(async () => {
      const pdf = new jsPDF({ format: 'a4' });
      const pages = pdfRef.current!.querySelectorAll('[data-pdf-page]');
      for (let i = 0; i < pages.length; i++) {
        const canvas = await html2canvas(pages[i] as HTMLElement, { scale: 2, useCORS: true });
        const img = canvas.toDataURL('image/png');
        if (i > 0) pdf.addPage();
        pdf.addImage(img, 'PNG', 0, 0, 210, 297);
      }
      pdf.save(`TheFutureYou_Report_${stamp}.pdf`);
    });

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 bg-[#16C784] hover:bg-[#12a86e] text-white font-semibold px-5 py-2.5 rounded-xl shadow-sm transition-colors"
      >
        <Download className="h-4 w-4" />
        Export Report
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => step < 0 && setOpen(false)}>
          <div className="bg-white rounded-2xl p-6 w-[320px] shadow-xl" onClick={(e) => e.stopPropagation()}>
            {step >= 0 ? (
              <div className="text-center py-4">
                <div className="animate-spin h-8 w-8 border-4 border-[#16C784] border-t-transparent rounded-full mx-auto mb-4" />
                <p className="font-medium text-gray-800">{STEPS[step]}</p>
              </div>
            ) : (
              <>
                <h3 className="font-bold text-lg mb-4">Export Report</h3>
                <div className="space-y-3">
                  <button onClick={exportPNG} className="w-full flex items-center gap-3 border rounded-xl p-4 hover:bg-gray-50 transition-colors">
                    <span className="text-2xl">📸</span>
                    <span className="font-medium">PNG Summary</span>
                  </button>
                  <button onClick={exportPDF} className="w-full flex items-center gap-3 border rounded-xl p-4 hover:bg-gray-50 transition-colors">
                    <span className="text-2xl">📄</span>
                    <span className="font-medium">PDF Report</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <ExportReport
        analysis={analysisData}
        takeaways={takeaways}
        transcript={transcript}
        recordingTitle={recording?.title || 'Untitled Session'}
        recordingDate={recording?.created_at || new Date().toISOString()}
        recordingDuration={recording?.duration_seconds}
        actionItems={actionItems}
        sentimentData={sentimentData}
        pngRef={pngRef}
        pdfRef={pdfRef}
      />
    </>
  );
}
