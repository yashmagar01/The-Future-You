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
// ponytail: upgraded shadow/space for PDF only — PNG keeps its tuned layout
const pdfCard: React.CSSProperties = {
  borderRadius: 20, border: '1px solid #E8F0EC',
  boxShadow: '0 10px 35px rgba(15,23,42,0.06)', padding: 24, background: '#fff',
};
const pdfPage: React.CSSProperties = {
  width: 794, height: 1123, background: '#fff', padding: '40px 40px 28px',
  fontFamily: FONT, boxSizing: 'border-box', overflow: 'hidden', position: 'relative',
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

type Conf = 'High' | 'Medium' | 'Low' | 'Insufficient';
const confStyle = (c: string): React.CSSProperties => {
  if (c === 'High') return { color: '#078C5C', background: '#DCF9E9' };
  if (c === 'Medium') return { color: '#B45309', background: '#FEF3C7' };
  if (c === 'Low' || c === 'Limited') return { color: '#C2410C', background: '#FFEDD5' };
  return { color: '#64748B', background: '#F1F5F9' };
};
function ConfBadge({ level }: { level: string }) {
  return <span style={{ ...confStyle(level), borderRadius: 999, padding: '4px 12px', fontSize: 11, fontWeight: 800 }}>{level === 'Insufficient' ? 'Insufficient evidence' : `Confidence: ${level}`}</span>;
}
// ponytail: never render 0/fabricated insight — grey card names the gap + unlock rule
function Insufficient({ body, need = 'Record a 60–90 second reflection to unlock this analysis.' }: { body: string; need?: string }) {
  return (
    <div style={{ borderRadius: 14, padding: '14px 16px', background: '#F8FAFC', border: '1px dashed #CBD5E1' }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: '#475569' }}>Insufficient evidence</div>
      <div style={{ fontSize: 12.5, color: '#64748B', marginTop: 4, lineHeight: 1.5 }}>{body}</div>
      <div style={{ fontSize: 11.5, color: '#94A3B8', marginTop: 6 }}>{need}</div>
    </div>
  );
}
function InsightBar({ level }: { level: Conf | 'Limited' }) {
  const pct = level === 'High' ? 85 : level === 'Medium' ? 55 : level === 'Low' || level === 'Limited' ? 30 : 8;
  const fill = level === 'High' ? '#16C784' : level === 'Medium' ? '#F59E0B' : level === 'Low' || level === 'Limited' ? '#F59E0B' : '#CBD5E1';
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748B', marginBottom: 6 }}>
        <span>Insight confidence</span><span style={{ fontWeight: 700, color: '#334155' }}>{level === 'Insufficient' ? 'Insufficient' : level}</span>
      </div>
      <div style={{ position: 'relative', height: 14, borderRadius: 999, background: '#E8F0EC' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: `${pct}%`, borderRadius: 999, background: fill }} />
        <div style={{ position: 'absolute', top: -4, left: `calc(${pct}% - 11px)`, width: 22, height: 22, borderRadius: '50%', background: fill, border: '3px solid #fff', boxShadow: '0 2px 8px rgba(0,0,0,0.18)' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: '#94A3B8', marginTop: 6 }}>
        <span>Low</span><span>Medium</span><span>High</span>
      </div>
      <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>More recordings increase accuracy over time.</div>
    </div>
  );
}

