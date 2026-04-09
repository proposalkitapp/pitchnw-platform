"use client";

import { motion } from "framer-motion";
import { 
  Monitor, Code2, Diamond, Shapes, PenTool, Feather, 
  Camera, Aperture, Share2, Radio, Play, Film, 
  Briefcase, TrendingUp, BarChart2, Search, Star, Sparkles
} from "lucide-react";
import { Template } from "@/lib/templates";

interface TemplateCardProps {
  template: Template;
  onClick: () => void;
  index: number;
}

const CATEGORY_STYLES: Record<string, any> = {
  "web-design": {
    bg: "bg-gradient-to-br from-[#0A0E27] to-[#1A237E]",
    accent: "bg-[#2979FF]",
    badge: "bg-[#2979FF]/10 text-[#2979FF]",
    Icon: Monitor,
    pattern: (
      <svg width="100%" height="100%" className="absolute inset-0 opacity-20">
        <pattern id="circuit" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
          <path d="M0 25h10M40 25h10M25 0v10M25 40v10M10 25a15 15 0 1030 0 15 15 0 10-30 0" fill="none" stroke="white" strokeWidth="0.5" />
          <circle cx="25" cy="25" r="2" fill="white" />
        </pattern>
        <rect width="100%" height="100%" fill="url(#circuit)" />
      </svg>
    )
  },
  "branding": {
    bg: "bg-gradient-to-br from-[#4A148C] to-[#E91E8C]",
    accent: "bg-[#E91E8C]",
    badge: "bg-[#E91E8C]/10 text-[#E91E8C]",
    Icon: Diamond,
    pattern: (
      <svg width="100%" height="100%" className="absolute inset-0 opacity-10">
        <pattern id="prism" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M20 0l20 20-20 20L0 20z" fill="none" stroke="white" strokeWidth="1" />
        </pattern>
        <rect width="100%" height="100%" fill="url(#prism)" />
      </svg>
    )
  },
  "copywriting": {
    bg: "bg-gradient-to-br from-[#E65100] to-[#FF8F00]",
    accent: "bg-[#FFB300]",
    badge: "bg-[#FFB300]/10 text-[#FFB300]",
    Icon: PenTool,
    pattern: (
      <svg width="100%" height="100%" className="absolute inset-0 opacity-10">
        <pattern id="lines" x="0" y="0" width="100" height="20" patternUnits="userSpaceOnUse">
          <line x1="0" y1="10" x2="80" y2="10" stroke="white" strokeWidth="1" />
        </pattern>
        <rect width="100%" height="100%" fill="url(#lines)" />
      </svg>
    )
  },
  "photography": {
    bg: "bg-gradient-to-br from-[#212121] to-[#37474F]",
    accent: "bg-[#FFD600]",
    badge: "bg-[#FFD600]/10 text-[#FFD600]",
    Icon: Camera,
    pattern: (
      <svg width="100%" height="100%" className="absolute inset-0 opacity-10">
        <circle cx="50%" cy="50%" r="40" fill="none" stroke="white" strokeWidth="2" strokeDasharray="10 5" />
        <path d="M50 10L90 50L50 90L10 50z" fill="none" stroke="white" strokeWidth="1" className="origin-center rotate-45" />
      </svg>
    )
  },
  "social-media": {
    bg: "bg-gradient-to-br from-[#E91E63] to-[#9C27B0]",
    accent: "bg-[#F50057]",
    badge: "bg-[#F50057]/10 text-[#F50057]",
    Icon: Share2,
    pattern: (
      <svg width="100%" height="100%" className="absolute inset-0 opacity-10">
        <pattern id="social" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
          <path d="M10 10h4v4h-4zM30 40h4v4h-4zM50 15h4v4h-4z" fill="white" />
          <circle cx="20" cy="30" r="2" fill="white" />
          <path d="M40 10l2 2-2 2-2-2z" fill="white" />
        </pattern>
        <rect width="100%" height="100%" fill="url(#social)" />
      </svg>
    )
  },
  "video": {
    bg: "bg-gradient-to-br from-[#B71C1C] to-[#4A0000]",
    accent: "bg-[#D50000]",
    badge: "bg-[#D50000]/10 text-[#D50000]",
    Icon: Play,
    pattern: (
      <svg width="100%" height="100%" className="absolute inset-0 opacity-10">
        <rect x="5" y="0" width="10" height="100%" fill="none" stroke="white" strokeWidth="2" strokeDasharray="4 4" />
        <rect x="calc(100% - 15px)" y="0" width="10" height="100%" fill="none" stroke="white" strokeWidth="2" strokeDasharray="4 4" />
      </svg>
    )
  },
  "consulting": {
    bg: "bg-gradient-to-br from-[#004D40] to-[#1B5E20]",
    accent: "bg-[#00BFA5]",
    badge: "bg-[#00BFA5]/10 text-[#00BFA5]",
    Icon: Briefcase,
    pattern: (
      <svg width="100%" height="100%" className="absolute inset-0 opacity-10">
        <path d="M0 80 L20 60 L40 70 L60 40 L80 50 L100 20" fill="none" stroke="white" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>
    )
  },
  "marketing": {
    bg: "bg-gradient-to-br from-[#1A237E] to-[#311B92]",
    accent: "bg-[#651FFF]",
    badge: "bg-[#651FFF]/10 text-[#651FFF]",
    Icon: BarChart2,
    pattern: (
      <svg width="100%" height="100%" className="absolute inset-0 opacity-10">
        <pattern id="network" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
          <circle cx="10" cy="10" r="2" fill="white" />
          <circle cx="40" cy="40" r="2" fill="white" />
          <line x1="10" y1="10" x2="40" y2="40" stroke="white" strokeWidth="0.5" />
        </pattern>
        <rect width="100%" height="100%" fill="url(#network)" />
      </svg>
    )
  },
};

