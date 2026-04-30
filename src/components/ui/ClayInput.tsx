import React from 'react'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface ClayInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: LucideIcon
}

export const ClayInput = ({ label, error, icon: Icon, className, ...props }: ClayInputProps) => {
  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-bold text-slate-700 ml-4 block">
          {label}
        </label>
      )}
      <div className="relative group">
        {Icon && (
          <Icon className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
        )}
        <input
          className={cn(
            "w-full bg-white/40 backdrop-blur-md border border-white/40 rounded-[1.5rem] px-6 py-4 outline-none transition-all duration-300 focus:bg-white/60 focus:shadow-clay placeholder:text-slate-400",
            Icon && "pl-14",
            error ? "border-red-400" : "focus:border-primary/30",
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-red-500 ml-4">{error}</p>}
    </div>
  )
}
