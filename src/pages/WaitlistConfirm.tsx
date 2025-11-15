import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, Mail, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logEvent, ANALYTICS_EVENTS } from "@/utils/analytics";

const WaitlistConfirm = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useState(() => {
    if (!token) {
      setStatus("error");
      setErrorMessage("Invalid confirmation link. Please check your email and try again.");
      return;
    }

    // Confirm the token
    const confirmToken = async () => {
      try {
        const response = await fetch("/api/waitlist/confirm", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Confirmation failed");
        }

        setStatus("success");
        logEvent(ANALYTICS_EVENTS.WAITLIST_CONFIRMED, {
          token_valid: true,
        });
      } catch (err) {
        setStatus("error");
        const errorMsg = err instanceof Error ? err.message : "Failed to confirm. Please try again or contact support.";
        setErrorMessage(errorMsg);
        logEvent(ANALYTICS_EVENTS.WAITLIST_CONFIRMED, {
          token_valid: false,
          error: errorMsg,
        });
      }
    };

    confirmToken();
  });

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-6">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <h1 className="text-2xl font-bold">Confirming your email...</h1>
          <p className="text-muted-foreground">Please wait a moment</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md text-center space-y-6">
          <div className="inline-flex h-16 w-16 rounded-full bg-destructive/10 items-center justify-center">
            <Mail className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold">Confirmation Failed</h1>
          <p className="text-muted-foreground">{errorMessage}</p>
          <div className="flex flex-col gap-3">
            <Button onClick={() => navigate("/waitlist")}>
              Return to Waitlist Page
            </Button>
            <Button variant="outline" onClick={() => navigate("/")}>
              Go to Homepage
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-b from-primary/5 to-background">
      <div className="max-w-md text-center space-y-6">
        {/* Success Icon */}
        <div className="inline-flex h-20 w-20 rounded-full bg-green-500/10 items-center justify-center animate-scale-in">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold">
          You're Confirmed!
        </h1>

        {/* Description */}
        <div className="space-y-4 text-muted-foreground">
          <p className="text-lg">
            Thanks for confirming your email. You're officially on the Yash waitlist!
          </p>
          <p>
            We'll send you an email when it's your turn to get early access.
            In the meantime, follow us on social media for updates.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col gap-3 pt-6">
          <Button size="lg" onClick={() => navigate("/")}>
            Explore Yash Features
          </Button>
          <Button variant="outline" onClick={() => navigate("/waitlist")}>
            Invite a Friend to Join
          </Button>
        </div>

        {/* Additional Info */}
        <div className="pt-6 border-t">
          <p className="text-sm text-muted-foreground">
            💡 <strong>Pro tip:</strong> Share Yash with friends to help us grow!<br />
            Early supporters get special perks when we launch.
          </p>
        </div>
      </div>
    </div>
  );
};

export default WaitlistConfirm;
