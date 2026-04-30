"use client";

import { useState } from "react";
import {
  proposalThemes,
  fontStyleLabels,
  headerStyleLabels,
  sectionDividerLabels,
  type AppearanceSettings,
  type FontStyle,
  type HeaderStyle,
  type SectionDivider,
} from "@/lib/proposal-themes";
import { Palette, Type, Layout, SeparatorHorizontal } from "lucide-react";

interface Props {
  settings: AppearanceSettings;
  onChange: (settings: AppearanceSettings) => void;
}

export function ProposalCustomizer({ settings, onChange }: Props) {
  const update = <K extends keyof AppearanceSettings>(key: K, value: AppearanceSettings[K]) => {
    onChange({ ...settings, [key]: value });
  };

  return (
    <div className="space-y-6">
      <h3 className="font-display text-sm font-semibold text-foreground flex items-center gap-2">
        <Palette className="h-4 w-4 text-primary" /> Customize Appearance
      </h3>

      {/* Theme */}
      <div>
        <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2 block">
          Proposal Theme
        </label>
        <div className="grid grid-cols-3 gap-2">
          {proposalThemes.map((theme) => (
            <button
              key={theme.id}
              onClick={() => update("theme", theme.id)}
              className={`rounded-lg border p-2 transition-all text-left ${
                settings.theme === theme.id
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-border hover:border-primary/30"
              }`}
            >
              <div
                className="h-12 rounded-md mb-1.5 flex flex-col justify-center px-2 gap-0.5"
                style={{ backgroundColor: theme.background, border: `1px solid ${theme.border}` }}
              >
                <div className="h-1.5 rounded-full w-3/4" style={{ backgroundColor: theme.accent }} />
                <div className="h-1 rounded-full w-full" style={{ backgroundColor: theme.bodyText, opacity: 0.3 }} />
                <div className="h-1 rounded-full w-2/3" style={{ backgroundColor: theme.bodyText, opacity: 0.2 }} />
              </div>
              <p className="text-[10px] text-muted-foreground truncate">{theme.name}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Accent Color */}
      <div>
        <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2 block">
          Accent Color
        </label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={settings.accentColor}
            onChange={(e) => update("accentColor", e.target.value)}
            className="h-9 w-9 rounded-lg border border-border cursor-pointer bg-transparent"
          />
          <span className="text-xs font-mono text-muted-foreground">{settings.accentColor}</span>
        </div>
      </div>

      {/* Font Style */}
      <div>
        <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
          <Type className="h-3 w-3" /> Font Style
        </label>
        <div className="grid grid-cols-2 gap-2">
          {(Object.entries(fontStyleLabels) as [FontStyle, { label: string; description: string }][]).map(
            ([key, { label, description }]) => (
              <button
                key={key}
                onClick={() => update("fontStyle", key)}
                className={`rounded-lg border p-3 text-left transition-all ${
                  settings.fontStyle === key
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/30"
                }`}
              >
                <p className="text-xs font-semibold text-foreground">{label}</p>
                <p className="text-[10px] text-muted-foreground">{description}</p>
              </button>
            )
          )}
        </div>
      </div>

      {/* Header Style */}
      <div>
        <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
          <Layout className="h-3 w-3" /> Header Layout
        </label>
        <div className="space-y-2">
          {(Object.entries(headerStyleLabels) as [HeaderStyle, { label: string; description: string }][]).map(
            ([key, { label, description }]) => (
              <button
                key={key}
                onClick={() => update("headerStyle", key)}
                className={`w-full rounded-lg border p-3 text-left transition-all ${
                  settings.headerStyle === key
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/30"
                }`}
              >
                <p className="text-xs font-semibold text-foreground">{label}</p>
                <p className="text-[10px] text-muted-foreground">{description}</p>
              </button>
            )
          )}
        </div>
      </div>

      {/* Section Dividers */}
      <div>
        <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
          <SeparatorHorizontal className="h-3 w-3" /> Section Style
        </label>
        <div className="flex gap-2">
          {(Object.entries(sectionDividerLabels) as [SectionDivider, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => update("sectionDivider", key)}
              className={`flex-1 rounded-lg border p-2.5 text-xs text-center transition-all ${
                settings.sectionDivider === key
                  ? "border-primary bg-primary/5 text-foreground font-medium"
                  : "border-border text-muted-foreground hover:border-primary/30"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
