import { useState, FormEvent } from "react";
import { Loader2, Mail, User, Phone, MessageSquare, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { logEvent, ANALYTICS_EVENTS } from "@/utils/analytics";

interface WaitlistFormProps {
  onSuccess: (email: string) => void;
  source?: string;
}

const WaitlistForm = ({ onSuccess, source = "homepage" }: WaitlistFormProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    roleInterest: "",
    message: "",
    referrer: "",
    agreeToEmails: false,
    honeypot: "", // Hidden field for bot detection
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [emailValid, setEmailValid] = useState<boolean | null>(null);

  const roleOptions = [
    { value: "student", label: "Student" },
    { value: "job_seeker", label: "Job Seeker" },
    { value: "public_speaker", label: "Public Speaker" },
    { value: "teacher_mentor", label: "Teacher/Mentor" },
    { value: "other", label: "Other" },
  ];

  const referrerOptions = [
    { value: "search", label: "Search Engine (Google, Bing)" },
    { value: "social", label: "Social Media" },
    { value: "friend", label: "Friend or Colleague" },
    { value: "blog", label: "Blog or Article" },
    { value: "other", label: "Other" },
  ];

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (email: string) => {
    setFormData({ ...formData, email });
    setError("");
    
    // Real-time email validation feedback
    if (email.length > 0) {
      setEmailValid(validateEmail(email));
    } else {
      setEmailValid(null);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    // Check honeypot (should be empty)
    if (formData.honeypot) {
      setError("Invalid submission detected");
      toast({
        title: "Error",
        description: "Invalid submission detected. Please try again.",
        variant: "destructive",
      });
      return;
    }

    // Validate required fields with specific error messages
    if (!formData.email.trim()) {
      setError("Email address is required");
      toast({
        title: "Email Required",
        description: "Please enter your email address to join the waitlist.",
        variant: "destructive",
      });
      return;
    }

    if (!validateEmail(formData.email)) {
      setError("Please enter a valid email address (e.g., you@example.com)");
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.roleInterest) {
      setError("Please select your role or interest");
      toast({
        title: "Role Required",
        description: "Please tell us who you are by selecting a role.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.agreeToEmails) {
      setError("You must agree to receive emails to join the waitlist");
      toast({
        title: "Consent Required",
        description: "Please check the consent box to receive updates about your waitlist status.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name || null,
          email: formData.email,
          phone: formData.phone || null,
          role_interest: formData.roleInterest,
          message: formData.message || null,
          referrer: formData.referrer || null,
          source: source,
          captcha_token: captchaToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to join waitlist");
      }

      // Log analytics event
      logEvent(ANALYTICS_EVENTS.WAITLIST_SIGNUP, {
        source: source,
        role_interest: formData.roleInterest,
        has_name: !!formData.name,
        has_phone: !!formData.phone,
        has_message: !!formData.message,
      });

      // Show success toast
      toast({
        title: "🎉 Welcome to the Waitlist!",
        description: "Check your email for a confirmation link. Don't forget to check your spam folder!",
        duration: 5000,
      });

      // Success - call parent callback
      onSuccess(formData.email);

      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        roleInterest: "",
        message: "",
        referrer: "",
        agreeToEmails: false,
        honeypot: "",
      });
      setEmailValid(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred. Please try again.";
      setError(errorMessage);
      console.error("Waitlist submission error:", err);
      
      // Show error toast with more details
      toast({
        title: "Submission Failed",
        description: errorMessage.includes("rate limit") 
          ? "Too many attempts. Please try again in a few minutes."
          : errorMessage.includes("duplicate") || errorMessage.includes("already")
          ? "This email is already on the waitlist. Check your inbox!"
          : "Something went wrong. Please try again or contact support.",
        variant: "destructive",
        duration: 6000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
      {/* Error Message */}
      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg text-sm border border-destructive/20">
          {error}
        </div>
      )}

      {/* Name - Optional */}
      <div className="space-y-2">
        <Label htmlFor="name" className="flex items-center gap-2">
          <User className="h-4 w-4" />
          Full Name <span className="text-muted-foreground text-xs">(optional)</span>
        </Label>
        <Input
          id="name"
          type="text"
          placeholder="Your full name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          maxLength={100}
          disabled={isSubmitting}
          className="text-base"
        />
      </div>

      {/* Email - Required */}
      <div className="space-y-2">
        <Label htmlFor="email" className="flex items-center gap-2">
          <Mail className="h-4 w-4" />
          Email Address <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={formData.email}
            onChange={(e) => handleEmailChange(e.target.value)}
            required
            disabled={isSubmitting}
            className={`text-base pr-10 ${
              emailValid === true 
                ? "border-green-500 focus-visible:ring-green-500" 
                : emailValid === false 
                ? "border-destructive focus-visible:ring-destructive" 
                : ""
            }`}
            aria-required="true"
            aria-invalid={emailValid === false}
            aria-describedby={emailValid === false ? "email-error" : undefined}
          />
          {emailValid === true && (
            <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
          )}
        </div>
        {emailValid === false && formData.email.length > 0 && (
          <p id="email-error" className="text-xs text-destructive" role="alert">
            Please enter a valid email address
          </p>
        )}
      </div>

      {/* Phone - Optional */}
      <div className="space-y-2">
        <Label htmlFor="phone" className="flex items-center gap-2">
          <Phone className="h-4 w-4" />
          Phone Number <span className="text-muted-foreground text-xs">(optional)</span>
        </Label>
        <Input
          id="phone"
          type="tel"
          placeholder="+1 (555) 123-4567 or +91 98765 43210"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          maxLength={20}
          disabled={isSubmitting}
          className="text-base"
          aria-label="Phone number with country code"
        />
        <p className="text-xs text-muted-foreground">
          Include country code (e.g., +1 for US, +91 for India)
        </p>
      </div>

      {/* Role Interest - Required */}
      <div className="space-y-2">
        <Label htmlFor="role" className="flex items-center gap-2">
          I am a... <span className="text-destructive">*</span>
        </Label>
        <Select
          value={formData.roleInterest}
          onValueChange={(value) => {
            setFormData({ ...formData, roleInterest: value });
            setError(""); // Clear error when user selects
          }}
          disabled={isSubmitting}
        >
          <SelectTrigger 
            id="role" 
            aria-required="true" 
            className={`text-base ${!formData.roleInterest && error ? "border-destructive" : ""}`}
          >
            <SelectValue placeholder="Select your role or interest" />
          </SelectTrigger>
          <SelectContent>
            {roleOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Message - Optional */}
      <div className="space-y-2">
        <Label htmlFor="message" className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Why do you want to join? <span className="text-muted-foreground text-xs">(optional, max 200 chars)</span>
        </Label>
        <Textarea
          id="message"
          placeholder="Tell us briefly what excites you about Yash..."
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          maxLength={200}
          disabled={isSubmitting}
          className="text-base min-h-[100px]"
          rows={4}
        />
        <p className={`text-xs text-right ${
          formData.message.length >= 180 
            ? "text-orange-500 font-medium" 
            : formData.message.length >= 150
            ? "text-yellow-600"
            : "text-muted-foreground"
        }`}>
          {formData.message.length}/200
        </p>
      </div>

      {/* Referrer - Optional */}
      <div className="space-y-2">
        <Label htmlFor="referrer" className="flex items-center gap-2">
          How did you hear about us? <span className="text-muted-foreground text-xs">(optional)</span>
        </Label>
        <Select
          value={formData.referrer}
          onValueChange={(value) => setFormData({ ...formData, referrer: value })}
          disabled={isSubmitting}
        >
          <SelectTrigger id="referrer" className="text-base">
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            {referrerOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Honeypot - Hidden */}
      <div className="hidden" aria-hidden="true">
        <Label htmlFor="website">Website</Label>
        <Input
          id="website"
          type="text"
          value={formData.honeypot}
          onChange={(e) => setFormData({ ...formData, honeypot: e.target.value })}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {/* Agreement Checkbox - Required */}
      <div className={`flex items-start gap-3 p-4 rounded-lg border-2 transition-colors ${
        !formData.agreeToEmails && error 
          ? "bg-destructive/5 border-destructive" 
          : "bg-muted/30 border-transparent"
      }`}>
        <Checkbox
          id="agree"
          checked={formData.agreeToEmails}
          onCheckedChange={(checked) => {
            setFormData({ ...formData, agreeToEmails: checked as boolean });
            setError(""); // Clear error when user checks the box
          }}
          disabled={isSubmitting}
          aria-required="true"
          aria-invalid={!formData.agreeToEmails && !!error}
        />
        <div className="flex-1">
          <Label
            htmlFor="agree"
            className="text-sm leading-relaxed cursor-pointer"
          >
            I agree to receive emails from Yash about early access, product updates, and invitations.{" "}
            <span className="text-destructive">*</span>
            {" "}
            <a
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Privacy Policy
            </a>
          </Label>
          {!formData.agreeToEmails && error && error.includes("agree") && (
            <p className="text-xs text-destructive mt-1" role="alert">
              You must agree to receive emails to join the waitlist
            </p>
          )}
        </div>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        size="lg"
        className="w-full text-lg"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Joining Waitlist...
          </>
        ) : (
          "Join Waitlist"
        )}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        By joining, you'll be among the first to get access when we launch in batches.
      </p>
    </form>
  );
};

export default WaitlistForm;
