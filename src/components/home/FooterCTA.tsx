import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles, ArrowRight, Video } from "lucide-react";

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

const FooterCTA = () => {
  const ctaVariant = getCTAVariant();
  
  // Variant A: "Start Recording — Free"
  // Variant B: "Get Started Free"
  const ctaText = ctaVariant === 'A' ? 'Start Recording — Free' : 'Get Started Free';
  const ctaIcon = ctaVariant === 'A' ? Video : Sparkles;
  const CtaIcon = ctaIcon;

  const handleCTAClick = () => {
    logEvent('cta_click', {
      variant: ctaVariant,
      location: 'footer',
      cta_text: ctaText
    });
  };

  return (
    <section className="py-20 px-4">
      <div className="container mx-auto max-w-4xl">
        <Card className="relative overflow-hidden p-6 sm:p-10 lg:p-12 bg-gradient-to-br from-brand-green/5 via-accent/5 to-primary/5 border-2">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-green/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

          <div className="relative z-10 text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-green/10 text-brand-green text-sm font-medium mb-6">
              <Sparkles className="h-4 w-4" />
              Start Your Journey Today
            </div>

            {/* Headline */}
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Ready to Build Confidence?
            </h2>

            {/* Subheadline */}
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of people transforming their communication skills through daily practice and AI-powered feedback.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
              <Button 
                size="lg" 
                className="text-base sm:text-lg h-12 sm:h-14 px-6 sm:px-8 shadow-lg hover:shadow-xl transition-all bg-brand-green hover:bg-brand-green/90 group touch-manipulation min-h-[44px]"
                asChild
                data-cta-variant={ctaVariant}
                onClick={handleCTAClick}
                aria-label={`${ctaText} - ${ctaVariant === 'A' ? 'Primary call to action variant A' : 'Primary call to action variant B'}`}
              >
                <Link to="/register">
                  {ctaText}
                  <CtaIcon className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              
              <Button 
                size="lg" 
                variant="outline"
                className="text-base sm:text-lg h-12 sm:h-14 px-6 sm:px-8 border-2 touch-manipulation min-h-[44px]"
                asChild
              >
                <Link to="/login">
                  Sign In
                </Link>
              </Button>
            </div>

            {/* Trust Indicators */}
            <p className="text-sm text-muted-foreground">
              No credit card required • Desktop only • Cancel anytime
            </p>
          </div>
        </Card>
      </div>
    </section>
  );
};

export default FooterCTA;
