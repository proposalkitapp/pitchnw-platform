"use client";

import { Moon, Sun, Menu, X, LogOut, LayoutDashboard, Settings, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import pitchnwLogo from "../assets/pitchnw-logo.png";
import { LiquidGlassToggle } from "./LiquidGlassToggle";

const publicNavLinks = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "Contact", href: "/contact" },
];

const authNavLinks = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "New Proposal", path: "/generate", icon: FileText },
  { label: "Account", path: "/settings", icon: Settings },
];

export function Navbar() {
  const { user, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation().pathname;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (user) {
      supabase
        .from("profiles")
        .select("display_name, username")
        .eq("user_id", user.id)
        .single()
        .then(({ data }) => {
          setDisplayName(data?.display_name || data?.username || user.email?.split("@")[0] || "User");
        });
    }
  }, [user]);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    if (location !== "/") {
      navigate("/");
      setTimeout(() => {
        document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } else {
      document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
    }
    setMobileOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none transition-all duration-300 ${scrolled ? "p-4" : "p-0"}`}>
      <motion.nav
        initial={false}
        animate={{
          width: scrolled ? "auto" : "100%",
          maxWidth: scrolled ? "1100px" : "100%",
          height: scrolled ? 60 : 80,
          borderRadius: scrolled ? 9999 : 0,
          backgroundColor: scrolled ? "rgba(255, 255, 255, 0.95)" : "rgba(255, 255, 255, 1)",
          boxShadow: scrolled ? "0 10px 40px -10px rgba(0,0,0,0.1), 0 0 1px rgba(0,0,0,0.05)" : "none",
          border: scrolled ? "1px solid #e5e5e5" : "1px solid transparent",
          paddingLeft: scrolled ? 24 : 40,
          paddingRight: scrolled ? 10 : 40,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={`pointer-events-auto flex items-center justify-between backdrop-blur-xl group relative`}
      >
        {/* Left: Logo */}
        <div className="flex items-center gap-4 shrink-0">
          <a
            href="/"
            onClick={(e) => { e.preventDefault(); navigate("/"); }}
            className="flex items-center"
          >
            <img 
              src={pitchnwLogo} 
              alt="Pitchnw" 
              className={`transition-all duration-300 ${scrolled ? "h-10" : "h-20"} w-auto object-contain`} 
            />
          </a>
        </div>

        {/* Center: Nav Links (Hidden in scrolled state or mobile) */}
        {!scrolled && (
          <nav className="hidden lg:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            {publicNavLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className="text-[15px] font-semibold text-slate-600 hover:text-black transition-colors duration-200 whitespace-nowrap"
              >
                {link.label}
              </a>
            ))}
          </nav>
        )}

        {/* Right: Actions */}
        <div className="flex items-center gap-2 md:gap-4 h-full">
          {scrolled && (
            <div className="mr-2 hidden md:flex items-center animate-in fade-in zoom-in duration-300">
               <LiquidGlassToggle />
            </div>
          )}

          {!user ? (
            <div className="flex items-center gap-4 md:gap-8 mr-1 md:mr-2">
              {!scrolled && (
                <button 
                  onClick={() => navigate("/auth?mode=login")}
                  className="hidden md:block text-[15px] font-bold text-slate-600 hover:text-black transition-all"
                >
                  Sign In
                </button>
              )}
              <Button
                className={`transition-all duration-300 rounded-full font-black shadow-xl active:scale-95 ${
                  scrolled 
                    ? "bg-black text-white hover:bg-black/90 h-10 px-6 text-xs" 
                    : "bg-black text-white hover:bg-black/90 h-14 px-10 text-base"
                }`}
                onClick={() => navigate("/auth?mode=signup")}
              >
                Get Started
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                className="font-bold text-muted-foreground hidden md:flex"
                onClick={() => navigate("/dashboard")}
              >
                Dashboard
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="font-bold text-muted-foreground mr-2"
                onClick={handleSignOut}
              >
                Sign Out
              </Button>
            </div>
          )}

          {!scrolled && (
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-foreground h-10 w-10 ml-2"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          )}
        </div>

        {/* Mobile Menu (Overlay) */}
        <AnimatePresence>
          {mobileOpen && !scrolled && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-full left-0 right-0 mt-4 bg-white rounded-3xl border border-slate-100 shadow-2xl p-6 lg:hidden"
            >
              <div className="flex flex-col gap-2">
                {publicNavLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={(e) => handleNavClick(e, link.href)}
                    className="rounded-2xl px-6 py-4 text-base font-bold text-slate-600 hover:text-black hover:bg-slate-50 transition-colors"
                  >
                    {link.label}
                  </a>
                ))}
                <hr className="my-2 border-slate-100" />
                <Button 
                  variant="hero" 
                  size="lg" 
                  className="w-full h-14 rounded-2xl" 
                  onClick={() => { navigate("/auth?mode=signup"); setMobileOpen(false); }}
                >
                  Get Started (Free)
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </div>
  );
}
