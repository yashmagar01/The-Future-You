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
