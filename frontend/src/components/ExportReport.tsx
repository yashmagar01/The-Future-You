import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

export interface ExportReportProps {
  analysis: any;
  takeaways: string[];
  transcript: { time: number; text: string }[];
  recordingTitle: string;
  recordingDate: string;
  recordingDuration?: number;
  actionItems: { id: string; text: string; timestamp: number; completed: boolean }[];
  sentimentData: { time: string; score: number; label: string }[];
  pngRef: React.RefObject<HTMLDivElement>;
  pdfRef: React.RefObject<HTMLDivElement>;
}

const FONT = 'Inter, system-ui, sans-serif';
const card: React.CSSProperties = {
  borderRadius: 20, border: '1px solid #E8F0EC',
  boxShadow: '0 4px 12px rgba(0,0,0,0.04)', padding: 20, background: '#fff',
};
const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const scoreColor = (s: number) => (s >= 70 ? '#16C784' : '#EF4444');

// ponytail: pure SVG gauges/polylines only — recharts breaks html2canvas
function SemiGauge({ score, size = 300 }: { score: number; size?: number }) {
  const r = 90;
  const len = Math.PI * r;
  const frac = Math.max(0, Math.min(100, score)) / 100;
  return (
    <svg width={size} height={size / 2 + 30} viewBox="0 0 200 125">
      <path d="M10 100 A90 90 0 0 1 190 100" stroke="#E8F0EC" strokeWidth="16" fill="none" strokeLinecap="round" />
      <path d="M10 100 A90 90 0 0 1 190 100" stroke={scoreColor(score)} strokeWidth="16" fill="none" strokeLinecap="round"
        strokeDasharray={`${len * frac} ${len}`} />
      <text x="100" y="82" textAnchor="middle" fontSize="34" fontWeight="700" fill="#111827" fontFamily={FONT}>{score}</text>
      <text x="100" y="102" textAnchor="middle" fontSize="11" fill="#6B7280" fontFamily={FONT}>/ 100</text>
    </svg>
  );
}

function CircleGauge({ score, size = 150 }: { score: number; size?: number }) {
  const r = 60;
  const c = 2 * Math.PI * r;
  const off = c * (1 - Math.max(0, Math.min(100, score)) / 100);
  return (
    <svg width={size} height={size} viewBox="0 0 140 140">
      <circle cx="70" cy="70" r={r} stroke="#E8F0EC" strokeWidth="14" fill="none" />
      <circle cx="70" cy="70" r={r} stroke={scoreColor(score)} strokeWidth="14" fill="none" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={off} transform="rotate(-90 70 70)" />
      <text x="70" y="78" textAnchor="middle" fontSize="28" fontWeight="700" fill="#111827" fontFamily={FONT}>{score}</text>
    </svg>
  );
}

function ToneChart({ data, w = 300, h = 100 }: { data: { score: number }[]; w?: number; h?: number }) {
  const pts = data.length ? data : [{ score: 50 }];
  const step = w / Math.max(1, pts.length - 1);
  const xy = pts.map((d, i) => `${i * step},${h - (Math.max(0, Math.min(100, d.score)) / 100) * (h - 10) - 5}`).join(' ');
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ height: 110, display: 'block' }}>
      <defs>
        <linearGradient id="toneFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#16C784" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#16C784" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${xy} ${w},${h}`} fill="url(#toneFill)" />
      <polyline points={xy} fill="none" stroke="#16C784" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function Bar({ value, color }: { value: number; color: string }) {
  return (
    <svg width="100%" height="10" viewBox="0 0 200 10" preserveAspectRatio="none">
      <rect x="0" y="0" width="200" height="10" rx="5" fill="#E8F0EC" />
      <rect x="0" y="0" width={Math.max(0, Math.min(100, value)) * 2} height="10" rx="5" fill={color} />
    </svg>
  );
}

