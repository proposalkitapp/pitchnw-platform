import React from 'react'
import { cn } from '@/lib/utils'

interface ClayBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'secondary'
  children: React.ReactNode
}

export const ClayBadge = ({ variant = 'info', children, className, ...props }: ClayBadgeProps) => {
  const variants = {
    success: "bg-emerald-100 text-emerald-700 shadow-[inset_0px_2px_4px_rgba(255,255,255,0.8),_inset_0px_-2px_4px_rgba(16,185,129,0.1)]",
    warning: "bg-amber-100 text-amber-700 shadow-[inset_0px_2px_4px_rgba(255,255,255,0.8),_inset_0px_-2px_4px_rgba(245,158,11,0.1)]",
    error: "bg-red-100 text-red-700 shadow-[inset_0px_2px_4px_rgba(255,255,255,0.8),_inset_0px_-2px_4px_rgba(239,68,68,0.1)]",
    info: "bg-blue-100 text-blue-700 shadow-[inset_0px_2px_4px_rgba(255,255,255,0.8),_inset_0px_-2px_4px_rgba(59,130,246,0.1)]",
    secondary: "bg-slate-100 text-slate-600 shadow-[inset_0px_2px_4px_rgba(255,255,255,0.8),_inset_0px_-2px_4px_rgba(71,85,105,0.1)]"
  }

  return (
    <span
      className={cn(
        "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
