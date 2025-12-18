import { useRef, useState } from "react";
import { CheckCircle2, Mail, Twitter, MessageCircle, Linkedin, Download, Loader2 } from "lucide-react";
import html2canvas from "html2canvas";
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
  const shareCardRef = useRef<HTMLDivElement>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  
  const shareText = "I just joined the waitlist for The Future You! An AI-powered Expert Mentor that helps you master public speaking & interviews. Join me:";
  const shareUrl = typeof window !== "undefined" ? window.location.origin + "/waitlist" : "https://the-future-you.vercel.app/waitlist";

  // Capture the share card as PNG blob
  const captureShareCard = async (): Promise<Blob | null> => {
    if (!shareCardRef.current) return null;
    
    try {
      const canvas = await html2canvas(shareCardRef.current, {
        backgroundColor: "#ffffff",
        scale: 2, // High quality
        useCORS: true,
        logging: false,
      });
      
      return new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob), "image/png", 1.0);
      });
    } catch (err) {
      console.error("Failed to capture share card:", err);
      return null;
    }
  };

  // Download the image
  const downloadImage = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "future-you-waitlist.png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Smart share function - uses Web Share API on mobile, download on desktop
  const handleShare = async (platform: "twitter" | "whatsapp" | "linkedin") => {
    setIsCapturing(true);
    
    logEvent(ANALYTICS_EVENTS.WAITLIST_SHARE, {
      platform: platform,
      email: email,
    });

    try {
      const blob = await captureShareCard();
      
      if (blob) {
        // Try Web Share API (works on mobile)
        if (navigator.share && navigator.canShare) {
          const file = new File([blob], "future-you-waitlist.png", { type: "image/png" });
          
          if (navigator.canShare({ files: [file] })) {
            try {
              await navigator.share({
                text: shareText,
                url: shareUrl,
                files: [file],
              });
              setIsCapturing(false);
              return; // Success - don't open URL
            } catch (shareErr) {
              // User cancelled or share failed, fall through to download
              console.log("Web Share cancelled or failed:", shareErr);
            }
          }
        }
        
        // Desktop fallback: download image first
        downloadImage(blob);
      }
      
      // Open platform share URL
      const shareUrls = {
        twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
        whatsapp: `https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`,
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
      };
      
      window.open(shareUrls[platform], "_blank", "noopener,noreferrer");
    } finally {
      setIsCapturing(false);
    }
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

        {/* Shareable Card (hidden, used for capture) */}
        <div className="absolute -left-[9999px] top-0">
          <div
            ref={shareCardRef}
            className="w-[600px] h-[315px] bg-gradient-to-br from-emerald-500 via-teal-500 to-blue-600 p-8 flex flex-col justify-between"
            style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
          >
            {/* Top */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                <span className="text-2xl">🚀</span>
              </div>
              <div className="text-white">
                <div className="font-bold text-xl">The Future You</div>
                <div className="text-white/80 text-sm">AI Expert Mentor</div>
              </div>
            </div>
            
            {/* Middle */}
            <div className="text-white">
              <div className="text-3xl font-bold mb-2">I just joined the Beta Waitlist! 🎉</div>
              <div className="text-white/90 text-lg">
                Master public speaking & ace interviews with your personal AI coach
              </div>
            </div>
            
            {/* Bottom */}
            <div className="flex items-center justify-between">
              <div className="text-white/80 text-sm">
                🔥 Limited spots • Beta closes Dec 22nd
              </div>
              <div className="bg-white text-emerald-600 px-4 py-2 rounded-full font-bold text-sm">
                Join free → the-future-you.vercel.app
              </div>
            </div>
          </div>
        </div>

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
                onClick={() => handleShare("twitter")}
                className="gap-2"
                disabled={isCapturing}
              >
                {isCapturing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Twitter className="h-4 w-4" />
                )}
                Twitter
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleShare("whatsapp")}
                className="gap-2"
                disabled={isCapturing}
              >
                {isCapturing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MessageCircle className="h-4 w-4" />
                )}
                WhatsApp
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleShare("linkedin")}
                className="gap-2"
                disabled={isCapturing}
              >
                {isCapturing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Linkedin className="h-4 w-4" />
                )}
                LinkedIn
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              📸 A shareable image will be downloaded automatically
            </p>
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