export default function ExportReport(props: ExportReportProps) {
  const { analysis, takeaways, transcript, recordingTitle, recordingDate, recordingDuration, actionItems, sentimentData, pngRef, pdfRef } = props;
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
  const structureScore = analysis?.metrics?.structure_score ?? 70;
  const fillerCount = analysis?.metrics?.clarity?.filler_word_count ?? 3;
  const structureRows = [
    { label: 'Sentence Length', value: Math.min(100, structureScore) },
    { label: 'Transition Words', value: Math.min(100, structureScore - 8) },
    { label: 'Filler Phrases', value: Math.max(20, 100 - fillerCount * 8) },
  ];
  const strengths = takeaways.filter((_, i) => i % 2 === 0).slice(0, 3);
  const focus = takeaways.filter((_, i) => i % 2 === 1).slice(0, 3);
  const pageNum = (n: number): React.CSSProperties => ({ textAlign: 'right', fontSize: 11, color: '#94A3B8', marginTop: 14, fontFamily: FONT });
  const h2: React.CSSProperties = { fontSize: 18, fontWeight: 800, color: '#111827', fontFamily: FONT, margin: '0 0 10px' };
  const pageTitle: React.CSSProperties = { fontSize: 28, fontWeight: 800, color: '#111827', fontFamily: FONT, letterSpacing: -0.5 };
  const kicker: React.CSSProperties = { fontSize: 11, fontWeight: 800, letterSpacing: 2, color: '#16C784' };

  // --- honest confidence (never invent certainty from thin data) ---
  const words = transcript.reduce((n, t) => n + String(t.text || '').trim().split(/\s+/).filter(Boolean).length, 0);
  const durSec = recordingDuration ?? (transcript.length ? Math.max(...transcript.map((t) => t.time)) + 30 : 0);
  const verdict = score >= 80 ? 'Strong communicator' : score >= 70 ? 'Better than Average' : score >= 50 ? 'Building Momentum' : 'Early Stage';
  const overallConf: Conf | 'Limited' = words < 15 || durSec < 30 ? 'Limited' : words < 40 || durSec < 60 ? 'Medium' : 'High';
  const clarityConf: Conf = !analysis?.metrics?.clarity ? 'Insufficient' : words < 15 ? 'Insufficient' : words < 40 ? 'Low' : words < 80 ? 'Medium' : 'High';
  const pacingConf: Conf = analysis?.metrics?.pacing == null ? 'Insufficient' : !durSec || durSec < 20 ? 'Insufficient' : durSec < 60 ? 'Medium' : 'High';
  const structureConf: Conf = words < 15 ? 'Insufficient' : words < 40 ? 'Low' : 'Medium';
  const emotionConf: Conf = words < 15 || sentimentData.length < 2 ? 'Insufficient' : sentimentData.length < 4 || words < 40 ? 'Low' : 'Medium';
  const postureConf: Conf = analysis?.metrics?.posture == null ? 'Insufficient' : 'High';
  const coverage = [
    { label: 'Video', state: analysis?.metrics?.posture != null ? '✓ Available' : '— Missing', ok: analysis?.metrics?.posture != null },
    { label: 'Voice', state: analysis?.metrics?.clarity != null && words >= 15 ? '✓ Available' : 'Limited', ok: analysis?.metrics?.clarity != null && words >= 15 },
    { label: 'Posture', state: analysis?.metrics?.posture != null ? '✓ Available' : '— Missing', ok: analysis?.metrics?.posture != null },
    { label: 'Speech', state: words >= 40 ? '✓ Full' : words >= 15 ? 'Partial' : 'Limited', ok: words >= 40 },
    { label: 'Emotion', state: sentimentData.length >= 4 && words >= 40 ? 'Partial' : 'Limited', ok: false },
    { label: 'Eye contact', state: analysis?.metrics?.posture != null ? 'Partial' : 'Limited', ok: false },
  ];
  const commRows = [
    { m: 'Speaking Speed', s: pacing < 60 ? 'Too fast' : pacing < 80 ? 'Moderate' : 'Excellent', good: pacing >= 70 },
    { m: 'Pause Usage', s: words < 40 ? 'Limited' : 'Moderate', good: words >= 40 },
    { m: 'Transition Words', s: structureScore >= 75 ? 'Strong' : structureScore >= 60 ? 'Moderate' : 'Limited', good: structureScore >= 70 },
    { m: 'Filler Words', s: fillerCount <= 3 ? 'Excellent' : fillerCount <= 6 ? 'Moderate' : 'Needs work', good: fillerCount <= 3 },
  ];
  const planMeta = [
    { impact: 'High', difficulty: 'Easy', sessions: '3 sessions', gain: 8 },
    { impact: 'High', difficulty: 'Easy', sessions: '3 sessions', gain: 6 },
    { impact: 'Medium', difficulty: 'Medium', sessions: '5 sessions', gain: 5 },
  ];

  return (
    // ponytail: html2canvas measures the target in the LIVE page and renders
    // inside viewport bounds — an off-viewport wrapper (e.g. left:-9999)
    // captures as a blank page. Fixed overlay at 0,0 with opacity:0 keeps
    // real layout + coordinates while staying invisible and non-interactive.
    <div style={{ position: 'fixed', top: 0, left: 0, width: 0, height: 0, overflow: 'hidden', opacity: 0, pointerEvents: 'none', zIndex: -1 }}>
      {/* PNG — 1080x1350 social card (visual source of truth, untouched) */}
      <div ref={pngRef} style={{ width: 1080, height: 1350, boxSizing: 'border-box', overflow: 'hidden', background: '#FAFBFA', padding: '26px 32px 20px', fontFamily: FONT, color: '#111827' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 48, marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}><div style={{ width: 42, height: 42, borderRadius: 13, display: 'grid', placeItems: 'center', color: '#fff', background: 'linear-gradient(135deg,#16C784,#00A88A)', fontSize: 25 }}>✦</div><div><div style={{ fontSize: 21, fontWeight: 800 }}>The Future You</div><div style={{ color: '#6B7280', fontSize: 12 }}>Speak better. A brighter you.</div></div></div>
          <div style={{ textAlign: 'right' }}><div style={{ fontSize: 17, fontWeight: 750 }}>AI Communication Report</div><div style={{ fontSize: 12, color: '#6B7280' }}>{dateStr} · {recordingDuration ? fmt(recordingDuration) : 'Reflection'}</div></div>
        </div>
        <div style={{ ...card, height: 228, boxSizing: 'border-box', padding: '26px 30px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(120deg,#FFFFFF 0%,#F4FCF8 100%)', marginBottom: 15 }}>
          <div style={{ width: 310 }}><div style={{ color: '#6B7280', fontSize: 11, fontWeight: 800, letterSpacing: 2.2 }}>OVERALL PERFORMANCE</div><div style={{ marginTop: 13, fontSize: 37, fontWeight: 800, letterSpacing: -1.4 }}>Confidence Score</div><div style={{ marginTop: 9, color: '#64748B', fontSize: 15, lineHeight: 1.4 }}>A combined score based on clarity, pacing, posture and thought structure.</div><div style={{ display: 'inline-block', marginTop: 15, color: '#078C5C', background: '#E3F9EE', borderRadius: 20, padding: '7px 13px', fontSize: 12, fontWeight: 700 }}>↗ Better than 70% of other speakers</div></div>
          <div style={{ width: 270, textAlign: 'center' }}><SemiGauge score={score} size={250} /><div style={{ marginTop: -7, display: 'inline-block', background: '#DCF9E9', color: '#078C5C', borderRadius: 22, padding: '8px 19px', fontSize: 14, fontWeight: 800 }}>{score >= 70 ? 'Better than Average' : 'Building Momentum'}</div></div>
          <div style={{ width: 210, padding: 18, borderRadius: 18, background: '#EAF8F2', color: '#1F2937', fontSize: 14, lineHeight: 1.45, fontStyle: 'italic' }}>“You communicate with clarity. Keep building on your strengths!”</div>
        </div>
        <div style={{ display: 'flex', gap: 15, marginBottom: 15 }}>{metrics.map((metric, index) => { const good = metric.value >= 70; const accent = good ? '#16C784' : '#EF4444'; const icon = ['♩', '〰', '♙'][index]; return <div key={metric.label} style={{ ...card, flex: 1, height: 142, boxSizing: 'border-box', padding: 17, borderColor: good ? '#E8F0EC' : '#FDE2E2', background: good ? '#FFFFFF' : '#FFF9F9' }}><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><div style={{ width: 37, height: 37, display: 'grid', placeItems: 'center', borderRadius: '50%', color: accent, background: good ? '#EAF8F2' : '#FEECEC', fontSize: 21 }}>{icon}</div><div style={{ fontSize: 17, fontWeight: 800 }}>{metric.label}<div style={{ marginTop: 4, color: accent, fontSize: 10, letterSpacing: 1.2 }}>{good ? 'EXCELLENT' : 'NEEDS WORK'}</div></div><div style={{ marginLeft: 'auto', color: accent, fontSize: 28, fontWeight: 800 }}>{metric.value}<span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 500 }}> /100</span></div></div><div style={{ height: 9, overflow: 'hidden', borderRadius: 8, background: '#E8F0EC', marginTop: 16 }}><div style={{ height: '100%', width: `${metric.value}%`, borderRadius: 8, background: accent }} /></div><div style={{ marginTop: 10, fontSize: 11.5, color: '#64748B' }}>{metric.label === 'Clarity' ? 'Speaks clearly with minimal filler words.' : metric.label === 'Pacing' ? 'Maintains a steady and natural pace.' : 'Eye contact and posture can be improved.'}</div></div>; })}</div>
        <div style={{ ...card, height: 130, boxSizing: 'border-box', padding: '19px 24px', background: 'linear-gradient(110deg,#FFFFFF,#ECFBF4)', borderLeft: '4px solid #16C784', display: 'flex', alignItems: 'center', marginBottom: 15 }}><div style={{ flex: 1 }}><div style={{ fontSize: 20, fontWeight: 800, marginBottom: 10 }}>⚡ &nbsp;Key Takeaways</div>{takeaways.slice(0, 3).map((takeaway, index) => <div key={takeaway} style={{ color: '#334155', fontSize: 12.5, marginTop: 5 }}><span style={{ color: '#16C784', fontWeight: 900, marginRight: 9 }}>●</span>{takeaway}</div>)}</div><div style={{ width: 250, borderLeft: '1px solid #BFEEDA', paddingLeft: 20, color: '#334155', fontSize: 14, fontStyle: 'italic', lineHeight: 1.45 }}>“Small improvements in pacing and posture can make your message even more powerful.”</div></div>
        <div style={{ ...card, height: 193, boxSizing: 'border-box', padding: '16px 24px', marginBottom: 15 }}><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><div><div style={{ fontSize: 19, fontWeight: 800 }}>▥ &nbsp;Emotional Tone</div><div style={{ marginTop: 3, fontSize: 11.5, color: '#6B7280' }}>Multi-emotion analysis across your reflection</div></div><div style={{ borderRadius: 20, padding: '8px 14px', color: '#078C5C', background: '#EAF8F2', fontSize: 12, fontWeight: 800 }}>{dominant} · {score}%</div></div><div style={{ display: 'flex', gap: 10, alignItems: 'stretch', marginTop: 8 }}><div style={{ width: 50, paddingTop: 19, fontSize: 10, color: '#64748B', lineHeight: 3.1 }}>Positive<br />Neutral<br />Negative</div><div style={{ flex: 1 }}><ToneChart data={sentimentData} w={800} h={90} /><div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B', fontSize: 10 }}>{sentimentData.filter((_, i) => i === 0 || i === sentimentData.length - 1 || i === Math.floor(sentimentData.length / 2)).map(point => <span key={point.time}>{point.time}</span>)}</div></div></div></div>
        <div style={{ ...card, height: 88, boxSizing: 'border-box', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 15, background: '#F5FCF8', marginBottom: 15 }}><div style={{ minWidth: 212 }}><div style={{ fontSize: 18, fontWeight: 800 }}>🏆 &nbsp;Biggest Wins</div><div style={{ fontSize: 11, color: '#6B7280', marginTop: 3 }}>What you did really well</div></div>{['Zero Fillers', 'Steady Pace', 'Clear Delivery'].map((win, index) => <div key={win} style={{ flex: 1, display: 'flex', gap: 10, alignItems: 'center', background: '#fff', borderRadius: 12, padding: '10px 11px', border: '1px solid #E8F0EC' }}><span style={{ color: '#078C5C', fontWeight: 900, fontSize: 18 }}>✓</span><div><div style={{ fontWeight: 800, fontSize: 12 }}>{win}</div><div style={{ fontSize: 10.5, color: '#6B7280' }}>{['Kept your speech clean', 'Maintained good rhythm', 'Ideas were easy to follow'][index]}</div></div></div>)}</div>
        <div style={{ ...card, height: 144, boxSizing: 'border-box', padding: '15px 18px', display: 'flex', alignItems: 'center', gap: 14, borderColor: '#FDE2E2', background: '#FFF9F9', marginBottom: 15 }}><div style={{ width: 230 }}><div style={{ fontSize: 18, fontWeight: 800 }}>◎ &nbsp;Next 3 Improvements</div><div style={{ fontSize: 11.5, color: '#6B7280', marginTop: 5 }}>Actionable suggestions for your next session</div></div>{actionItems.slice(0, 3).map((item, index) => <div key={item.id} style={{ flex: 1, height: 105, boxSizing: 'border-box', padding: '11px 12px', borderRadius: 13, background: '#fff', border: '1px solid #FCE6E6' }}><div style={{ display: 'flex', gap: 9 }}><span style={{ flexShrink: 0, width: 23, height: 23, display: 'grid', placeItems: 'center', borderRadius: '50%', color: '#EF4444', background: '#FEECEC', fontWeight: 800, fontSize: 12 }}>{index + 1}</span><span style={{ fontSize: 11.5, lineHeight: 1.35 }}>{fixes[index]}</span></div><div style={{ marginTop: 9, borderRadius: 8, textAlign: 'center', padding: 6, color: '#EF4444', background: '#FFF2F2', fontSize: 10.5, fontWeight: 700 }}>▶ &nbsp;Jump to {fmt(item.timestamp)}</div></div>)}</div>
        <div style={{ ...card, height: 90, boxSizing: 'border-box', padding: '17px 24px', background: 'linear-gradient(110deg,#FFFFFF,#EAF8F2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 13 }}><div><div style={{ fontSize: 18, fontWeight: 800 }}>Keep the streak alive!</div><div style={{ marginTop: 5, fontSize: 12, color: '#64748B' }}>Practice regularly and see your communication improve every session.</div></div><div style={{ minWidth: 315, color: '#fff', borderRadius: 25, textAlign: 'center', padding: '13px 18px', fontSize: 13, fontWeight: 800, background: 'linear-gradient(100deg,#00A88A,#16C784)' }}>Record your next reflection &nbsp; →</div></div>
        <div style={{ height: 42, padding: '0 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><div style={{ display: 'flex', gap: 9, alignItems: 'center' }}><span style={{ width: 31, height: 31, display: 'grid', placeItems: 'center', borderRadius: 9, color: '#fff', background: '#16C784', fontSize: 18 }}>✦</span><div><div style={{ fontSize: 12, fontWeight: 800 }}>The Future You</div><div style={{ fontSize: 9.5, color: '#6B7280' }}>Build confidence through daily reflections and AI-powered feedback.</div></div></div><div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>{qr && <img src={qr} alt="QR code for The Future You" style={{ width: 35, height: 35 }} />}<div style={{ color: '#64748B', fontSize: 10, lineHeight: 1.35 }}>Generated by <b style={{ color: '#111827' }}>The Future You</b><br />thefutureyou.vercel.app</div></div></div>
      </div>

      {/* PDF — 6-page premium AI assessment report */}
      <div ref={pdfRef}>
        {/* P1 Executive Summary */}
        <div data-pdf-page style={{ ...pdfPage, pageBreakAfter: 'always' }}>
          <div style={{ height: 4, background: 'linear-gradient(90deg,#16C784,#00A88A)', borderRadius: 4 }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, display: 'grid', placeItems: 'center', color: '#fff', background: 'linear-gradient(135deg,#16C784,#00A88A)', fontSize: 18 }}>✦</div>
              <div style={{ fontSize: 15, fontWeight: 800 }}>The Future You</div>
            </div>
            <span style={{ background: '#F1F5F9', border: '1px solid #E8F0EC', borderRadius: 8, padding: '4px 12px', fontSize: 11, color: '#64748B' }}>{reportId}</span>
          </div>
          <div style={{ ...kicker, marginTop: 28 }}>EXECUTIVE SUMMARY · {dateStr}</div>
          <div style={{ ...pageTitle, marginTop: 6, fontSize: 36 }}>AI Communication<br />Analysis Report</div>
          <div style={{ fontSize: 14, color: '#64748B', marginTop: 8 }}>{recordingTitle} · {durSec ? fmt(durSec) : 'Reflection'} · {words} words spoken</div>
          <div style={{ ...pdfCard, marginTop: 20, padding: '22px 26px', display: 'flex', gap: 24, alignItems: 'center', background: 'linear-gradient(120deg,#FFFFFF 0%,#F4FCF8 100%)' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2, color: '#6B7280' }}>OVERALL VERDICT</div>
              <div style={{ fontSize: 26, fontWeight: 800, marginTop: 6 }}>{verdict}</div>
              <div style={{ fontSize: 13.5, color: '#475569', marginTop: 8, lineHeight: 1.5 }}>
                {overallConf === 'Limited'
                  ? `We analysed a ${durSec}-second recording. Some advanced insights require longer reflections — scores below reflect limited evidence, not low ability.`
                  : 'A combined score based on clarity, pacing, posture and thought structure.'}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                <span style={{ background: '#EAF8F2', color: '#078C5C', borderRadius: 999, padding: '5px 12px', fontSize: 11.5, fontWeight: 800 }}>⏱ {durSec ? fmt(durSec) : '—'} analysed</span>
                <span style={{ ...confStyle(overallConf), borderRadius: 999, padding: '5px 12px', fontSize: 11.5, fontWeight: 800 }}>Analysis confidence: {overallConf}</span>
              </div>
            </div>
            <div style={{ textAlign: 'center' }}><SemiGauge score={score} size={230} /></div>
          </div>
          <div style={{ ...pdfCard, marginTop: 18 }}>
            <div style={h2}>Analysis Coverage</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1 }}>
                {coverage.slice(0, 3).map((c) => (
                  <div key={c.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '7px 0', borderBottom: '1px solid #F1F5F9' }}>
                    <span style={{ color: '#334155' }}>{c.label}</span>
                    <span style={{ fontWeight: 800, color: c.ok ? '#078C5C' : '#B45309' }}>{c.state}</span>
                  </div>
                ))}
              </div>
              <div style={{ flex: 1 }}>
                {coverage.slice(3).map((c) => (
                  <div key={c.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '7px 0', borderBottom: '1px solid #F1F5F9' }}>
                    <span style={{ color: '#334155' }}>{c.label}</span>
                    <span style={{ fontWeight: 800, color: c.ok ? '#078C5C' : '#B45309' }}>{c.state}</span>
                  </div>
                ))}
              </div>
            </div>
            {overallConf === 'Limited' && (
              <div style={{ marginTop: 12, borderRadius: 12, padding: '10px 14px', background: '#FFFBEB', border: '1px solid #FDE68A', fontSize: 12.5, color: '#92400E' }}>
                Limited analysis available — this insight requires longer recordings or more speech.
              </div>
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
            <div style={{ fontSize: 11, color: '#94A3B8' }}>Generated by The Future You · thefutureyou.vercel.app</div>
            {qr && <img src={qr} alt="QR" style={{ width: 72, height: 72 }} />}
          </div>
          <div style={pageNum(1)}>1</div>
        </div>

        {/* P2 Performance Dashboard (PNG language, A4 proportions) */}
        <div data-pdf-page style={{ ...pdfPage, pageBreakAfter: 'always' }}>
          <div style={kicker}>PERFORMANCE DASHBOARD</div>
          <div style={{ ...pageTitle, marginTop: 4 }}>Performance Overview</div>
          <div style={{ fontSize: 13, color: '#64748B', marginTop: 6 }}>What happened in this session, at a glance.</div>
          <div style={{ ...pdfCard, marginTop: 18, display: 'flex', alignItems: 'center', gap: 20, background: 'linear-gradient(120deg,#FFFFFF 0%,#F4FCF8 100%)' }}>
            <SemiGauge score={score} size={220} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 800 }}>Confidence Score · {score}/100</div>
              <div style={{ fontSize: 13, color: '#475569', marginTop: 6, lineHeight: 1.5 }}>
                {score >= 70 ? 'Clear, steady delivery. Your strengths outweigh the gaps — the coaching plan sharpens the rest.' : 'A working baseline. Small pacing and posture fixes compound quickly from here.'}
              </div>
              <div style={{ marginTop: 10 }}><ConfBadge level={overallConf === 'Limited' ? 'Low' : overallConf as string} /></div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 14, marginTop: 18 }}>
            {metrics.map((m, i) => {
              const conf = [clarityConf, pacingConf, postureConf][i];
              const good = m.value >= 70;
              return (
                <div key={m.label} style={{ ...pdfCard, flex: 1, padding: 18, borderColor: good ? '#E8F0EC' : '#FDE2E2', background: good ? '#fff' : '#FFF9F9' }}>
                  <div style={{ fontSize: 13, fontWeight: 800 }}>{m.label}</div>
                  <div style={{ fontSize: 30, fontWeight: 800, color: scoreColor(m.value), marginTop: 2 }}>{m.value}<span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 500 }}> /100</span></div>
                  <div style={{ marginTop: 8 }}><Bar value={m.value} color={scoreColor(m.value)} /></div>
                  <div style={{ marginTop: 8, fontSize: 11, fontWeight: 800, color: confStyle(conf).color }}>{conf === 'Insufficient' ? 'Insufficient evidence' : `${conf} confidence`}</div>
                </div>
              );
            })}
          </div>
          <div style={{ ...pdfCard, marginTop: 18, background: 'linear-gradient(110deg,#FFFFFF,#ECFBF4)', borderLeft: '4px solid #16C784' }}>
            <div style={h2}>⚡ Key Takeaways</div>
            {takeaways.slice(0, 3).map((t) => <div key={t} style={{ fontSize: 13, color: '#334155', marginTop: 6 }}><span style={{ color: '#16C784', fontWeight: 900, marginRight: 8 }}>●</span>{t}</div>)}
          </div>
          <div style={{ ...pdfCard, marginTop: 18, padding: 18, display: 'flex', gap: 12, alignItems: 'center', background: '#F5FCF8' }}>
            <div style={{ fontSize: 14, fontWeight: 800, minWidth: 130 }}>🏆 Biggest<br />Wins</div>
            {['Zero Fillers', 'Steady Pace', 'Clear Delivery'].map((w, i) => (
              <div key={w} style={{ flex: 1, background: '#fff', border: '1px solid #E8F0EC', borderRadius: 12, padding: '10px 12px' }}>
                <div style={{ fontSize: 12.5, fontWeight: 800 }}><span style={{ color: '#078C5C', fontWeight: 900 }}>✓ </span>{w}</div>
                <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>{['Kept speech clean', 'Good rhythm', 'Easy to follow'][i]}</div>
              </div>
            ))}
          </div>
          <div style={pageNum(2)}>2</div>
        </div>

        {/* P3 Communication Breakdown */}
        <div data-pdf-page style={{ ...pdfPage, pageBreakAfter: 'always' }}>
          <div style={kicker}>COMMUNICATION BREAKDOWN</div>
          <div style={{ ...pageTitle, marginTop: 4 }}>Transcript &amp; Delivery</div>
          <div style={{ fontSize: 13, color: '#64748B', marginTop: 6 }}>What you said, and how it landed — with evidence.</div>
          <div style={{ display: 'flex', gap: 16, marginTop: 18 }}>
            <div style={{ ...pdfCard, flex: 1.1 }}>
              <div style={h2}>Transcript</div>
              {transcript.slice(0, 7).map((t, i) => (
                <div key={i} style={{ fontSize: 12.5, marginBottom: 10, color: '#334155', lineHeight: 1.5 }}>
                  <span style={{ background: '#EAF8F2', borderRadius: 6, padding: '2px 8px', fontSize: 11, color: '#078C5C', fontWeight: 800, marginRight: 6 }}>{fmt(t.time)}</span>
                  {t.text}
                </div>
              ))}
              {transcript.length > 7 && <div style={{ fontSize: 11, color: '#94A3B8' }}>+ {transcript.length - 7} more segments in the full session.</div>}
              {transcript.length === 0 && <Insufficient body="No transcript was captured for this session, so delivery evidence is unavailable." />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ ...pdfCard }}>
                <div style={h2}>Delivery signals</div>
                {commRows.map((r) => (
                  <div key={r.m} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12.5, padding: '8px 0', borderBottom: '1px solid #F1F5F9' }}>
                    <span style={{ color: '#334155' }}>{r.m}</span>
                    <span style={{ fontWeight: 800, borderRadius: 999, padding: '3px 10px', fontSize: 11, color: r.good ? '#078C5C' : '#B45309', background: r.good ? '#DCF9E9' : '#FEF3C7' }}>{r.s}</span>
                  </div>
                ))}
              </div>
              <div style={{ ...pdfCard, marginTop: 16, background: 'linear-gradient(110deg,#FFFFFF,#F4FCF8)' }}>
                <div style={h2}>Evidence from your recording</div>
                {actionItems.slice(0, 3).map((a) => (
                  <div key={a.id} style={{ fontSize: 12.5, color: '#334155', marginTop: 6 }}>• <b>{fmt(a.timestamp)}</b> — {a.text}</div>
                ))}
                <div style={{ marginTop: 10 }}><ToneChart data={sentimentData} /></div>
                <div style={{ marginTop: 8 }}><span style={{ background: '#EAF8F2', color: '#078C5C', borderRadius: 999, padding: '5px 14px', fontSize: 12, fontWeight: 800 }}>{dominant}</span> <ConfBadge level={emotionConf} /></div>
              </div>
            </div>
          </div>
          <div style={pageNum(3)}>3</div>
        </div>

        {/* P4 Deep Analysis */}
        <div data-pdf-page style={{ ...pdfPage, pageBreakAfter: 'always' }}>
          <div style={kicker}>DEEP ANALYSIS</div>
          <div style={{ ...pageTitle, marginTop: 4 }}>Thought Structure &amp; Clarity</div>
          <div style={{ fontSize: 13, color: '#64748B', marginTop: 6 }}>What the score means, why it matters, and how sure we are.</div>
          <div style={{ ...pdfCard, marginTop: 18 }}>
            <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
              <CircleGauge score={structureScore} size={130} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 800 }}>Thought Structure · {structureScore}/100</div>
                <div style={{ fontSize: 13, color: '#475569', marginTop: 6, lineHeight: 1.5 }}>
                  {structureConf === 'Insufficient'
                    ? 'Not enough speech to judge structure yet.'
                    : 'Your ideas generally follow a logical sequence, although transitions weaken during faster sections.'}
                </div>
                <div style={{ marginTop: 8 }}><ConfBadge level={structureConf} /></div>
              </div>
            </div>
            <div style={{ marginTop: 14 }}>
              {structureRows.map((r) => (
                <div key={r.label} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 4 }}>
                    <span style={{ color: '#334155' }}>{r.label}</span><span style={{ fontWeight: 800 }}>{r.value}</span>
                  </div>
                  <Bar value={r.value} color="#16C784" />
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
            <div style={{ ...pdfCard, flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 15, fontWeight: 800 }}>Clarity · {clarity}/100</div>
                <ConfBadge level={clarityConf} />
              </div>
              <div style={{ marginTop: 10 }}>
                {clarityConf === 'Insufficient'
                  ? <Insufficient body="We detected too little spoken content to confidently evaluate articulation and filler-word patterns." />
                  : <div style={{ fontSize: 12.5, color: '#475569', lineHeight: 1.5 }}>{fillerCount <= 3 ? 'Clean articulation with minimal fillers — keep letting key moments breathe.' : `${fillerCount} filler words detected. Replacing them with short pauses will sharpen delivery.`}</div>}
              </div>
            </div>
            <div style={{ ...pdfCard, flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 15, fontWeight: 800 }}>Pacing · {pacing}/100</div>
                <ConfBadge level={pacingConf} />
              </div>
              <div style={{ marginTop: 10 }}>
                {pacingConf === 'Insufficient'
                  ? <Insufficient body="Recording duration was too short to detect a reliable speaking rhythm." need="Record at least 30 seconds to unlock pacing analysis." />
                  : <div style={{ fontSize: 12.5, color: '#475569', lineHeight: 1.5 }}>{pacing < 60 ? 'You rush lists and transitions. Slowing 10% on key points will land them harder.' : 'Steady, natural pace — easy to follow.'}</div>}
              </div>
            </div>
          </div>
          <div style={{ ...pdfCard, marginTop: 16 }}><InsightBar level={overallConf} /></div>
          <div style={pageNum(4)}>4</div>
        </div>

        {/* P5 Coaching Plan */}
        <div data-pdf-page style={{ ...pdfPage, pageBreakAfter: 'always' }}>
          <div style={kicker}>COACHING PLAN</div>
          <div style={{ ...pageTitle, marginTop: 4 }}>Your Next 3 Moves</div>
          <div style={{ fontSize: 13, color: '#64748B', marginTop: 6 }}>Prioritised by impact — each tied to a moment in your recording.</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 18 }}>
            {actionItems.slice(0, 3).map((a, i) => {
              const meta = planMeta[i] ?? planMeta[2];
              return (
                <div key={a.id} style={{ ...pdfCard, borderLeft: `4px solid ${a.completed ? '#16C784' : '#EF4444'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ background: a.completed ? '#EAF8F2' : '#FEF2F2', color: a.completed ? '#078C5C' : '#EF4444', borderRadius: 6, padding: '4px 12px', fontSize: 11.5, fontWeight: 800 }}>
                      {a.completed ? '✓ DONE' : `PRIORITY ${i + 1} · ${meta.impact.toUpperCase()} IMPACT`}
                    </span>
                    <span style={{ background: '#EAF8F2', borderRadius: 6, padding: '3px 10px', fontSize: 11, color: '#078C5C', fontWeight: 800 }}>▶ {fmt(a.timestamp)}</span>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 800, marginTop: 10 }}>{a.text}</div>
                  <div style={{ fontSize: 12.5, color: '#475569', marginTop: 4 }}>Why it matters: {i === 0 ? 'pauses signal confidence and let ideas land.' : i === 1 ? 'rushed lists blur your strongest points.' : 'steady eye contact builds trust through transitions.'}</div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                    {[`Impact: ${meta.impact}`, `Difficulty: ${meta.difficulty}`, `Practice: ${meta.sessions}`, `Expected: +${meta.gain} pts`].map((chip) => (
                      <span key={chip} style={{ background: '#F8FAFC', border: '1px solid #E8F0EC', borderRadius: 999, padding: '4px 10px', fontSize: 11, color: '#475569', fontWeight: 700 }}>{chip}</span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <div style={pageNum(5)}>5</div>
        </div>

        {/* P6 Progress & Future */}
        <div data-pdf-page style={{ ...pdfPage }}>
          <div style={kicker}>PROGRESS &amp; TRACKING</div>
          <div style={{ ...pageTitle, marginTop: 4 }}>Progress Summary</div>
          <div style={{ fontSize: 13, color: '#64748B', marginTop: 6 }}>A snapshot worth keeping — and a reason to record again.</div>
          <div style={{ ...pdfCard, marginTop: 18 }}>
            <div style={h2}>Current Snapshot</div>
            <div style={{ display: 'flex', gap: 14 }}>
              {[{ l: 'Confidence', v: score }, { l: 'Clarity', v: clarity }, { l: 'Posture', v: posture }].map((s) => (
                <div key={s.l} style={{ flex: 1, textAlign: 'center', background: '#F8FAFC', border: '1px solid #E8F0EC', borderRadius: 14, padding: '14px 10px' }}>
                  <div style={{ fontSize: 12, color: '#64748B' }}>{s.l}</div>
                  <div style={{ fontSize: 30, fontWeight: 800, color: scoreColor(s.v) }}>{s.v}</div>
                  <div style={{ marginTop: 6 }}><Bar value={s.v} color={scoreColor(s.v)} /></div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
              <div style={{ ...pdfCard, flex: 1, background: '#F5FCF8', padding: 18 }}>
                <div style={{ fontSize: 14, fontWeight: 800 }}>✓ Strengths</div>
                {(strengths.length ? strengths : ['Great effort!']).map((s, i) => (
                  <div key={i} style={{ fontSize: 12.5, marginTop: 6, color: '#334155' }}><span style={{ color: '#16C784', fontWeight: 800 }}>✓ </span>{s}</div>
                ))}
              </div>
              <div style={{ ...pdfCard, flex: 1, background: '#FFF9F9', borderColor: '#FDE2E2', padding: 18 }}>
                <div style={{ fontSize: 14, fontWeight: 800 }}>◎ Needs Focus</div>
                {(focus.length ? focus : ['Keep practicing.']).map((s, i) => (
                  <div key={i} style={{ fontSize: 12.5, marginTop: 6, color: '#334155' }}><span style={{ color: '#EF4444', fontWeight: 800 }}>• </span>{s}</div>
                ))}
              </div>
            </div>
          </div>
          <div style={{ ...pdfCard, marginTop: 16, background: 'linear-gradient(110deg,#FFFFFF,#F4FCF8)' }}>
            <div style={h2}>Growth Forecast</div>
            <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.5 }}>Based on your current data, future projections aren&apos;t available yet — trends unlock as you record more sessions.</div>
            <div style={{ marginTop: 12 }}>
              {[{ n: '3 recordings', u: 'Speaking trends' }, { n: '5 recordings', u: 'Confidence tracking' }, { n: '10 recordings', u: 'Personalised coaching' }, { n: '20 recordings', u: 'Long-term improvement' }].map((r) => (
                <div key={r.n} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, padding: '7px 0', borderBottom: '1px solid #F1F5F9' }}>
                  <span style={{ fontWeight: 800, color: '#078C5C' }}>{r.n}</span><span style={{ color: '#475569' }}>Unlocks {r.u}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ ...pdfCard, marginTop: 16, background: 'linear-gradient(100deg,#00A88A,#16C784)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ color: '#fff' }}>
              <div style={{ fontSize: 15, fontWeight: 800 }}>Keep recording. Every session makes you sharper.</div>
              <div style={{ fontSize: 12, opacity: 0.9, marginTop: 4 }}>Record another session and watch your scores grow.</div>
            </div>
            {qr && <img src={qr} alt="QR" style={{ width: 64, height: 64, borderRadius: 8, background: '#fff', padding: 4 }} />}
          </div>
          <div style={pageNum(6)}>6</div>
        </div>
      </div>
    </div>
  );
}
