import { useState, useEffect } from "react";
import { Sparkles, Users, Zap, Shield, TrendingUp } from "lucide-react";
import WaitlistForm from "@/components/WaitlistForm";
import WaitlistSuccessModal from "@/components/WaitlistSuccessModal";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { logEvent, ANALYTICS_EVENTS } from "@/utils/analytics";

const Waitlist = () => {
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  useEffect(() => {
    // Log page view
    logEvent(ANALYTICS_EVENTS.PAGE_VIEW, {
      page: "/waitlist",
      title: "Join Waitlist",
    });
  }, []);

  const handleSuccess = (email: string) => {
    setSubmittedEmail(email);
    setShowSuccessModal(true);
  };

  const handleCloseModal = () => {
    setShowSuccessModal(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 animate-fade-in">
            <Sparkles className="h-4 w-4" />
            Early Access Waitlist
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            Join the Yash Early Access Waitlist
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed max-w-2xl mx-auto">
            Be first to try the AI communication coach that helps you master public speaking,
            job interviews, and everyday conversations through daily video practice.
          </p>

          {/* Social Proof */}
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-12">
            <Users className="h-4 w-4" />
            <span>Join <strong className="text-foreground">500+ people</strong> already on the waitlist</span>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-12 px-4 border-y bg-muted/30">
        <div className="container mx-auto max-w-5xl">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center space-y-3">
              <div className="inline-flex h-12 w-12 rounded-full bg-green-500/10 items-center justify-center">
                <Zap className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold">Early Access</h3>
              <p className="text-sm text-muted-foreground">
                Get invited in small batches before public launch on April 19, 2025
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
      <section className="py-20 px-4">
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
      <section className="py-16 px-4 bg-muted/30">
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
                Get full access to Yash and start improving your communication skills
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4 bg-gradient-to-b from-background to-muted/20">
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
  );
};

export default Waitlist;
