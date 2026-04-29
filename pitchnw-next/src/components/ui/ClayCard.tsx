import React from 'react'
import { cn } from '@/lib/utils'

interface ClayCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
}

export const ClayCard = ({ children, className, ...props }: ClayCardProps) => {
  return (
    <div 
      className={cn(
        "clay-card transition-all duration-300 hover:scale-[1.01] hover:shadow-clay-hover",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
