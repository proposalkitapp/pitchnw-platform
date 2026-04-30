"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Lock, CheckCircle } from "lucide-react";
import { useNavigate } from 'react-router-dom';

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    if (hashParams.get("type") === "recovery") {
      setIsRecovery(true);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess(true);
      toast.success("Password updated successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to update password");
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
            <h1 className="font-display text-3xl font-bold mb-2">
              {success ? "Password Updated" : "Set New Password"}
            </h1>
            <p className="text-muted-foreground">
              {success
                ? "Your password has been updated successfully."
                : "Enter your new password below."}
            </p>
          </div>

          {success ? (
            <div className="rounded-xl border border-border bg-card p-6 sm:p-8 text-center space-y-4">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
              <Button variant="hero" onClick={() => navigate("/dashboard")} className="w-full">
                Go to Dashboard
              </Button>
            </div>
          ) : !isRecovery ? (
            <div className="rounded-xl border border-border bg-card p-6 sm:p-8 text-center space-y-4">
              <p className="text-muted-foreground">
                Invalid or expired reset link. Please request a new one.
              </p>
              <Button variant="hero" onClick={() => navigate("/forgot-password")}>
                Request New Link
              </Button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="rounded-xl border border-border bg-card p-6 sm:p-8 space-y-5"
            >
              <div>
                <Label htmlFor="password">New Password</Label>
                <div className="relative mt-1.5">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative mt-1.5">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
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
                {loading ? "Updating..." : "Update Password"}
              </Button>
            </form>
          )}
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
