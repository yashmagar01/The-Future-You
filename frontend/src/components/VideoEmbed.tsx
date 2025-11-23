import { useState, KeyboardEvent } from "react";
import { Play, Clock, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { logEvent, ANALYTICS_EVENTS } from "@/utils/analytics";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VideoEmbedProps {
  /** Video URL - supports YouTube links or direct MP4 URLs */
  src: string;
  /** Poster image displayed before playback */
  poster?: string;
  /** Video title for accessibility and display */
  title: string;
  /** Optional caption text displayed below video */
  caption?: string;
  /** Optional video duration (e.g. "02:15") */
  duration?: string;
  /** Optional className for custom styling */
  className?: string;
  /** Whether to show the CTA button below the video */
  showCTA?: boolean;
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
 * - Enhanced UI with hover effects and animations
 */
const VideoEmbed = ({ 
  src, 
  poster, 
  title, 
  caption, 
  duration = "02:15", 
  className = "",
  showCTA = true 
}: VideoEmbedProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Detect if source is MP4 or YouTube/embed link
  const isMP4 = src.toLowerCase().endsWith('.mp4') || src.toLowerCase().includes('.mp4?');
  const isYouTube = src.includes('youtube.com') || src.includes('youtu.be');

  /**
   * Extract YouTube video ID from URL
   */
  const getYouTubeVideoId = (url: string): string | null => {
    return url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&\n?#]+)/)?.[1] || null;
  };

  /**
   * Get YouTube thumbnail URL (uses maxresdefault for best quality)
   */
  const getYouTubeThumbnail = (url: string): string | null => {
    const videoId = getYouTubeVideoId(url);
    return videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null;
  };

  /**
   * Extract YouTube video ID and return embed URL with autoplay
   */
  const getYouTubeEmbedUrl = (url: string): string => {
    const videoId = getYouTubeVideoId(url);
    return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0` : url;
  };

  // Use YouTube thumbnail if available, otherwise use provided poster
  const thumbnailSrc = isYouTube ? getYouTubeThumbnail(src) : poster;

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
  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handlePlay();
    }
  };

  return (
    <div className={cn("w-full max-w-4xl mx-auto", className)}>
      <motion.div 
        className="relative group rounded-2xl overflow-hidden shadow-2xl shadow-brand-green/5 border border-border/50 bg-card ring-1 ring-white/10"
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <div className="aspect-video relative bg-black">
          {!isPlaying && (
            <>
              {/* Thumbnail with Zoom Effect */}
              <div className="absolute inset-0 overflow-hidden">
                {thumbnailSrc && (
                  <img
                    src={thumbnailSrc}
                    alt={`${title} - Video thumbnail`}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}
                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-50 transition-opacity duration-300" />
                
                {/* Fallback gradient if no image */}
                {!thumbnailSrc && (
                  <div className="absolute inset-0 bg-gradient-to-br from-brand-green/20 via-accent/20 to-primary/20 -z-10" />
                )}
              </div>
              
              {/* Play Button */}
              <div className="absolute inset-0 flex items-center justify-center z-20">
                <motion.button
                  onClick={handlePlay}
                  onKeyDown={handleKeyDown}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative group/btn focus:outline-none"
                  aria-label={`Play video: ${title}`}
                >
                  <div className="absolute inset-0 bg-brand-green/30 rounded-full blur-xl animate-pulse" />
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-brand-green/90 backdrop-blur-sm flex items-center justify-center shadow-2xl border border-white/20 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                    <Play className="w-8 h-8 sm:w-10 sm:h-10 text-white fill-white ml-1 relative z-10" />
                  </div>
                </motion.button>
              </div>

              {/* Duration Badge */}
              {duration && (
                <div className="absolute bottom-4 right-4 z-20">
                  <div className="bg-black/60 backdrop-blur-md text-white/90 text-xs font-medium px-2.5 py-1 rounded-full border border-white/10 flex items-center gap-1.5 shadow-lg">
                    <Clock className="w-3 h-3" />
                    {duration}
                  </div>
                </div>
              )}

              {/* Title Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-6 z-20 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                <h3 className="text-white text-lg sm:text-xl font-bold line-clamp-2 drop-shadow-md">
                  {title}
                </h3>
              </div>
            </>
          )}

          {/* Video Player */}
          {isPlaying && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-black"
            >
              {isMP4 ? (
                <video
                  controls
                  autoPlay
                  playsInline
                  webkit-playsinline="true"
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
            </motion.div>
          )}

          {/* Loading State */}
          {isPlaying && !isLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted" role="status" aria-live="polite">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-green border-t-transparent" aria-hidden="true"></div>
              <span className="sr-only">Loading video...</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Caption & CTA */}
      <div className="mt-6 flex flex-col items-center gap-4 text-center">
        {caption && (
          <p className="text-muted-foreground text-sm sm:text-base max-w-2xl">
            {caption}
          </p>
        )}
        
        {showCTA && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground gap-2 group" asChild>
              <a href={src} target="_blank" rel="noopener noreferrer">
                Watch on YouTube <ExternalLink className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default VideoEmbed;
