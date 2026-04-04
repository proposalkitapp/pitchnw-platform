import { Star } from "lucide-react";
import { FadeInView } from "@/components/ParallaxSection";

export interface Testimonial {
  name: string;
  role: string;
  content: string;
  rating: number;
}

export const testimonials: Testimonial[] = [
  {
    name: "David Nice",
    role: "Copywriter",
    content:
      "I used to spend nearly 4 hours on every proposal I sent. Half the time the client would ghost me anyway. With Pitchnw I generate the whole thing in under a minute and the writing is honestly better than what I was doing manually. My close rate has gone up noticeably since I started using it.",
    rating: 4.3,
  },
  {
    name: "Abraham Alba",
    role: "Brand Strategist",
    content:
      "The Sales Pitch mode is what separates this from every other proposal tool I have tried. It does not just fill in a template — it actually writes to the client's situation. I sent a pitch for a rebranding project last week and the client replied within the hour saying it was the most thorough proposal they had ever received.",
    rating: 4.0,
  },
  {
    name: "Mr Christopher",
    role: "Graphics Designer",
    content:
      "I work with corporate clients who expect formal documentation. The Traditional Proposal mode gives me exactly that — structured, comprehensive, and professionally worded. The client portal is a bonus I did not expect. Clients actually comment on sections and sign off without any back and forth.",
    rating: 4.2,
  },
  {
    name: "Favour Synch",
    role: "Social Media Manager",
    content:
      "Pitchnw changed how I present myself to clients. Before, my proposals looked like everyone else's. Now they look like they came from an agency. The branding feature where I can add my logo and header title to every proposal was the thing that made me upgrade immediately.",
    rating: 3.9,
  },
];

function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const partial = rating - full;
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i < full
              ? "text-amber-400 fill-amber-400"
              : i === full && partial > 0
              ? "text-amber-400 fill-amber-400/50"
              : "text-muted-foreground/30"
          }`}
        />
      ))}
      <span className="text-xs text-muted-foreground ml-1.5 font-mono">{rating.toFixed(1)}</span>
    </div>
  );
}

function Initials({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  return (
    <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-display font-bold text-sm shrink-0">
      {initials}
    </div>
  );
}

export function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-4">
        <Initials name={testimonial.name} />
        <div>
          <p className="font-display font-semibold text-sm text-card-foreground">{testimonial.name}</p>
          <p className="text-xs text-muted-foreground">{testimonial.role}</p>
        </div>
      </div>
      <StarRating rating={testimonial.rating} />
      <p className="mt-4 text-sm text-muted-foreground leading-relaxed">"{testimonial.content}"</p>
    </div>
  );
}

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-20 lg:py-28 bg-muted/30">
      <div className="container mx-auto px-4">
        <FadeInView className="text-center mb-14">
          <span className="inline-block text-xs font-semibold text-primary tracking-widest uppercase bg-primary/5 border border-primary/10 rounded-full px-3 py-1 mb-4">
            Testimonials
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mt-2 mb-4">
            Loved by <span className="text-gradient">freelancers</span>
          </h2>
          <p className="text-muted-foreground text-base lg:text-lg max-w-xl mx-auto">
            See what professionals are saying about Pitchnw.
          </p>
        </FadeInView>

        <div className="grid sm:grid-cols-2 gap-5 max-w-4xl mx-auto">
          {testimonials.map((t, i) => (
            <FadeInView key={i} delay={i * 0.1}>
              <TestimonialCard testimonial={t} />
            </FadeInView>
          ))}
        </div>
      </div>
    </section>
  );
}
