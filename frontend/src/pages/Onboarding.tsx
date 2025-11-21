import { useNavigate } from "react-router-dom";
import { OnboardingWizard } from "@/components/OnboardingWizard";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

const Onboarding = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    // If not authenticated, redirect to login
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  const handleOnboardingComplete = () => {
    // After onboarding, redirect to dashboard
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      <OnboardingWizard onComplete={handleOnboardingComplete} />
    </div>
  );
};

export default Onboarding;
