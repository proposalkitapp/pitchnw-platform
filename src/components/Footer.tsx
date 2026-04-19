"use client";

import { Link } from "react-router-dom";
import pitchnwLogo from "../assets/pitchnw-logo.png";
import { motion } from "framer-motion";

const LINKS = {
  Product: [
    { label: "Features", to: "/#features" },
    { label: "How it Works", to: "/#how-it-works" },
    { label: "Pricing", to: "/#pricing" },
    { label: "Marketplace", to: "/marketplace" },
  ],
  Account: [
    { label: "Sign Up — Free", to: "/auth?mode=signup" },
    { label: "Sign In", to: "/auth?mode=login" },
    { label: "Dashboard", to: "/dashboard" },
  ],
  Legal: [
    { label: "Privacy Policy", to: "/privacy" },
    { label: "Terms of Use", to: "/terms" },
    { label: "Contact Us", to: "mailto:support@pitchnw.com", external: true },
  ],
};

export function Footer() {
  return (
    <footer className="relative border-t border-border bg-background">
      {/* Subtle top glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[40%] h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      <div className="container mx-auto px-4 pt-16 pb-10">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand Column */}
          <div className="col-span-2 lg:col-span-2 space-y-5">
            <Link to="/" className="inline-block">
              <img
                src={pitchnwLogo}
                alt="Pitchnw"
                className="h-16 w-auto object-contain"
              />
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              The AI-powered proposal platform built for freelancers who want to
              win more deals without writing a single word from scratch.
            </p>
            {/* Start CTA */}
            <Link
              to="/auth?mode=signup"
              className="inline-flex items-center gap-2 bg-primary/10 hover:bg-primary/15 border border-primary/20 text-primary text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
            >
              Get Started Free →
            </Link>
          </div>

          {/* Link Columns */}
          {Object.entries(LINKS).map(([group, links]) => (
            <div key={group} className="space-y-4">
              <h4 className="text-xs font-black uppercase tracking-widest text-foreground">
                {group}
              </h4>
              <ul className="space-y-2.5">
                {links.map(({ label, to, external }) => (
                  <li key={label}>
                    {external ? (
                      <a
                        href={to}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {label}
                      </a>
                    ) : (
                      <Link
                        to={to}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-14 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Pitchnw. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link
              to="/privacy"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacy
            </Link>
            <Link
              to="/terms"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Terms
            </Link>
            <span className="text-xs text-muted-foreground/50">
              Built for freelancers who mean business.
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
