const items = [
  "Freelance Developers",
  "Web Designers",
  "Marketing Agencies",
  "Copywriters",
  "Consultants",
  "UX Designers",
  "Brand Strategists",
  "Video Producers",
];

export function TrustMarquee() {
  const repeated = [...items, ...items];
  return (
    <div className="relative border-y border-border/50 overflow-hidden py-5">
      {/* Fade masks */}
      <div className="absolute left-0 top-0 bottom-0 w-24 z-10 bg-gradient-to-r from-background to-transparent" />
      <div className="absolute right-0 top-0 bottom-0 w-24 z-10 bg-gradient-to-l from-background to-transparent" />
      <div className="flex animate-marquee whitespace-nowrap">
        {repeated.map((item, i) => (
          <span
            key={i}
            className="mx-8 font-display text-sm font-bold uppercase tracking-widest text-muted-foreground/50"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
