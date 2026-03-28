import { motion } from "framer-motion";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { useParams, useNavigate } from "react-router-dom";
import { Star, ArrowLeft, ArrowRight, Users, Shield } from "lucide-react";
import { templates, getTemplateById } from "@/lib/templates";

export default function TemplateDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const template = getTemplateById(id || "");

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

  const related = templates.filter((t) => t.categorySlug === template.categorySlug && t.id !== template.id).slice(0, 3);

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
              {/* Accent top bar */}
              <div className="h-1.5" style={{ backgroundColor: `hsl(${template.accentColor})` }} />

              {/* SAMPLE watermark */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <span className="text-6xl font-display font-bold text-muted-foreground/5 rotate-[-30deg] select-none">SAMPLE</span>
              </div>

              <div className="p-6 sm:p-8 space-y-6">
                {template.sections.map((section, i) => (
                  <div key={section}>
                    <h3
                      className="font-display text-lg font-semibold mb-3"
                      style={{ color: `hsl(${template.accentColor})` }}
                    >
                      {section}
                    </h3>
                    <div className="space-y-2">
                      <div className="h-3 rounded bg-muted-foreground/10 w-full" />
                      <div className="h-3 rounded bg-muted-foreground/10 w-5/6" />
                      <div className="h-3 rounded bg-muted-foreground/10 w-4/6" />
                      {i === 0 && <div className="h-3 rounded bg-muted-foreground/10 w-3/5" />}
                    </div>
                    {i < template.sections.length - 1 && (
                      <div className="border-b border-border mt-6" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right - Info */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-2 space-y-6">
            <div>
              <h1 className="font-display text-2xl font-bold mb-2 text-foreground">{template.name}</h1>
              <span
                className="inline-block px-3 py-1 rounded-full text-xs font-medium border"
                style={{
                  backgroundColor: `hsl(${template.accentColor} / 0.1)`,
                  color: `hsl(${template.accentColor})`,
                  borderColor: `hsl(${template.accentColor} / 0.2)`,
                }}
              >
                {template.category}
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-success/10 text-success border border-success/20">
                <Shield className="h-3 w-3" /> Official
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

            <div className="rounded-lg border border-border bg-secondary/30 p-4">
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2">Tone</p>
              <p className="text-sm text-foreground">{template.tone}</p>
            </div>

            <div className="rounded-lg border border-border bg-secondary/30 p-4">
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2">Sections ({template.sections.length})</p>
              <ol className="space-y-1.5">
                {template.sections.map((s, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-xs font-mono text-primary shrink-0 mt-0.5">{String(i + 1).padStart(2, "0")}</span>
                    {s}
                  </li>
                ))}
              </ol>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-2xl font-display font-bold text-success">Free</span>
            </div>

            <Button
              variant="hero"
              size="lg"
              className="w-full gap-2"
              style={{
                backgroundColor: `hsl(${template.accentColor})`,
              }}
              onClick={() => navigate(`/generate?template=${template.id}`)}
            >
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
                  <div className="h-1 rounded-t-xl -mt-5 -mx-5 mb-4" style={{ backgroundColor: `hsl(${t.accentColor})` }} />
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