const DEFAULT_STYLE = {
  bg: "bg-gradient-to-br from-[#1C1C1E] to-[#2C2C2E]",
  accent: "bg-[#7C6FF7]",
  badge: "bg-[#7C6FF7]/10 text-[#7C6FF7]",
  Icon: Sparkles,
  pattern: (
    <svg width="100%" height="100%" className="absolute inset-0 opacity-5">
      <pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="2" r="1" fill="white" />
      </pattern>
      <rect width="100%" height="100%" fill="url(#dots)" />
    </svg>
  )
};

export function TemplateCard({ template, onClick, index }: TemplateCardProps) {
  const style = CATEGORY_STYLES[template.categorySlug] || DEFAULT_STYLE;
  const { bg, accent, badge, Icon, pattern } = style;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -4 }}
      onClick={onClick}
      className="group flex flex-col w-full rounded-[24px] border border-border bg-card overflow-hidden transition-all duration-300 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.3)] cursor-pointer"
    >
      {/* 1. VISUAL HEADER */}
      <div className={`relative h-[200px] w-full overflow-hidden ${bg}`}>
        {pattern}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            transition={{ type: "spring", stiffness: 300 }}
            className="group-hover:scale-110 transition-transform duration-300"
          >
            <Icon 
              size={48} 
              className="text-white filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.3)]" 
            />
          </motion.div>
        </div>
        {/* Accent Bar */}
        <div className={`absolute bottom-0 left-0 right-0 h-1 ${accent}`} />
      </div>

      {/* 2. CONTENT BODY */}
      <div className="flex-1 p-5 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-display font-bold text-base text-card-foreground leading-tight">
            {template.name}
          </h3>
          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${badge}`}>
            {template.category}
          </span>
        </div>

        <p className="font-body text-[13px] text-muted-foreground leading-relaxed mb-4 line-clamp-2">
          {template.description}
        </p>

        {/* 3. FOOTER ZONE */}
        <div className="mt-auto space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-500 px-2.5 py-1 rounded-full bg-emerald-500/10">
              Free
            </span>
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span>{template.rating}</span>
            </div>
          </div>

          <Button 
            className="w-full rounded-xl font-body font-semibold py-6 bg-primary hover:bg-primary/90 text-white transition-all group-hover:shadow-[0_8px_20px_-6px_rgba(0,51,255,0.4)]"
          >
            Use Template
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
