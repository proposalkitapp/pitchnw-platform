"use client";

import { useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import pitchnwLogo from "@/assets/pitchnw-logo.png";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session) {
        navigate("/auth?error=auth_failed");
        return;
      }
      navigate("/dashboard");
    };
    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-5">
      <img
        src={pitchnwLogo}
        alt="Pitchnw"
        className="h-24 w-auto object-contain animate-pulse"
      />
      <p className="font-sans text-sm text-muted-foreground">
        Signing you in...
      </p>
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );
}
