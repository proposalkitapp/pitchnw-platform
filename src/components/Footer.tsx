export function Footer() {
  return (
    <footer className="border-t border-border py-12">
      <div className="container mx-auto px-4">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
                <span className="font-display text-xs font-bold text-primary-foreground">PK</span>
              </div>
              <span className="font-display text-base font-bold text-foreground">
                Proposal<span className="text-gradient">Kit</span>
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Generate. Customize. Close. The AI-powered proposal platform for freelancers.
            </p>
          </div>

          {[
            {
              title: "Product",
              links: ["AI Generator", "Marketplace", "Template Builder", "Analytics", "CRM"],
            },
            {
              title: "Company",
              links: ["About", "Blog", "Careers", "Contact"],
            },
            {
              title: "Legal",
              links: ["Privacy Policy", "Terms of Service", "Cookie Policy"],
            },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="font-display text-sm font-semibold text-foreground mb-4">{col.title}</h4>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} ProposalKit AI. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground font-mono">
            Built for freelancers who mean business.
          </p>
        </div>
      </div>
    </footer>
  );
}
