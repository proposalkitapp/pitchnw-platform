import { useState } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
      toast.success("Password reset link sent! Check your email.");
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16 flex items-center justify-center min-h-screen">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md mx-auto px-4"
        >
          <div className="text-center mb-8">
            <h1 className="font-display text-3xl font-bold mb-2">Reset your password</h1>
            <p className="text-muted-foreground">
              {sent
                ? "We've sent a password reset link to your email."
                : "Enter your email and we'll send you a reset link."}
            </p>
          </div>

          {sent ? (
            <div className="rounded-xl border border-border bg-card p-6 sm:p-8 text-center space-y-4">
              <Mail className="h-12 w-12 text-primary mx-auto" />
              <p className="text-sm text-muted-foreground">
                Didn't receive the email? Check your spam folder or try again.
              </p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={() => setSent(false)}>
                  Try Again
                </Button>
                <Button variant="hero" onClick={() => navigate("/auth")}>
                  Back to Sign In
                </Button>
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="rounded-xl border border-border bg-card p-6 sm:p-8 space-y-5"
            >
              <div>
                <Label htmlFor="email">Email</Label>
                <div className="relative mt-1.5">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10"
                  />
                </div>
              </div>

              <Button
                variant="hero"
                size="lg"
                className="w-full"
                type="submit"
                disabled={loading}
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </Button>

              <button
                type="button"
                onClick={() => navigate("/auth")}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mx-auto transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign In
              </button>
            </form>
          )}
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
