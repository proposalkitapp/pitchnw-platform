import { motion } from "framer-motion";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Star, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const templates = [
  { id: "1", name: "Clean Minimalist", category: "Web Design", rating: 4.9, uses: 342 },
  { id: "2", name: "Bold Agency", category: "Branding", rating: 4.8, uses: 218 },
  { id: "3", name: "Tech Startup", category: "Mobile App", rating: 4.7, uses: 891 },
  { id: "4", name: "Creative Portfolio", category: "Photography", rating: 4.9, uses: 156 },
  { id: "5", name: "SEO Powerhouse", category: "Digital Marketing", rating: 4.6, uses: 305 },
  { id: "6", name: "E-commerce Pro", category: "E-commerce", rating: 4.8, uses: 127 },
  { id: "7", name: "SaaS Pitch", category: "Technology", rating: 4.9, uses: 412 },
  { id: "8", name: "Consulting Brief", category: "Consulting", rating: 4.7, uses: 289 },
  { id: "9", name: "Social Media Plan", category: "Marketing", rating: 4.5, uses: 198 },
];

export default function Marketplace() {
  const navigate = useNavigate();

  return (
    <AuthLayout>
      <div className="p-6 lg:p-8 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-display text-3xl font-bold">Template Marketplace</h1>
          <p className="text-muted-foreground mt-1">
            Browse proposal templates built by top-earning freelancers. All templates are currently free.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template, i) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -4 }}
              className="group rounded-xl border border-border bg-card overflow-hidden transition-all duration-300 hover:border-primary/30 hover:shadow-glow cursor-pointer"
              onClick={() => navigate(`/generate?template=${template.id}`)}
            >
              {/* Preview area */}
              <div className="h-36 bg-secondary/50 flex items-center justify-center border-b border-border relative">
                <div className="w-3/4 space-y-2">
                  <div className="h-3 rounded bg-muted-foreground/10 w-full" />
                  <div className="h-3 rounded bg-muted-foreground/10 w-4/5" />
                  <div className="h-3 rounded bg-muted-foreground/10 w-3/5" />
                  <div className="h-2 rounded bg-primary/20 w-1/3 mt-3" />
                </div>
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-sm font-medium text-primary flex items-center gap-1">
                    Use Template <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-display text-sm font-semibold text-card-foreground">{template.name}</h3>
                  <span className="text-xs font-semibold text-success px-2 py-0.5 rounded-full bg-success/10">
                    Free
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-3">{template.category}</p>
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
      </div>
    </AuthLayout>
  );
}
