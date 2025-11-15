import { useState, FormEvent } from "react";
import { Loader2, Mail, User, Phone, MessageSquare } from "lucide-react";
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
import { logEvent, ANALYTICS_EVENTS } from "@/utils/analytics";

interface WaitlistFormProps {
  onSuccess: (email: string) => void;
  source?: string;
}

const WaitlistForm = ({ onSuccess, source = "homepage" }: WaitlistFormProps) => {
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    // Check honeypot (should be empty)
    if (formData.honeypot) {
      setError("Invalid submission detected");
      return;
    }

    // Validate required fields
    if (!formData.email) {
      setError("Email is required");
      return;
    }

    if (!validateEmail(formData.email)) {
      setError("Please enter a valid email address");
      return;
    }

    if (!formData.roleInterest) {
      setError("Please select your role or interest");
      return;
    }

    if (!formData.agreeToEmails) {
      setError("Please agree to receive emails to continue");
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

      // Success - call parent callback
      onSuccess(formData.email);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred. Please try again.";
      setError(errorMessage);
      console.error("Waitlist submission error:", err);
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
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
          disabled={isSubmitting}
          className="text-base"
          aria-required="true"
        />
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
          placeholder="+1 (555) 123-4567"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          maxLength={20}
          disabled={isSubmitting}
          className="text-base"
        />
      </div>

      {/* Role Interest - Required */}
      <div className="space-y-2">
        <Label htmlFor="role" className="flex items-center gap-2">
          I am a... <span className="text-destructive">*</span>
        </Label>
        <Select
          value={formData.roleInterest}
          onValueChange={(value) => setFormData({ ...formData, roleInterest: value })}
          disabled={isSubmitting}
          required
        >
          <SelectTrigger id="role" aria-required="true" className="text-base">
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
        <p className="text-xs text-muted-foreground text-right">
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
      <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg">
        <Checkbox
          id="agree"
          checked={formData.agreeToEmails}
          onCheckedChange={(checked) => 
            setFormData({ ...formData, agreeToEmails: checked as boolean })
          }
          disabled={isSubmitting}
          required
          aria-required="true"
        />
        <Label
          htmlFor="agree"
          className="text-sm leading-relaxed cursor-pointer"
        >
          I agree to receive emails from Yash about early access, product updates, and invitations.{" "}
          <a
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Privacy Policy
          </a>
        </Label>
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
