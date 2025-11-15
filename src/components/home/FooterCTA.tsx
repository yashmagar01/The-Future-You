import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles, ArrowRight } from "lucide-react";

const FooterCTA = () => {
  return (
    <section className="py-20 px-4">
      <div className="container mx-auto max-w-4xl">
        <Card className="relative overflow-hidden p-12 bg-gradient-to-br from-brand-green/5 via-accent/5 to-primary/5 border-2">
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
                className="text-lg h-14 px-8 shadow-lg hover:shadow-xl transition-all bg-brand-green hover:bg-brand-green/90 group"
                asChild
              >
                <Link to="/register">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              
              <Button 
                size="lg" 
                variant="outline"
                className="text-lg h-14 px-8 border-2"
                asChild
              >
                <Link to="/login">
                  Sign In
                </Link>
              </Button>
            </div>

            {/* Trust Indicators */}
            <p className="text-sm text-muted-foreground">
              No credit card required • 100% free to start • Cancel anytime
            </p>
          </div>
        </Card>
      </div>
    </section>
  );
};

export default FooterCTA;
