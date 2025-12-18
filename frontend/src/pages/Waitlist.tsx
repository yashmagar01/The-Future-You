import { useState, useEffect } from "react";
import { Sparkles, Users, Zap, Shield, TrendingUp, Rocket, Star, Clock } from "lucide-react";
import Layout from "@/components/Layout";
import WaitlistForm from "@/components/WaitlistForm";
import WaitlistSuccessModal from "@/components/WaitlistSuccessModal";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { logEvent, ANALYTICS_EVENTS } from "@/utils/analytics";
import confetti from "canvas-confetti";

// Countdown Component
const Countdown = ({ targetDate }: { targetDate: Date }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = targetDate.getTime() - new Date().getTime();
      
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div className="flex justify-center gap-3 md:gap-6">
      {Object.entries(timeLeft).map(([unit, value]) => (
        <div key={unit} className="flex flex-col items-center">
          <div className="relative w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl flex items-center justify-center border-2 border-primary/30 shadow-lg backdrop-blur-sm">
            <span className="text-2xl md:text-3xl font-bold text-foreground">{value.toString().padStart(2, '0')}</span>
          </div>
          <span className="text-xs md:text-sm text-muted-foreground mt-2 capitalize font-medium">{unit}</span>
        </div>
      ))}
    </div>
  );
};

