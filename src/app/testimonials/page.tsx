"use client";

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { testimonials, TestimonialCard } from "@/components/TestimonialsSection";

export default function Testimonials() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-28 pb-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h1 className="font-display text-4xl font-bold mb-4">What People Are Saying</h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Real feedback from real professionals using Pitchnw every day.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {testimonials.map((t, i) => (
              <TestimonialCard key={i} testimonial={t} />
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
