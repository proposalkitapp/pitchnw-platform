import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Mail, Lock, User, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import pitchnwLogo from "@/assets/pitchnw-logo.png";

const GoogleLogo = () => (
  <svg width="18" height="18" viewBox="0 0 18 18">
    <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 002.38-5.88c0-.57-.05-.66-.15-1.18z"/>
    <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 01-7.18-2.54H1.83v2.07A8 8 0 008.98 17z"/>
    <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 010-3.04V5.41H1.83a8 8 0 000 7.18l2.67-2.07z"/>
    <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 001.83 5.4L4.5 7.49a4.77 4.77 0 014.48-3.3z"/>
  </svg>
);

export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("mode") === "signup" ? false : true;
  const [isLogin, setIsLogin] = useState(defaultTab);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { signIn, signUp, session } = useAuth();
  const navigate = useNavigate();

  const redirectTo = searchParams.get("redirect") || "/dashboard";

  useEffect(() => {
    if (session) {
      navigate(redirectTo);
    }
  }, [session, navigate, redirectTo]);

  useEffect(() => {
    if (searchParams.get("error") === "auth_failed") {
      toast.error("Authentication failed. Please try again.");
    }
  }, [searchParams]);

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/auth/callback'
        }
      })
      if (error) {
        toast.error("Google sign in failed. Please try again.");
      }
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLogin && password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      const next = redirectTo?.startsWith("/") ? redirectTo : "/dashboard";
      if (isLogin) {
        await signIn(email, password);
        toast.success("Welcome back!");
        navigate(next);
      } else {
        await signUp(email, password, displayName);
        toast.success("Account created! Welcome to Pitchnw 🎉");
        navigate(next);
      }
    } catch (err: any) {
      const msg = err.message || "";
      if (msg.includes("User already registered")) {
        toast.error("An account with this email already exists. Sign in instead.");
      } else if (msg.includes("Invalid login credentials")) {
        toast.error("Incorrect email or password. Please try again.");
      } else {
        toast.error(msg || "Something went wrong. Please try again.");
      }
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
            <img src={pitchnwLogo} alt="Pitchnw" className="h-24 w-auto object-contain mx-auto mb-4" />
            <h1 className="font-display text-3xl font-bold mb-2">
              {isLogin ? "Welcome back" : "Create your account"}
            </h1>
            <p className="text-muted-foreground">
              {isLogin ? "Sign in to manage your proposals" : "Start generating AI-powered proposals"}
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 sm:p-8 space-y-5">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              className="w-full h-12 flex items-center justify-center gap-3 rounded-[10px] border border-[#E5E7EB] bg-white text-[15px] font-medium text-[#111827] cursor-pointer transition-all duration-200 hover:bg-[#F9FAFB] hover:border-[#D1D5DB] hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)] active:bg-[#F3F4F6] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {googleLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Connecting to Google...</span>
                </>
              ) : (
                <>
                  <GoogleLogo />
                  <span>Continue with Google</span>
                </>
              )}
            </button>

            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground whitespace-nowrap">or continue with email</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <div>
                  <Label htmlFor="displayName">Display Name</Label>
                  <div className="relative mt-1.5">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="displayName" placeholder="John Doe" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="pl-10" required />
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="email">Email</Label>
                <div className="relative mt-1.5">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="pl-10" />
                </div>
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative mt-1.5">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={isLogin ? 1 : 8} className="pl-10" />
                </div>
                {!isLogin && <p className="text-xs text-muted-foreground mt-1">Minimum 8 characters</p>}
              </div>

              <Button variant="hero" size="lg" className="w-full gap-2" type="submit" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-primary hover:underline font-medium">
                {isLogin ? "Sign up" : "Sign in"}
              </button>
            </p>

            {isLogin && (
              <p className="text-center text-sm">
                <button type="button" onClick={() => navigate("/forgot-password")} className="text-muted-foreground hover:text-primary hover:underline transition-colors">
                  Forgot your password?
                </button>
              </p>
            )}
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
