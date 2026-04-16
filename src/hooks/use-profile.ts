import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  username: string | null;
  company_name: string | null;
  brand_name: string | null;
  brand_logo_url: string | null;
  portfolio_url: string | null;
  signature_data: string | null;
  plan: string | null;
  proposals_used: number;
  is_admin: boolean;
  onboarding_completed: boolean;
  subscription_status: string | null;
  subscription_period_end: string | null;
  trial_ends_at: string | null;
}

export function useProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async (): Promise<Profile | null> => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        return null;
      }
      
      return data as Profile;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 30, // 30 seconds
    refetchOnWindowFocus: true, // Refresh when user comes back to the tab
  });
}
