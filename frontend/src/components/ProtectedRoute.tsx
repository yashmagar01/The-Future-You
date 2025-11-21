import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user) {
        setCheckingOnboarding(false);
        return;
      }

      // Skip onboarding check if already on onboarding page
      if (location.pathname === "/onboarding") {
        setCheckingOnboarding(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("onboarding_data")
          .eq("id", user.id)
          .single();

        const profile = data as unknown as { onboarding_data: any } | null;

        if (error) {
          console.error("Error fetching profile:", error);
          setCheckingOnboarding(false);
          return;
        }

        // Check if onboarding is complete
        // User needs onboarding if: onboarding_data is null, empty object, or missing required fields
        
        console.log("ProtectedRoute Debug:", {
          profile,
          onboarding_data: profile?.onboarding_data,
          type: typeof profile?.onboarding_data,
          keys: profile?.onboarding_data ? Object.keys(profile.onboarding_data) : []
        });

        const onboardingData = profile?.onboarding_data;
        
        const hasOnboardingData = 
          onboardingData && 
          typeof onboardingData === 'object' && 
          Object.keys(onboardingData).length > 0;

        console.log("ProtectedRoute Decision:", { 
          hasOnboardingData, 
          needsOnboarding: !hasOnboardingData,
          dataType: typeof onboardingData,
          isObject: typeof onboardingData === 'object'
        });

        setNeedsOnboarding(!hasOnboardingData);
      } catch (err) {
        console.error("Unexpected error:", err);
      } finally {
        setCheckingOnboarding(false);
      }
    };

    checkOnboardingStatus();
  }, [user, location.pathname]);

  if (loading || checkingOnboarding) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="space-y-4 w-full max-w-md px-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!user) {
    // Redirect to login but save the attempted location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Redirect to onboarding if user hasn't completed it
  if (needsOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
