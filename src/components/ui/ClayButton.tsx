import React from 'react'
import { cn } from '@/lib/utils'

interface ClayButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

export const ClayButton = ({ 
  variant = 'primary', 
  size = 'md', 
  className, 
  children, 
  ...props 
}: ClayButtonProps) => {
  const variants = {
    primary: "bg-primary text-white shadow-clay-primary hover:opacity-90",
    secondary: "bg-white/20 text-slate-900 backdrop-blur-md shadow-clay hover:bg-white/30",
    outline: "border-2 border-primary/20 text-primary hover:bg-primary/5",
    ghost: "text-slate-600 hover:bg-slate-100/50"
  }

  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg font-bold"
  }

  return (
    <button
      className={cn(
        "rounded-[2rem] font-semibold transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
