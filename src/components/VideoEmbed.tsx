import { useState, KeyboardEvent } from "react";
import { Play } from "lucide-react";
import { logEvent, ANALYTICS_EVENTS } from "@/utils/analytics";

interface VideoEmbedProps {
  /** Video URL - supports YouTube links or direct MP4 URLs */
  src: string;
  /** Poster image displayed before playback */
  poster?: string;
  /** Video title for accessibility and display */
  title: string;
  /** Optional caption text displayed below video */
  caption?: string;
  /** Optional className for custom styling */
  className?: string;
}

/**
 * VideoEmbed - A reusable, accessible video component with lazy-loading
 * 
 * Features:
 * - Lazy-loads video content only when user clicks play
 * - Supports YouTube embeds and direct MP4 videos
 * - Fully keyboard accessible with ARIA labels
 * - Responsive 16:9 aspect ratio
 * - Touch and desktop compatible
 * - Fallback poster image with gradient background
 */
const VideoEmbed = ({ src, poster, title, caption, className = "" }: VideoEmbedProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Detect if source is MP4 or YouTube/embed link
  const isMP4 = src.toLowerCase().endsWith('.mp4') || src.toLowerCase().includes('.mp4?');
  const isYouTube = src.includes('youtube.com') || src.includes('youtu.be');

  /**
   * Extract YouTube video ID and return embed URL with autoplay
   */
  const getYouTubeEmbedUrl = (url: string): string => {
    const videoId = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&\n?#]+)/)?.[1];
    return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0` : url;
  };

  /**
   * Handle play button click - starts video playback
   */
  const handlePlay = () => {
    setIsPlaying(true);
    
    // Log analytics event
    logEvent(ANALYTICS_EVENTS.VIDEO_PLAYED, {
      video_title: title,
      video_src: src,
      video_type: isMP4 ? 'mp4' : isYouTube ? 'youtube' : 'embed',
      has_poster: !!poster,
      location: 'homepage'
    });
  };

  /**
   * Handle keyboard events - allow Enter/Space to trigger play
   */
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handlePlay();
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="relative group rounded-2xl overflow-hidden shadow-2xl border border-border/50 bg-card">
        <div className="aspect-video relative">
          {!isPlaying && (
            <>
              {/* Poster Image */}
              {poster && (
                <img
                  src={poster}
                  alt={`${title} - Video thumbnail`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    // Hide image if it fails to load
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
              
              {/* Fallback gradient background */}
              <div className="absolute inset-0 bg-gradient-to-br from-brand-green/20 via-accent/20 to-primary/20 -z-10" />
              
              {/* Play Button Overlay */}
              <div
                role="button"
                tabIndex={0}
                onClick={handlePlay}
                onKeyDown={handleKeyDown}
                className="absolute inset-0 flex items-center justify-center cursor-pointer focus:outline-none focus:ring-4 focus:ring-brand-green/50 touch-manipulation"
                aria-label={`Play video: ${title}`}
              >
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-brand-green/90 hover:bg-brand-green active:bg-brand-green flex items-center justify-center transform transition-all duration-300 group-hover:scale-110 shadow-xl focus:scale-110 active:scale-105">
                  <Play className="w-10 h-10 text-white ml-1" fill="currentColor" aria-hidden="true" />
                </div>
              </div>

              {/* Video Title Overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 pointer-events-none">
                <p className="text-white text-lg font-semibold">{title}</p>
              </div>
            </>
          )}

          {/* Lazy-loaded video content */}
          {isPlaying && (
            <>
              {isMP4 ? (
                // Native HTML5 video for MP4
                <video
                  controls
                  autoPlay
                  playsInline
                  webkit-playsinline="true"
                  x-webkit-airplay="allow"
                  x5-video-player-type="h5"
                  x5-video-player-fullscreen="true"
                  preload="metadata"
                  poster={poster}
                  className="absolute inset-0 w-full h-full"
                  aria-label={title}
                  onLoadedData={() => setIsLoaded(true)}
                  style={{ objectFit: 'contain' }}
                >
                  <source src={src} type="video/mp4" />
                  <p>Your browser does not support the video tag.</p>
                </video>
              ) : (
                // iframe for YouTube or other embeds
                <iframe
                  src={isYouTube ? getYouTubeEmbedUrl(src) : src}
                  title={title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                  loading="lazy"
                  aria-label={`Video player: ${title}`}
                  onLoad={() => setIsLoaded(true)}
                />
              )}
            </>
          )}

          {/* Loading State */}
          {isPlaying && !isLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted" role="status" aria-live="polite">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-green border-t-transparent" aria-hidden="true"></div>
              <span className="sr-only">Loading video...</span>
            </div>
          )}
        </div>
      </div>

      {/* Caption */}
      {caption && (
        <p className="text-center text-sm text-muted-foreground mt-4 italic" role="contentinfo">
          {caption}
        </p>
      )}
    </div>
  );
};

export default VideoEmbed;
