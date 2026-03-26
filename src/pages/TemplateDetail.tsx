import { motion } from "framer-motion";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { useParams, useNavigate } from "react-router-dom";
import { Star, ArrowLeft, ArrowRight, Users, Calendar } from "lucide-react";

const templates = [
  { id: "1", name: "Clean Minimalist", category: "Web Design", rating: 4.9, uses: 342, description: "A sleek, minimal proposal template perfect for modern web design agencies. Features clean typography and whitespace-driven layouts.", sections: ["Executive Summary", "Scope of Work", "Timeline", "Pricing", "Terms"] },
  { id: "2", name: "Bold Agency", category: "Branding", rating: 4.8, uses: 218, description: "A bold, brand-forward template designed for creative agencies pitching branding projects. Strong visual impact with confident language.", sections: ["Brand Vision", "Strategic Approach", "Deliverables", "Investment", "Next Steps"] },
  { id: "3", name: "Tech Startup", category: "Mobile App", rating: 4.7, uses: 891, description: "Built for tech teams pitching mobile and SaaS projects. Includes technical scope sections and milestone-based pricing.", sections: ["Problem & Solution", "Technical Scope", "Architecture", "Timeline & Milestones", "Pricing"] },
  { id: "4", name: "Creative Portfolio", category: "Photography", rating: 4.9, uses: 156, description: "A visually-driven template ideal for photographers and creative professionals. Emphasizes visual examples and storytelling.", sections: ["Creative Vision", "Portfolio Highlights", "Project Plan", "Investment", "Agreement"] },
  { id: "5", name: "SEO Powerhouse", category: "Digital Marketing", rating: 4.6, uses: 305, description: "Data-driven template for SEO and digital marketing proposals. Includes KPI sections and ROI projections.", sections: ["Current Analysis", "SEO Strategy", "Content Plan", "Reporting", "Pricing"] },
  { id: "6", name: "E-commerce Pro", category: "E-commerce", rating: 4.8, uses: 127, description: "Comprehensive e-commerce proposal template with conversion-focused sections and platform comparisons.", sections: ["Market Analysis", "Platform Strategy", "Design & UX", "Development Plan", "Pricing"] },
  { id: "7", name: "SaaS Pitch", category: "Technology", rating: 4.9, uses: 412, description: "Professional SaaS pitch template designed for B2B software proposals. Includes ROI calculators and integration specs.", sections: ["Executive Summary", "Solution Overview", "Implementation", "Support Plan", "Pricing"] },
  { id: "8", name: "Consulting Brief", category: "Consulting", rating: 4.7, uses: 289, description: "Strategic consulting template with methodology sections and case study references. Perfect for management consultants.", sections: ["Engagement Overview", "Methodology", "Team & Resources", "Timeline", "Fees"] },
  { id: "9", name: "Social Media Plan", category: "Marketing", rating: 4.5, uses: 198, description: "Social media strategy template with platform breakdowns, content calendars, and performance metrics.", sections: ["Audience Analysis", "Platform Strategy", "Content Calendar", "Metrics & KPIs", "Pricing"] },
];

export default function TemplateDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const template = templates.find((t) => t.id === id);

  if (!template) {
    return (
      <AuthLayout>
        <div className="p-6 text-center py-20">
          <h2 className="font-display text-xl font-semibold mb-2">Template not found</h2>
          <Button variant="outline" onClick={() => navigate("/marketplace")}>← Back to Marketplace</Button>
        </div>
      </AuthLayout>
    );
  }

  const related = templates.filter((t) => t.category === template.category && t.id !== template.id).slice(0, 3);

  return (
    <AuthLayout>
      <div className="p-6 lg:p-8 max-w-6xl mx-auto">
        <Button variant="ghost" onClick={() => navigate("/marketplace")} className="gap-2 mb-6 text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Marketplace
        </Button>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Left - Preview */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-3">
            <div className="rounded-xl border border-border bg-card overflow-hidden relative">
              {/* SAMPLE watermark */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <span className="text-6xl font-display font-bold text-muted-foreground/5 rotate-[-30deg] select-none">SAMPLE</span>
              </div>
              <div className="p-6 sm:p-8 space-y-6">
                {template.sections.map((section, i) => (
                  <div key={section}>
                    <h3 className="font-display text-lg font-semibold text-primary mb-3">{section}</h3>
                    <div className="space-y-2">
                      <div className="h-3 rounded bg-muted-foreground/10 w-full" />
                      <div className="h-3 rounded bg-muted-foreground/10 w-5/6" />
                      <div className="h-3 rounded bg-muted-foreground/10 w-4/6" />
                      {i === 0 && <div className="h-3 rounded bg-muted-foreground/10 w-3/5" />}
                    </div>
                    {i < template.sections.length - 1 && <div className="border-b border-border mt-6" />}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right - Info */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-2 space-y-6">
            <div>
              <h1 className="font-display text-2xl font-bold mb-2 text-foreground">{template.name}</h1>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                {template.category}
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-success/10 text-success border border-success/20">
                Official
              </span>
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" /> {template.uses} uses
              </div>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-warning text-warning" /> {template.rating}
              </div>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">{template.description}</p>

            <div className="flex items-center gap-2">
              <span className="text-2xl font-display font-bold text-success">Free</span>
            </div>

            <Button variant="hero" size="lg" className="w-full gap-2" onClick={() => navigate(`/generate?template=${template.id}`)}>
              Use This Template <ArrowRight className="h-4 w-4" />
            </Button>
          </motion.div>
        </div>

        {/* Related Templates */}
        {related.length > 0 && (
          <div className="mt-12">
            <h2 className="font-display text-lg font-semibold mb-4 text-foreground">More in {template.category}</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {related.map((t) => (
                <motion.div
                  key={t.id}
                  whileHover={{ y: -4 }}
                  className="rounded-xl border border-border bg-card p-5 cursor-pointer hover:border-primary/30 transition-colors"
                  onClick={() => navigate(`/marketplace/${t.id}`)}
                >
                  <h3 className="font-display text-sm font-semibold text-card-foreground">{t.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{t.category}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <Star className="h-3 w-3 fill-warning text-warning" /> {t.rating}
                    <span>· {t.uses} uses</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AuthLayout>
  );
}
