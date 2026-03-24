import { Moon, Sun, Menu, X, LogOut, LayoutDashboard, Settings, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import proposalLogo from "@/assets/proposal-logo.png";

const publicNavLinks = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "Marketplace", href: "#marketplace" },
];

const authNavLinks = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "New Proposal", path: "/generate", icon: FileText },
  { label: "Settings", path: "/settings", icon: Settings },
];

export function Navbar() {
  const { isDark, toggle } = useTheme();
  const { user, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user) {
      supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", user.id)
        .single()
        .then(({ data }) => {
          setDisplayName(data?.display_name || user.email?.split("@")[0] || "User");
        });
    } else {
      setDisplayName(null);
    }
  }, [user]);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    if (location.pathname !== "/") {
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
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl"
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4 lg:px-8">
        <div className="flex items-center gap-4">
          <a
            href="/"
            onClick={(e) => { e.preventDefault(); navigate("/"); }}
            className="flex items-center gap-2"
          >
            <img src={proposalLogo} alt="ProposalKit" className="h-8 w-auto" />
          </a>

          {user && displayName && (
            <span className="hidden md:inline text-sm text-muted-foreground font-medium">
              Welcome, <span className="text-foreground">{displayName}</span>
            </span>
          )}
        </div>

        {user ? (
          /* Authenticated nav */
          <nav className="hidden md:flex items-center gap-1">
            {authNavLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Button
                  key={link.path}
                  variant={isActive ? "secondary" : "ghost"}
                  size="sm"
                  className="gap-2"
                  onClick={() => navigate(link.path)}
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Button>
              );
            })}
          </nav>
        ) : (
          /* Public nav */
          <nav className="hidden md:flex items-center gap-8">
            {publicNavLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                {link.label}
              </a>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={toggle} className="text-muted-foreground">
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          {user ? (
            <Button
              variant="ghost"
              size="icon"
              className="hidden md:inline-flex text-muted-foreground"
              onClick={handleSignOut}
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="hero"
              size="sm"
              className="hidden md:inline-flex"
              onClick={() => navigate("/auth")}
            >
              Get Started Free
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-foreground"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl overflow-hidden"
          >
            <div className="flex flex-col gap-1 p-4">
              {user ? (
                <>
                  <div className="px-4 py-2 text-sm text-muted-foreground font-medium mb-1">
                    Welcome, <span className="text-foreground">{displayName}</span>
                  </div>
                  {authNavLinks.map((link) => (
                    <Button
                      key={link.path}
                      variant={location.pathname === link.path ? "secondary" : "ghost"}
                      className="justify-start gap-2"
                      onClick={() => { navigate(link.path); setMobileOpen(false); }}
                    >
                      <link.icon className="h-4 w-4" /> {link.label}
                    </Button>
                  ))}
                  <Button variant="ghost" className="justify-start gap-2 text-destructive" onClick={() => { handleSignOut(); setMobileOpen(false); }}>
                    <LogOut className="h-4 w-4" /> Sign Out
                  </Button>
                </>
              ) : (
                <>
                  {publicNavLinks.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      onClick={(e) => handleNavClick(e, link.href)}
                      className="rounded-lg px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                    >
                      {link.label}
                    </a>
                  ))}
                  <Button variant="hero" size="lg" className="mt-2" onClick={() => { navigate("/auth"); setMobileOpen(false); }}>
                    Get Started Free
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
