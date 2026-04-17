"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Star, ArrowRight, Search } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { useProfile } from "@/hooks/use-profile";
import { Lock } from "lucide-react";

export default function Marketplace() {
  const { data: profile, isLoading } = useProfile();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");

  const isFreelancer = profile?.plan === 'pro';

  if (isLoading) return null;

  if (!isFreelancer) {
    return (
      <AuthLayout>
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md bg-card p-12 rounded-[40px] shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 opacity-10">
               <Lock className="h-24 w-24 text-primary" />
            </div>
            <div className="h-20 w-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-8">
              <Star className="h-10 w-10 text-primary" />
            </div>
            <h2 className="font-display font-black text-3xl text-foreground mb-4">Elite Marketplace</h2>
            <p className="text-muted-foreground mb-8 leading-relaxed font-medium">
              Access 8+ industry-winning proposal templates designed by top closure specialists. Available exclusively on the <span className="text-primary font-bold text-lg">Freelancer</span> plan.
            </p>
            <Button 
               className="w-full h-14 bg-primary text-primary-foreground rounded-2xl font-bold text-lg shadow-xl shadow-primary/20 active:scale-95 transition-all"
               onClick={() => navigate('/checkout')}
             >
              Upgrade to Freelancer
            </Button>
            <Button variant="ghost" className="mt-4 text-muted-foreground font-bold" onClick={() => navigate('/dashboard')}>
                Return to Dashboard
            </Button>
          </motion.div>
        </div>
      </AuthLayout>
    );
  }

  const filtered = templates.filter((t) => {
    const matchesCategory = activeCategory === "all" || t.categorySlug === activeCategory;
    const matchesSearch =
      !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <AuthLayout>
      <div className="p-6 lg:p-8 max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="font-display text-3xl font-bold">Template Marketplace</h1>
          <p className="text-muted-foreground mt-1">
            Browse 8 distinct proposal templates built for different industries. All templates are included in the Basic plan.
          </p>
        </motion.div>

        {/* Search */}
        <div className="relative mb-6 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Category filter pills */}
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => setActiveCategory(cat.slug)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                activeCategory === cat.slug
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((template, i) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -4 }}
              className="group rounded-xl border border-border bg-card overflow-hidden transition-all duration-300 hover:border-primary/30 hover:shadow-glow cursor-pointer"
              onClick={() => navigate(`/marketplace/${template.id}`)}
            >
              {/* Accent top border */}
              <div className="h-1" style={{ backgroundColor: `hsl(${template.accentColor})` }} />
              {/* Preview area */}
              <div className="h-36 bg-secondary/50 flex items-center justify-center border-b border-border relative">
                <div className="w-3/4 space-y-2">
                  {template.sections.slice(0, 4).map((s, j) => (
                    <div key={j} className="flex items-center gap-2">
                      <div
                        className="h-1.5 w-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: `hsl(${template.accentColor})` }}
                      />
                      <div className="h-2.5 rounded bg-muted-foreground/10 flex-1" />
                    </div>
                  ))}
                  <div className="h-2 rounded w-1/3 mt-2" style={{ backgroundColor: `hsl(${template.accentColor} / 0.2)` }} />
                </div>
                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-sm font-medium text-primary flex items-center gap-1">
                    View Template <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-display text-sm font-semibold text-card-foreground">{template.name}</h3>
                  <span className="text-xs font-semibold text-success px-2 py-0.5 rounded-full bg-success/10">Free</span>
                </div>
                <span
                  className="inline-block text-[10px] font-medium px-2 py-0.5 rounded-full mt-1 mb-2"
                  style={{
                    backgroundColor: `hsl(${template.accentColor} / 0.1)`,
                    color: `hsl(${template.accentColor})`,
                  }}
                >
                  {template.category}
                </span>
                <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{template.forWhom}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-warning text-warning" />
                    <span>{template.rating}</span>
                  </div>
                  <span>{template.uses} uses</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <p>No templates match your search.</p>
          </div>
        )}
      </div>
    </AuthLayout>
  );
}
