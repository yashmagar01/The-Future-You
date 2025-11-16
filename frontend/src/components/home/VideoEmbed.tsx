import { useState } from "react";
import { Play } from "lucide-react";

interface VideoEmbedProps {
  videoUrl: string;
  title: string;
  caption?: string;
  poster?: string;
}

const VideoEmbed = ({ videoUrl, title, caption, poster }: VideoEmbedProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Extract video ID from various URL formats
  const getYouTubeEmbedUrl = (url: string) => {
    const videoId = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&\n?#]+)/)?.[1];
    return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1` : url;
  };

  const handlePlay = () => {
    setIsPlaying(true);
    setIsLoaded(true);
  };

  return (
    <section className="py-20 px-4 bg-muted/30">
      <div className="container mx-auto max-w-5xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-3">See How It Works</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Watch this quick overview powered by NotebookLM to understand our approach
          </p>
        </div>

        <div className="relative group rounded-2xl overflow-hidden shadow-2xl border border-border/50 bg-card">
          <div className="aspect-video relative">
            {!isPlaying && (
              <>
                {/* Poster Image */}
                <img
                  src={poster || "/assets/video-poster.svg"}
                  alt={title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    // Fallback gradient if poster fails
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                
                {/* Fallback gradient background */}
                <div className="absolute inset-0 bg-gradient-to-br from-brand-green/20 via-accent/20 to-primary/20 -z-10" />
                
                {/* Play Button Overlay */}
                <button
                  onClick={handlePlay}
                  className="absolute inset-0 flex items-center justify-center group cursor-pointer"
                  aria-label={`Play ${title}`}
                >
                  <div className="w-20 h-20 rounded-full bg-brand-green/90 hover:bg-brand-green flex items-center justify-center transform transition-all duration-300 group-hover:scale-110 shadow-xl">
                    <Play className="w-10 h-10 text-white ml-1" fill="currentColor" />
                  </div>
                </button>

                {/* Video Title Overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                  <p className="text-white text-lg font-semibold">{title}</p>
                </div>
              </>
            )}

            {/* Lazy-loaded iframe */}
            {isPlaying && (
              <iframe
                src={getYouTubeEmbedUrl(videoUrl)}
                title={title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
                loading="lazy"
                onLoad={() => setIsLoaded(true)}
              />
            )}

            {/* Loading State */}
            {isPlaying && !isLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-green border-t-transparent"></div>
              </div>
            )}
          </div>
        </div>

        {caption && (
          <p className="text-center text-sm text-muted-foreground mt-4 italic">
            {caption}
          </p>
        )}
      </div>
    </section>
  );
};

export default VideoEmbed;
