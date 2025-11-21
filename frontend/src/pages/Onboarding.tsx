import { useNavigate } from "react-router-dom";
import { OnboardingWizard } from "@/components/OnboardingWizard";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

const Onboarding = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    
    // If not authenticated, redirect to login
    if (!user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

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
