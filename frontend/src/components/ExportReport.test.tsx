import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import ExportReport from './ExportReport';

const props = {
  analysis: {
    overall_score: 79,
    metrics: {
      clarity: { score: 45 },
      pacing: { score: 60 },
      posture: { score: 93 },
      sentiment: { score: 'Joy' },
      structure_score: 70,
    },
  },
  takeaways: ['Keep practicing daily.', 'Slow down on key lists.'],
  transcript: [{ time: 18, text: 'It tells me that you and I have something in common.' }],
  recordingTitle: 'Talking Head Sample .webm',
  recordingDate: new Date('2026-09-25T21:59:00').toISOString(),
  recordingDuration: 90,
  actionItems: [{ id: '1', text: 'Pause instead of filler words.', timestamp: 35, completed: false }],
  sentimentData: [{ time: '0:00', score: 30, label: 'Neutral' }],
};

describe('ExportReport', () => {
  it('renders capturable PNG/PDF templates with real content', () => {
    const pngRef = React.createRef<HTMLDivElement>();
    const pdfRef = React.createRef<HTMLDivElement>();
    render(<ExportReport {...props} pngRef={pngRef} pdfRef={pdfRef} />);

    // Content must exist — an empty template exports a blank page
    expect(pngRef.current?.textContent).toContain('79');
    expect(pngRef.current?.textContent).toContain('Key Takeaways');
    expect(pdfRef.current?.textContent).toContain('Talking Head Sample .webm');
    expect(pdfRef.current?.querySelectorAll('[data-pdf-page]').length).toBe(6);
  });

  it('keeps templates in-viewport so html2canvas can capture them', () => {
    const pngRef = React.createRef<HTMLDivElement>();
    const pdfRef = React.createRef<HTMLDivElement>();
    const { container } = render(<ExportReport {...props} pngRef={pngRef} pdfRef={pdfRef} />);

    // Regression: left:-9999 off-viewport wrappers capture as blank white pages
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.style.left).not.toBe('-9999px');
    expect(wrapper.style.top).not.toBe('-9999px');
    expect(wrapper.style.left).not.toBe('-9999');
    expect(wrapper.style.top).not.toBe('-9999');
    // Template keeps real dimensions for the capture
    expect((pngRef.current as HTMLElement).style.width).toBe('1080px');
  });
});
