import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Video, TrendingUp, Sparkles } from "lucide-react";

// Analytics event logger (placeholder for actual analytics integration)
const logEvent = (eventName: string, params: Record<string, any>) => {
  console.log(`Analytics Event: ${eventName}`, params);
  // TODO: Replace with actual analytics service (Google Analytics, Mixpanel, etc.)
};

// Get CTA variant from environment or localStorage (defaults to 'A')
const getCTAVariant = (): 'A' | 'B' => {
  // Check localStorage first
  const storedVariant = localStorage.getItem('ctaVariant');
  if (storedVariant === 'A' || storedVariant === 'B') {
    return storedVariant;
  }
  
  // Check environment variable
  const envVariant = import.meta.env.VITE_CTA_VARIANT;
  if (envVariant === 'B') {
    return 'B';
  }
  
  // Default to variant A
  return 'A';
};

const Hero = () => {
  const ctaVariant = getCTAVariant();
  
  // Variant A: "Start Recording — Free"
  // Variant B: "Get Started Free"
  const ctaText = ctaVariant === 'A' ? 'Start Recording — Free' : 'Get Started Free';
  const ctaIcon = ctaVariant === 'A' ? Video : Sparkles;
  const CtaIcon = ctaIcon;

  const handleCTAClick = () => {
    logEvent('cta_click', {
      variant: ctaVariant,
      location: 'hero',
      cta_text: ctaText
    });
  };

  return (
    <header className="relative overflow-hidden bg-gradient-to-br from-brand-green/5 via-background to-accent/5 py-12 sm:py-20 lg:py-24 px-4" role="banner" aria-label="Hero section - Your Personal Communication Coach">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute top-20 left-10 w-72 h-72 bg-brand-green/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto max-w-7xl relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Text Content */}
          <div className="text-center lg:text-left animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-green/10 text-brand-green text-sm font-medium mb-6 animate-scale-in">
              <Sparkles className="h-4 w-4" />
              Your Personal Communication Coach
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold mb-6 leading-tight px-2 lg:px-0">
              Build Confidence Through{" "}
              <span className="bg-gradient-to-r from-brand-green to-accent bg-clip-text text-transparent">
                Daily Reflections
              </span>
            </h1>
            
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto lg:mx-0 px-2 lg:px-0">
              Transform your communication skills with AI-powered video feedback. 
              Practice daily, track progress, and become the confident speaker you aspire to be.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button 
                size="lg" 
                className="text-base sm:text-lg h-12 sm:h-14 px-6 sm:px-8 shadow-lg hover:shadow-xl transition-all hover-lift bg-brand-green hover:bg-brand-green/90 touch-manipulation min-h-[44px]"
                onClick={handleCTAClick}
                data-cta-variant={ctaVariant}
                aria-label={`${ctaText} - No credit card required`}
                asChild
              >
                <Link to="/record">
                  <CtaIcon className="mr-2 h-5 w-5" aria-hidden="true" />
                  {ctaText}
                </Link>
              </Button>
              
              <Button 
                size="lg" 
                variant="outline"
                className="text-base sm:text-lg h-12 sm:h-14 px-6 sm:px-8 border-2 hover-lift touch-manipulation min-h-[44px]"
                onClick={() => logEvent('cta_click', { variant: 'secondary', location: 'hero', cta_text: 'View Dashboard' })}
                aria-label="View your progress dashboard"
                asChild
              >
                <Link to="/dashboard">
                  <TrendingUp className="mr-2 h-5 w-5" aria-hidden="true" />
                  View Dashboard
                </Link>
              </Button>
            </div>
            
            <p className="text-sm text-muted-foreground mt-6" role="contentinfo">
              No credit card required • Desktop only
            </p>
          </div>

          {/* Right: Visual Element */}
          <div className="relative animate-slide-up hidden lg:block">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-border/50 bg-card">
              <div className="aspect-video bg-gradient-to-br from-brand-green/20 to-accent/20 flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-brand-green/20 flex items-center justify-center">
                    <Video className="w-12 h-12 text-brand-green" />
                  </div>
                  <p className="text-lg font-semibold text-foreground mb-2">Ready to start?</p>
                  <p className="text-sm text-muted-foreground">Record your first reflection in minutes</p>
                </div>
              </div>
            </div>
            
            {/* Floating stats cards */}
            <div className="absolute -top-4 -right-4 bg-card p-4 rounded-xl shadow-lg border border-border/50 animate-float">
              <p className="text-3xl font-bold text-brand-green">95%</p>
              <p className="text-xs text-muted-foreground">Confidence Boost</p>
            </div>
            
            <div className="absolute -bottom-4 -left-4 bg-card p-4 rounded-xl shadow-lg border border-border/50 animate-float" style={{ animationDelay: "1s" }}>
              <p className="text-3xl font-bold text-accent">10k+</p>
              <p className="text-xs text-muted-foreground">Reflections</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Hero;
