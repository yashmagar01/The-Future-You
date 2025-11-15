import { useState, useEffect } from "react";
import { Sparkles, Users, Zap, Shield, TrendingUp } from "lucide-react";
import WaitlistForm from "@/components/WaitlistForm";
import WaitlistSuccessModal from "@/components/WaitlistSuccessModal";
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
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">When will I get access?</h3>
              <p className="text-muted-foreground">
                We're inviting users in small batches starting in early 2025, with the public MVP launch on April 19, 2025.
                Earlier signups get priority.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Is it free?</h3>
              <p className="text-muted-foreground">
                Early access testers get free access during the beta period. We'll share pricing details before the public launch.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Can I share my invite?</h3>
              <p className="text-muted-foreground">
                Invites are personal and tied to your email. However, you can refer friends to join the waitlist!
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">What if I change my mind?</h3>
              <p className="text-muted-foreground">
                No problem! You can opt out at any time by clicking the unsubscribe link in our emails.
              </p>
            </div>
          </div>
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
