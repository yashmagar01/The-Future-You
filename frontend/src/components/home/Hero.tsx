import { ArrowRight, Video, Sparkles, ShieldCheck, Users, PlayCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { useRef } from "react";
import { logEvent, ANALYTICS_EVENTS } from "@/utils/analytics";

const Hero = () => {
  const ctaVariant = getCTAVariant();
  
  const ctaText = ctaVariant === 'A' ? 'Start Recording — Free' : 'Get Started Free';
  const ctaIcon = ctaVariant === 'A' ? Video : Sparkles;
  const CtaIcon = ctaIcon;
  
  const handlePrimaryCTAClick = () => {
    logEvent(ANALYTICS_EVENTS.HERO_CTA_CLICK, { variant: ctaVariant, type: 'primary' });
  };

  const handleSecondaryCTAClick = () => {
    logEvent(ANALYTICS_EVENTS.HERO_CTA_CLICK, { variant: ctaVariant, type: 'secondary' });
  };

  // Parallax effect
  const targetRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.9]);

  // Smooth spring animation for floating elements
  const springConfig = { stiffness: 100, damping: 30, restDelta: 0.001 };
  const floatY = useSpring(useTransform(scrollYProgress, [0, 1], [0, -50]), springConfig);

  return (
    <header ref={targetRef} className="relative overflow-hidden bg-gradient-to-br from-brand-green/5 via-background to-accent/5 py-12 sm:py-20 lg:py-24 px-4" role="banner" aria-label="Hero section - Your Personal Communication Coach">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-green/10 rounded-full blur-3xl animate-blob" />
        <div className="absolute top-[20%] right-[-10%] w-[30%] h-[30%] bg-accent/10 rounded-full blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-10%] left-[20%] w-[35%] h-[35%] bg-brand-green/5 rounded-full blur-3xl animate-blob animation-delay-4000" />
      </div>

      <div className="container mx-auto max-w-7xl relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Text Content */}
          <div className="text-center lg:text-left animate-fade-in">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-sm font-medium mb-6 animate-slide-down">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
              </span>
              Live Demo Available Soon
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-[1.15]">
              Build Confidence Through <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-green to-accent animate-gradient-x">
                Daily AI-Powered Feedback
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Practice speaking in a judgment-free zone. Get instant AI feedback to improve your confidence, one reflection at a time.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
              <Button 
                size="lg" 
                className="text-base sm:text-lg h-12 sm:h-14 px-6 sm:px-8 shadow-lg hover:shadow-xl transition-all hover-lift touch-manipulation min-h-[44px]"
                onClick={handlePrimaryCTAClick}
                data-cta-variant={ctaVariant}
                aria-label="Start Recording - Free, No credit card required"
                asChild
              >
                <Link to="/record">
                  <Video className="mr-2 h-5 w-5" aria-hidden="true" />
                  Start Recording — Free
                </Link>
              </Button>
              
              <Button 
                variant="outline" 
                size="lg"
                className="text-base sm:text-lg h-12 sm:h-14 px-6 sm:px-8 hover:bg-accent/5 transition-colors min-h-[44px]"
                onClick={handleSecondaryCTAClick}
                asChild
              >
                <Link to="/how-it-works">
                  <PlayCircle className="mr-2 h-5 w-5" aria-hidden="true" />
                  See How It Works
                </Link>
              </Button>
            </div>

            {/* Trust Badges - Horizontal Layout */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-brand-green flex-shrink-0" />
                <span>100% Private & Secure</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-accent flex-shrink-0" />
                <span>Join 50+ Users</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                <span>No Credit Card</span>
              </div>
            </div>
          </div>

          {/* Right: Visual Element */}
          <div className="relative animate-slide-up hidden lg:block">
            <motion.div 
              style={{ y, opacity, scale }}
              className="relative z-10 bg-card rounded-2xl shadow-2xl border border-border/50 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-brand-green/5 to-accent/5 mix-blend-overlay" />
              
              {/* Mock UI Interface */}
              <div className="p-4 border-b border-border/50 flex items-center gap-2 bg-muted/30">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 bg-background rounded-md h-6 mx-4 opacity-50" />
              </div>
              
              <div className="relative aspect-video bg-black/5 flex items-center justify-center">
                 <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-20 h-20 rounded-full bg-brand-green/20 animate-pulse flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-brand-green/40 flex items-center justify-center">
                        <Video className="h-8 w-8 text-brand-green" />
                      </div>
                    </div>
                 </div>
                 {/* Waveform Animation */}
                 <div className="absolute bottom-8 left-8 right-8 h-12 flex items-end justify-center gap-1">
                    {[...Array(20)].map((_, i) => (
                      <div 
                        key={i}
                        className="w-1 bg-brand-green/50 rounded-full animate-wave"
                        style={{ 
                          height: `${Math.random() * 100}%`,
                          animationDelay: `${i * 0.05}s`
                        }}
                      />
                    ))}
                 </div>
              </div>
            </motion.div>

            {/* Floating Stats Cards */}
            <motion.div 
              style={{ y: floatY }}
              className="absolute -top-4 -right-4 bg-card p-4 rounded-xl shadow-lg border border-border/50 animate-float"
            >
              <p className="text-3xl font-bold text-brand-green">95%</p>
              <p className="text-xs text-muted-foreground">Confidence Boost</p>
            </motion.div>
            
            <motion.div 
              style={{ y: floatY }}
              className="absolute -bottom-4 -left-4 bg-card p-4 rounded-xl shadow-lg border border-border/50 animate-float" 
              transition={{ delay: 1 }}
            >
              <p className="text-3xl font-bold text-accent">100+</p>
              <p className="text-xs text-muted-foreground">Reflections</p>
            </motion.div>
          </div>
        </div>
      </div>
    </header>
  );
};

// Helper function for A/B testing (simplified)
const getCTAVariant = () => {
  return Math.random() > 0.5 ? 'A' : 'B';
};

export default Hero;
