"use client";

import pitchnwLogo from "@/assets/pitchnw-logo.png";
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-border py-12 bg-muted/20">
      <div className="container mx-auto px-4">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img src={pitchnwLogo} alt="Pitchnw" className="h-24 w-auto object-contain" />
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Generate. Customize. Close. The AI-powered proposal platform for freelancers.
            </p>
          </div>

          <div>
            <h4 className="font-display text-sm font-semibold text-foreground mb-4">Product</h4>
            <ul className="space-y-2">
              <li><Link href="/#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</Link></li>
              <li><Link href="/#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</Link></li>
              <li><Link href="/marketplace" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Marketplace</Link></li>
              <li><Link href="/#testimonials" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Testimonials</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display text-sm font-semibold text-foreground mb-4">Account</h4>
            <ul className="space-y-2">
              <li><Link href="/auth?mode=signup" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Sign Up</Link></li>
              <li><Link href="/auth?mode=login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Sign In</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display text-sm font-semibold text-foreground mb-4">Legal</h4>
            <ul className="space-y-2">
              <li><Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Terms of Use</Link></li>
              <li><a href="mailto:support@pitchnw.com" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Contact</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Pitchnw. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Built for freelancers who mean business.
          </p>
        </div>
      </div>
    </footer>
  );
}
