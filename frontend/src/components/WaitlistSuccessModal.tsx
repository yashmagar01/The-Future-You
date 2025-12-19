import { CheckCircle2, Mail, Twitter, MessageCircle, Linkedin } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { logEvent, ANALYTICS_EVENTS } from "@/utils/analytics";

interface WaitlistSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
}

const WaitlistSuccessModal = ({
  isOpen,
  onClose,
  email,
}: WaitlistSuccessModalProps) => {
  const shareText = "I just joined the waitlist for The Future You! An AI-powered Expert Mentor that helps you master public speaking & interviews. Join me:";
  const shareUrl = typeof window !== "undefined" ? window.location.origin + "/waitlist" : "https://the-future-you.vercel.app/waitlist";

  const handleTwitterShare = () => {
    logEvent(ANALYTICS_EVENTS.WAITLIST_SHARE, {
      platform: "twitter",
      email: email,
    });
    
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, "_blank", "noopener,noreferrer");
  };

  const handleWhatsAppShare = () => {
    logEvent(ANALYTICS_EVENTS.WAITLIST_SHARE, {
      platform: "whatsapp",
      email: email,
    });
    
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  const handleLinkedInShare = () => {
    logEvent(ANALYTICS_EVENTS.WAITLIST_SHARE, {
      platform: "linkedin",
      email: email,
    });
    
    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
    window.open(linkedinUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <DialogTitle className="text-2xl text-center">
            You're on the list!
          </DialogTitle>
          <DialogDescription className="text-center text-base space-y-4 pt-2">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Mail className="h-5 w-5" />
              <span>Check your email</span>
            </div>
            <p className="leading-relaxed">
              We've sent a confirmation email to{" "}
              <span className="font-semibold text-foreground">{email}</span>
            </p>
            <p className="text-sm">
              Please click the link in the email to confirm your spot on the waitlist.
              We'll notify you when it's your turn to test Yash!
            </p>
          </DialogDescription>
        </DialogHeader>

        {/* Share Section */}
        <div className="mt-6 space-y-4">
          <div className="text-center">
            <p className="text-sm font-medium mb-3">
              Help us grow — Share with friends:
            </p>
            <div className="flex gap-2 justify-center flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={handleTwitterShare}
                className="gap-2"
              >
                <Twitter className="h-4 w-4" />
                Twitter
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleWhatsAppShare}
                className="gap-2"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLinkedInShare}
                className="gap-2"
              >
                <Linkedin className="h-4 w-4" />
                LinkedIn
              </Button>
            </div>
          </div>

          {/* Close Button */}
          <Button
            onClick={onClose}
            className="w-full"
            size="lg"
          >
            Got it, thanks!
          </Button>
        </div>

        {/* Confirmation Reminder */}
        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground text-center">
            💡 <strong>Don't see the email?</strong> Check your spam folder or promotions tab.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WaitlistSuccessModal;


