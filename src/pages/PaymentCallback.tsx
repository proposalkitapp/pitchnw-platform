import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export default function PaymentCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const reference = searchParams.get("reference") || searchParams.get("trxref");
  const [status, setStatus] = useState<"verifying" | "success" | "failed">("verifying");
  const [plan, setPlan] = useState("");

  useEffect(() => {
    if (!reference) {
      setStatus("failed");
      return;
    }

    const verify = async () => {
      try {
        const resp = await supabase.functions.invoke("verify-paystack-payment", {
          body: { reference },
        });

        if (resp.error) throw new Error(resp.error.message);

        const data = resp.data;
        if (data?.success) {
          setStatus("success");
          setPlan(data.plan);
          setTimeout(() => navigate("/dashboard"), 3000);
        } else {
          setStatus("failed");
        }
      } catch {
        setStatus("failed");
      }
    };

    verify();
  }, [reference, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full rounded-xl border border-border bg-card p-8 text-center"
      >
        {status === "verifying" && (
          <>
            <Loader2 className="h-12 w-12 text-primary mx-auto mb-4 animate-spin" />
            <h1 className="font-display text-2xl font-bold mb-2">Verifying payment...</h1>
            <p className="text-muted-foreground text-sm">Please wait while we confirm your transaction.</p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
            <h1 className="font-display text-2xl font-bold mb-2">Payment Successful! 🎉</h1>
            <p className="text-muted-foreground text-sm mb-4">
              You're now on the <span className="font-semibold text-foreground capitalize">{plan}</span> plan.
            </p>
            <p className="text-xs text-muted-foreground">Redirecting to dashboard in 3 seconds...</p>
          </>
        )}

        {status === "failed" && (
          <>
            <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h1 className="font-display text-2xl font-bold mb-2">Payment could not be verified</h1>
            <p className="text-muted-foreground text-sm mb-6">
              If you were charged, please contact support with your reference: <code className="font-mono text-xs text-primary">{reference || "N/A"}</code>
            </p>
            <Button variant="hero" onClick={() => navigate("/dashboard")}>Go to Dashboard</Button>
          </>
        )}
      </motion.div>
    </div>
  );
}
