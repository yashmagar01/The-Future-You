import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function DebugOnboardingReset() {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { toast } = useToast();

    const handleReset = async () => {
        if (!confirm("Are you sure? This will wipe your onboarding data and script.")) return;

        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No user found");

            const { error } = await supabase
                .from('profiles')
                .update({ 
                    onboarding_data: null 
                })
                .eq('id', user.id);

            if (error) throw error;

            toast({
                title: "Onboarding Reset",
                description: "Redirecting to onboarding wizard...",
            });

            // Small delay to let toast show
            setTimeout(() => {
                navigate("/onboarding");
            }, 1000);

        } catch (error: any) {
            console.error("Reset error:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button 
            variant="destructive" 
            size="sm" 
            onClick={handleReset} 
            disabled={loading}
            className="fixed bottom-4 right-4 z-50 shadow-lg opacity-50 hover:opacity-100 transition-opacity"
        >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Reset Onboarding (Debug)
        </Button>
    );
}
