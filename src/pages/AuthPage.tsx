import { useState } from "react";
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

export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("mode") === "signup" ? false : true;
  const [isLogin, setIsLogin] = useState(defaultTab);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLogin && password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      if (isLogin) {
        await signIn(email, password);
        toast.success("Welcome back!");
        navigate("/dashboard");
      } else {
        await signUp(email, password, displayName);
        toast.success("Account created! Welcome to ProposalKit 🎉");
        navigate("/dashboard");
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
            <h1 className="font-display text-3xl font-bold mb-2">
              {isLogin ? "Welcome back" : "Create your account"}
            </h1>
            <p className="text-muted-foreground">
              {isLogin
                ? "Sign in to manage your proposals"
                : "Start generating AI-powered proposals"}
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="rounded-xl border border-border bg-card p-6 sm:p-8 space-y-5"
          >
            {!isLogin && (
              <div>
                <Label htmlFor="displayName">Display Name</Label>
                <div className="relative mt-1.5">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="displayName"
                    placeholder="John Doe"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            )}

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

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={isLogin ? 1 : 8}
                  className="pl-10"
                />
              </div>
              {!isLogin && (
                <p className="text-xs text-muted-foreground mt-1">Minimum 8 characters</p>
              )}
            </div>

            <Button
              variant="hero"
              size="lg"
              className="w-full gap-2"
              type="submit"
              disabled={loading}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading
                ? "Please wait..."
                : isLogin
                ? "Sign In"
                : "Create Account"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary hover:underline font-medium"
              >
                {isLogin ? "Sign up" : "Sign in"}
              </button>
            </p>

            {isLogin && (
              <p className="text-center text-sm">
                <button
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                  className="text-muted-foreground hover:text-primary hover:underline transition-colors"
                >
                  Forgot your password?
                </button>
              </p>
            )}
          </form>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
