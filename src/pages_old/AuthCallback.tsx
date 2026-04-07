"use client";

import { useEffect } from "react";
import { useRouter } from 'next/navigation';
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import pitchnwLogo from "@/assets/pitchnw-logo.png";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session) {
        router.push("/auth?error=auth_failed");
        return;
      }
      router.push("/dashboard");
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