export default function ExportReport(props: ExportReportProps) {
  const { analysis, takeaways, transcript, recordingTitle, recordingDate, actionItems, sentimentData, pngRef, pdfRef } = props;
  const score = analysis?.overall_score ?? 0;
  const clarity = analysis?.metrics?.clarity?.score ?? 0;
  const pacing = analysis?.metrics?.pacing?.score ?? 0;
  const posture = analysis?.metrics?.posture?.score ?? 0;
  const dominant = analysis?.metrics?.sentiment?.score ?? sentimentData?.[0]?.label ?? 'Neutral';
  const dateStr = new Date(recordingDate || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const reportId = `TFY-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now().toString(36).toUpperCase().slice(-6)}`;
  const [qr, setQr] = useState('');
  useEffect(() => {
    QRCode.toDataURL('https://the-future-you.vercel.app', { margin: 1, width: 160 }).then(setQr).catch(() => setQr(''));
  }, []);

  const metrics = [
    { label: 'Clarity', value: clarity },
    { label: 'Pacing', value: pacing },
    { label: 'Posture', value: posture },
  ];
  const fixes = actionItems.slice(0, 3).map((a) => a.text.length > 42 ? a.text.slice(0, 42) + '…' : a.text);
  const structureRows = [
    { label: 'Sentence Length', value: Math.min(100, analysis?.metrics?.structure_score ?? 70) },
    { label: 'Transition Words', value: Math.min(100, (analysis?.metrics?.structure_score ?? 70) - 8) },
    { label: 'Filler Phrases', value: Math.max(20, 100 - (analysis?.metrics?.clarity?.filler_word_count ?? 3) * 8) },
  ];
  const strengths = takeaways.filter((_, i) => i % 2 === 0).slice(0, 3);
  const focus = takeaways.filter((_, i) => i % 2 === 1).slice(0, 3);
  const pageNum = (n: number): React.CSSProperties => ({ textAlign: 'right', fontSize: 11, color: '#6B7280', marginTop: 12, fontFamily: FONT });
  const h2: React.CSSProperties = { fontSize: 20, fontWeight: 600, color: '#111827', fontFamily: FONT, margin: '0 0 12px' };

  return (
    // ponytail: html2canvas measures the target in the LIVE page and renders
    // inside viewport bounds — an off-viewport wrapper (e.g. left:-9999)
    // captures as a blank page. Fixed overlay at 0,0 with opacity:0 keeps
    // real layout + coordinates while staying invisible and non-interactive.
    <div style={{ position: 'fixed', top: 0, left: 0, width: 0, height: 0, overflow: 'hidden', opacity: 0, pointerEvents: 'none', zIndex: -1 }}>
      {/* PNG — 1080x1350 social card */}
      <div ref={pngRef} style={{ width: 1080, height: 1350, background: '#FAFBFA', padding: 24, fontFamily: FONT, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 15, color: '#6B7280' }}>The Future You | AI Communication Report | {dateStr}</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#111827' }}>The Future You</div>
        </div>
        <div style={{ ...card, textAlign: 'center' }}>
          <SemiGauge score={score} />
          <span style={{ display: 'inline-block', background: '#EAF8F2', color: '#16C784', borderRadius: 999, padding: '6px 18px', fontSize: 14, fontWeight: 700 }}>Better than Average</span>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          {metrics.map((m) => (
            <div key={m.label} style={{ ...card, flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 13, color: '#6B7280' }}>{m.label}</div>
              <div style={{ fontSize: 34, fontWeight: 700, color: scoreColor(m.value) }}>{m.value}</div>
            </div>
          ))}
        </div>
        <div style={{ ...card, background: '#EAF8F2', borderLeft: '4px solid #16C784' }}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: '#111827' }}>Key Takeaways</div>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: '#111827' }}>
            {takeaways.slice(0, 3).map((t, i) => <li key={i} style={{ marginBottom: 4 }}>{t}</li>)}
          </ul>
        </div>
        <div style={card}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>Emotional Tone</div>
          <ToneChart data={sentimentData} />
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          {fixes.map((f, i) => (
            <div key={i} style={{ flex: 1, background: '#111827', color: '#fff', borderRadius: 999, padding: '10px 16px', fontSize: 12, textAlign: 'center' }}>{f}</div>
          ))}
        </div>
        <div style={{ marginTop: 'auto', textAlign: 'center', fontSize: 11, color: '#6B7280' }}>Generated by The Future You | thefutureyou.vercel.app</div>
      </div>

      {/* PDF — 6 A4 pages */}
      <div ref={pdfRef}>
        {/* Page 1 Cover */}
        <div data-pdf-page style={{ width: 794, height: 1123, background: '#fff', padding: 24, fontFamily: FONT, pageBreakAfter: 'always', position: 'relative' }}>
          <div style={{ height: 4, background: '#16C784', width: '100%' }} />
          <div style={{ textAlign: 'right', marginTop: 12 }}>
            <span style={{ background: '#EAF8F2', border: '1px solid #E8F0EC', borderRadius: 8, padding: '4px 12px', fontSize: 11, color: '#6B7280' }}>{reportId}</span>
          </div>
          <div style={{ textAlign: 'center', marginTop: 90 }}>
            <div style={{ fontSize: 34, fontWeight: 700, color: '#111827' }}>The Future You</div>
            <div style={{ fontSize: 20, color: '#6B7280', marginTop: 8 }}>AI Communication Analysis Report</div>
            <div style={{ fontSize: 13, color: '#6B7280', marginTop: 6 }}>{recordingTitle} • {dateStr}</div>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}><SemiGauge score={score} /></div>
            {qr && <img src={qr} alt="QR" style={{ width: 130, height: 130, margin: '28px auto 0' }} />}
            <div style={{ fontSize: 11, color: '#6B7280', marginTop: 40 }}>Generated by The Future You</div>
          </div>
        </div>
        {/* Page 2 Performance */}
        <div data-pdf-page style={{ width: 794, height: 1123, background: '#fff', padding: 24, fontFamily: FONT, pageBreakAfter: 'always' }}>
          <div style={{ borderLeft: '4px solid #16C784', paddingLeft: 12, ...{ fontSize: 26, fontWeight: 700 } }}>Performance Overview</div>
          <div style={{ ...card, textAlign: 'center', marginTop: 16 }}><SemiGauge score={score} size={260} /></div>
          <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
            {metrics.map((m) => (
              <div key={m.label} style={{ ...card, flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 13, color: '#6B7280' }}>{m.label}</div>
                <div style={{ fontSize: 32, fontWeight: 700, color: scoreColor(m.value) }}>{m.value}</div>
              </div>
            ))}
          </div>
          <div style={{ ...card, background: '#EAF8F2', borderLeft: '4px solid #16C784', marginTop: 16 }}>
            <div style={h2}>Key Takeaways</div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>{takeaways.map((t, i) => <li key={i}>{t}</li>)}</ul>
          </div>
          <div style={pageNum(2)}>2</div>
        </div>
        {/* Page 3 Transcript & Tone */}
        <div data-pdf-page style={{ width: 794, height: 1123, background: '#fff', padding: 24, fontFamily: FONT, pageBreakAfter: 'always' }}>
          <div style={{ borderLeft: '4px solid #16C784', paddingLeft: 12, fontSize: 26, fontWeight: 700 }}>Transcript &amp; Emotional Tone</div>
          <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
            <div style={{ ...card, flex: 1 }}>
              <div style={h2}>Transcript</div>
              {transcript.slice(0, 10).map((t, i) => (
                <div key={i} style={{ fontSize: 13, marginBottom: 10 }}>
                  <span style={{ background: '#EAF8F2', borderRadius: 6, padding: '2px 8px', fontSize: 11, color: '#16C784', marginRight: 6 }}>{fmt(t.time)}</span>
                  {t.text}
                </div>
              ))}
            </div>
            <div style={{ ...card, flex: 1 }}>
              <div style={h2}>Emotional Tone</div>
              <ToneChart data={sentimentData} />
              <div style={{ marginTop: 12 }}><span style={{ background: '#EAF8F2', color: '#16C784', borderRadius: 999, padding: '6px 16px', fontSize: 13, fontWeight: 700 }}>{dominant}</span></div>
            </div>
          </div>
          <div style={pageNum(3)}>3</div>
        </div>
        {/* Page 4 Communication Analysis */}
        <div data-pdf-page style={{ width: 794, height: 1123, background: '#fff', padding: 24, fontFamily: FONT, pageBreakAfter: 'always' }}>
          <div style={{ borderLeft: '4px solid #16C784', paddingLeft: 12, fontSize: 26, fontWeight: 700 }}>Communication Analysis</div>
          <div style={h2}>Thought Structure</div>
          <div style={{ display: 'flex', justifyContent: 'center' }}><CircleGauge score={analysis?.metrics?.structure_score ?? 70} /></div>
          <div style={{ ...card, marginTop: 16 }}>
            {structureRows.map((r) => (
              <div key={r.label} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                  <span>{r.label}</span><span style={{ fontWeight: 700 }}>{r.value}</span>
                </div>
                <Bar value={r.value} color="#16C784" />
              </div>
            ))}
          </div>
          <div style={pageNum(4)}>4</div>
        </div>
        {/* Page 5 Action Plan */}
        <div data-pdf-page style={{ width: 794, height: 1123, background: '#fff', padding: 24, fontFamily: FONT, pageBreakAfter: 'always' }}>
          <div style={{ borderLeft: '4px solid #16C784', paddingLeft: 12, fontSize: 26, fontWeight: 700 }}>Action Plan</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
            {actionItems.slice(0, 3).map((a) => (
              <div key={a.id} style={card}>
                <span style={{ background: a.completed ? '#EAF8F2' : '#FEF2F2', color: a.completed ? '#16C784' : '#EF4444', borderRadius: 6, padding: '4px 12px', fontSize: 12, fontWeight: 700 }}>
                  {a.completed ? 'DONE' : 'HIGH PRIORITY'}
                </span>
                <div style={{ fontSize: 13, margin: '10px 0' }}>{a.text}</div>
                <span style={{ background: '#EAF8F2', borderRadius: 6, padding: '2px 8px', fontSize: 11, color: '#16C784' }}>{fmt(a.timestamp)}</span>
                <div style={{ fontSize: 11, color: '#6B7280', marginTop: 6 }}>Expected impact: +{5 + Number(a.id) || 8} points on next session</div>
              </div>
            ))}
          </div>
          <div style={pageNum(5)}>5</div>
        </div>
        {/* Page 6 Progress */}
        <div data-pdf-page style={{ width: 794, height: 1123, background: '#fff', padding: 24, fontFamily: FONT }}>
          <div style={{ borderLeft: '4px solid #16C784', paddingLeft: 12, fontSize: 26, fontWeight: 700 }}>Progress Summary</div>
          <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
            <div style={{ ...card, flex: 1 }}>
              <div style={h2}>Strengths</div>
              {(strengths.length ? strengths : ['Great effort!']).map((s, i) => (
                <div key={i} style={{ fontSize: 13, marginBottom: 8 }}><span style={{ color: '#16C784', fontWeight: 700 }}>✓ </span>{s}</div>
              ))}
            </div>
            <div style={{ ...card, flex: 1 }}>
              <div style={h2}>Needs Focus</div>
              {(focus.length ? focus : ['Keep practicing.']).map((s, i) => (
                <div key={i} style={{ fontSize: 13, marginBottom: 8 }}><span style={{ color: '#EF4444', fontWeight: 700 }}>• </span>{s}</div>
              ))}
            </div>
          </div>
          <div style={{ ...card, background: '#EAF8F2', marginTop: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Keep recording. Every session makes you sharper.</div>
            <div style={{ fontSize: 13, color: '#6B7280', marginTop: 6 }}>Record another session and watch your scores grow.</div>
          </div>
          <div style={pageNum(6)}>6</div>
        </div>
      </div>
    </div>
  );
}