const Waitlist = () => {
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [waitlistCount, setWaitlistCount] = useState(0);

  useEffect(() => {
    // Log page view
    logEvent(ANALYTICS_EVENTS.PAGE_VIEW, {
      page: "/waitlist",
      title: "Join Waitlist",
    });

    // Animate count up to fixed authentic number (35)
    const targetCount = 35; // Fixed number in 20-50 range
    let currentCount = 0;
    const increment = 1;
    
    const counter = setInterval(() => {
      currentCount += increment;
      if (currentCount >= targetCount) {
        setWaitlistCount(targetCount);
        clearInterval(counter);
      } else {
        setWaitlistCount(currentCount);
      }
    }, 30); // Faster animation

    return () => clearInterval(counter);
  }, []);

  const handleSuccess = (email: string) => {
    setSubmittedEmail(email);
    setShowSuccessModal(true);
    
    // Trigger confetti animation
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min;
    };

    const interval: any = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);
  };

  const handleCloseModal = () => {
    setShowSuccessModal(false);
  };

  // Beta signups close in 3 days (Dec 22, 2025 midnight IST)
  const launchDate = new Date('2025-12-22T00:00:00');

  return (
    <Layout>
      <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-primary/10 via-primary/5 to-background relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-accent/5 rounded-full blur-3xl" />
        
        <div className="container mx-auto max-w-4xl text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 animate-fade-in">
            <Sparkles className="h-4 w-4" />
            Early Access Waitlist
          </div>

          {/* Branded Illustration */}
          <div className="flex items-center justify-center gap-3 mb-6 animate-bounce-slow">
            <div className="relative">
              <Rocket className="h-12 w-12 text-primary rotate-45" />
              <Star className="h-4 w-4 text-yellow-500 absolute -top-1 -right-1 animate-pulse" />
            </div>
            <Sparkles className="h-10 w-10 text-accent animate-pulse" style={{ animationDelay: '0.2s' }} />
            <div className="relative">
              <Users className="h-12 w-12 text-primary" />
              <Star className="h-4 w-4 text-yellow-500 absolute -bottom-1 -left-1 animate-pulse" style={{ animationDelay: '0.4s' }} />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Join the Future You Early Access Waitlist
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed max-w-2xl mx-auto">
            Be first to try your personal <strong className="text-foreground">AI Expert Mentor</strong> that helps you master public speaking,
            job interviews, and everyday conversations through daily video practice.
          </p>

          {/* Countdown */}
          <div className="mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Clock className="h-5 w-5 text-primary" />
              <p className="text-sm font-semibold text-red-600 uppercase tracking-wide">🔥 Beta Signups Close In</p>
            </div>
            <Countdown targetDate={launchDate} />
          </div>

          {/* Social Proof */}
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-12">
            <Users className="h-4 w-4" />
            <span>Join <strong className="text-foreground text-lg">{waitlistCount}+</strong> people already on the waitlist</span>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-12 px-4 border-y bg-gradient-to-r from-muted/40 via-muted/30 to-muted/40">
        <div className="container mx-auto max-w-5xl">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center space-y-3">
              <div className="inline-flex h-12 w-12 rounded-full bg-green-500/10 items-center justify-center">
                <Zap className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold">Early Access</h3>
              <p className="text-sm text-muted-foreground">
                Limited spots — signups close Dec 22nd, then we go heads-down building!
              </p>
            </div>
            <div className="text-center space-y-3">
              <div className="inline-flex h-12 w-12 rounded-full bg-blue-500/10 items-center justify-center">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold">Shape the Product</h3>
              <p className="text-sm text-muted-foreground">
                Your feedback will directly influence features and improvements
              </p>
            </div>
            <div className="text-center space-y-3">
              <div className="inline-flex h-12 w-12 rounded-full bg-purple-500/10 items-center justify-center">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold">Lifetime Benefits</h3>
              <p className="text-sm text-muted-foreground">
                Special perks and discounts for early supporters
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto max-w-3xl">
          <div className="bg-card border rounded-2xl shadow-lg p-8 md:p-12">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold mb-3">
                Reserve Your Spot
              </h2>
              <p className="text-muted-foreground">
                Fill out the form below to join. We'll email you when it's your turn!
              </p>
            </div>

            <WaitlistForm onSuccess={handleSuccess} source="waitlist_page" />
          </div>
        </div>
      </section>

      {/* What Happens Next Section */}
      <section className="py-16 px-4 bg-gradient-to-b from-muted/40 via-muted/30 to-muted/20">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
            What Happens Next?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                1
              </div>
              <h3 className="font-semibold">Confirm Your Email</h3>
              <p className="text-sm text-muted-foreground">
                Click the confirmation link we send to verify your email address
              </p>
            </div>
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                2
              </div>
              <h3 className="font-semibold">Wait for Your Invite</h3>
              <p className="text-sm text-muted-foreground">
                We'll email you when it's your turn — invites go out in small batches
              </p>
            </div>
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                3
              </div>
              <h3 className="font-semibold">Start Practicing</h3>
              <p className="text-sm text-muted-foreground">
                Get full access to Future You and start improving your communication skills
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4 bg-gradient-to-b from-accent/5 via-background to-muted/30">
        <div className="container mx-auto max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">
              Frequently Asked Questions
            </h2>
            <p className="text-muted-foreground">
              Everything you need to know about joining the waitlist
            </p>
          </div>
          
          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem 
              value="item-1" 
              className="border border-border/40 rounded-lg px-6 bg-card hover:shadow-md hover:border-primary/20 transition-all duration-200"
            >
              <AccordionTrigger className="text-left text-base md:text-lg font-semibold hover:text-primary hover:no-underline">
                When will I get access?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                We're inviting users in small batches starting in early 2025, with the public MVP launch on April 19, 2025.
                Earlier signups get priority, so joining now gives you the best chance of getting early access!
              </AccordionContent>
            </AccordionItem>

            <AccordionItem 
              value="item-2" 
              className="border border-border/40 rounded-lg px-6 bg-card hover:shadow-md hover:border-primary/20 transition-all duration-200"
            >
              <AccordionTrigger className="text-left text-base md:text-lg font-semibold hover:text-primary hover:no-underline">
                Is it free?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                Early access testers get free access during the beta period. We'll share pricing details before the public launch.
                As an early supporter, you'll also receive special perks and discounts!
              </AccordionContent>
            </AccordionItem>

            <AccordionItem 
              value="item-3" 
              className="border border-border/40 rounded-lg px-6 bg-card hover:shadow-md hover:border-primary/20 transition-all duration-200"
            >
              <AccordionTrigger className="text-left text-base md:text-lg font-semibold hover:text-primary hover:no-underline">
                Can I share my invite?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                Invites are personal and tied to your email address for security reasons. However, you can absolutely refer friends to join the waitlist!
                They'll go through the same process and get their own invite when it's their turn.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem 
              value="item-4" 
              className="border border-border/40 rounded-lg px-6 bg-card hover:shadow-md hover:border-primary/20 transition-all duration-200"
            >
              <AccordionTrigger className="text-left text-base md:text-lg font-semibold hover:text-primary hover:no-underline">
                What if I change my mind?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                No problem! You can opt out at any time by clicking the unsubscribe link in our emails.
                Your privacy and preferences are important to us, and we respect your decision.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* Success Modal */}
      <WaitlistSuccessModal
        isOpen={showSuccessModal}
        onClose={handleCloseModal}
        email={submittedEmail}
      />
      </div>
    </Layout>
  );
};

export default Waitlist;
