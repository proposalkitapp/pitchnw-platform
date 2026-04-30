'use client'

import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ClayCard } from './ClayCard'

interface ClayModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  className?: string
}

export const ClayModal = ({ isOpen, onClose, title, children, className }: ClayModalProps) => {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!mounted || !isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />
      <ClayCard className={cn("relative w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300", className)}>
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          {title && <h2 className="text-2xl font-bold text-slate-800">{title}</h2>}
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100/50 transition-colors"
          >
            <X className="h-6 w-6 text-slate-500" />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </ClayCard>
    </div>,
    document.body
  )
}
