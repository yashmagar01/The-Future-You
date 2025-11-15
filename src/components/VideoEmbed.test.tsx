import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import VideoEmbed from './VideoEmbed';

describe('VideoEmbed', () => {
  const mockProps = {
    src: 'https://www.youtube.com/watch?v=dfNdRsNSFx4',
    title: 'Test Video',
    poster: '/test-poster.jpg',
    caption: 'Test caption'
  };

  it('renders with poster and play button initially', () => {
    render(<VideoEmbed {...mockProps} />);
    
    // Check if play button is visible
    const playButton = screen.getByRole('button', { name: /play video: test video/i });
    expect(playButton).toBeInTheDocument();
    
    // Check if title is displayed
    expect(screen.getByText('Test Video')).toBeInTheDocument();
    
    // Check if caption is displayed
    expect(screen.getByText('Test caption')).toBeInTheDocument();
  });

  it('does not render iframe before clicking play', () => {
    render(<VideoEmbed {...mockProps} />);
    
    // iframe should not be in the document initially
    const iframe = screen.queryByTitle('Test Video');
    expect(iframe).not.toBeInTheDocument();
  });

  it('inserts iframe when play button is clicked', async () => {
    render(<VideoEmbed {...mockProps} />);
    
    // Click the play button
    const playButton = screen.getByRole('button', { name: /play video: test video/i });
    fireEvent.click(playButton);
    
    // Wait for iframe to appear
    await waitFor(() => {
      const iframe = screen.getByTitle('Test Video');
      expect(iframe).toBeInTheDocument();
      expect(iframe).toHaveAttribute('src', expect.stringContaining('youtube'));
    });
  });

  it('supports keyboard navigation with Enter key', async () => {
    render(<VideoEmbed {...mockProps} />);
    
    const playButton = screen.getByRole('button', { name: /play video: test video/i });
    
    // Press Enter key
    fireEvent.keyDown(playButton, { key: 'Enter', code: 'Enter' });
    
    // Wait for iframe to appear
    await waitFor(() => {
      expect(screen.getByTitle('Test Video')).toBeInTheDocument();
    });
  });

  it('supports keyboard navigation with Space key', async () => {
    render(<VideoEmbed {...mockProps} />);
    
    const playButton = screen.getByRole('button', { name: /play video: test video/i });
    
    // Press Space key
    fireEvent.keyDown(playButton, { key: ' ', code: 'Space' });
    
    // Wait for iframe to appear
    await waitFor(() => {
      expect(screen.getByTitle('Test Video')).toBeInTheDocument();
    });
  });

  it('renders MP4 video with native video element', async () => {
    const mp4Props = {
      ...mockProps,
      src: 'https://example.com/video.mp4'
    };
    
    render(<VideoEmbed {...mp4Props} />);
    
    // Click play
    const playButton = screen.getByRole('button', { name: /play video: test video/i });
    fireEvent.click(playButton);
    
    // Wait for video element to appear
    await waitFor(() => {
      const video = screen.getByLabelText('Test Video');
      expect(video.tagName).toBe('VIDEO');
      expect(video).toHaveAttribute('controls');
      expect(video).toHaveAttribute('autoplay');
    });
  });

  it('has proper ARIA labels for accessibility', () => {
    render(<VideoEmbed {...mockProps} />);
    
    const playButton = screen.getByRole('button', { name: /play video: test video/i });
    expect(playButton).toHaveAttribute('aria-label', 'Play video: Test Video');
    expect(playButton).toHaveAttribute('tabIndex', '0');
  });

  it('displays loading state while video loads', async () => {
    render(<VideoEmbed {...mockProps} />);
    
    const playButton = screen.getByRole('button', { name: /play video: test video/i });
    fireEvent.click(playButton);
    
    // Loading state should appear immediately
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Loading video...')).toBeInTheDocument();
  });

  it('works without optional caption', () => {
    const propsWithoutCaption = {
      src: mockProps.src,
      title: mockProps.title,
      poster: mockProps.poster
    };
    
    render(<VideoEmbed {...propsWithoutCaption} />);
    
    // Caption should not be rendered
    expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument();
  });

  it('extracts YouTube video ID correctly from various formats', async () => {
    const testCases = [
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      'https://youtu.be/dQw4w9WgXcQ',
      'https://www.youtube.com/embed/dQw4w9WgXcQ'
    ];

    for (const url of testCases) {
      const { unmount } = render(<VideoEmbed src={url} title="Test" />);
      
      const playButton = screen.getByRole('button');
      fireEvent.click(playButton);
      
      await waitFor(() => {
        const iframe = screen.getByTitle('Test');
        expect(iframe).toHaveAttribute('src', expect.stringContaining('dQw4w9WgXcQ'));
      });
      
      unmount();
    }
  });

  it('applies custom className when provided', () => {
    const { container } = render(
      <VideoEmbed {...mockProps} className="custom-video-class" />
    );
    
    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass('custom-video-class');
  });
});
