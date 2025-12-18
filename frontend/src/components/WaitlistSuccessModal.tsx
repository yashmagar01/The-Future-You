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

        {/* Shareable Card (hidden, used for capture) - Exact match to reference design */}
        <div className="absolute -left-[9999px] top-0">
          <div
            ref={shareCardRef}
            style={{
              width: "600px",
              height: "315px",
              background: "linear-gradient(135deg, #2dd4bf 0%, #14b8a6 25%, #0d9488 50%, #0891b2 75%, #0284c7 100%)",
              padding: "32px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
              borderRadius: "16px",
            }}
          >
            {/* Top - Logo and Brand */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{
                width: "52px",
                height: "52px",
                backgroundColor: "#ffffff",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              }}>
                <span style={{ fontSize: "28px" }}>🚀</span>
              </div>
              <div>
                <div style={{ color: "#ffffff", fontWeight: "700", fontSize: "22px", lineHeight: "1.2" }}>
                  The Future You
                </div>
                <div style={{ color: "rgba(255,255,255,0.85)", fontSize: "14px", fontWeight: "500" }}>
                  AI Expert Mentor
                </div>
              </div>
            </div>
            
            {/* Middle - Main Message */}
            <div>
              <div style={{ 
                color: "#ffffff", 
                fontSize: "36px", 
                fontWeight: "800", 
                marginBottom: "12px",
                lineHeight: "1.1",
              }}>
                I just joined the Beta Waitlist! <span style={{ fontSize: "32px" }}>🎉</span>
              </div>
              <div style={{ 
                color: "rgba(255,255,255,0.9)", 
                fontSize: "18px", 
                fontWeight: "500",
                lineHeight: "1.4",
              }}>
                Master public speaking & ace interviews with your personal AI coach
              </div>
            </div>
            
            {/* Bottom - CTA */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ 
                color: "rgba(255,255,255,0.9)", 
                fontSize: "15px", 
                fontWeight: "500",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}>
                <span>🔥</span> Limited spots • Beta closes Dec 22nd
              </div>
              <div style={{
                backgroundColor: "#ffffff",
                color: "#0d9488",
                padding: "10px 20px",
                borderRadius: "50px",
                fontWeight: "700",
                fontSize: "14px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              }}>
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

