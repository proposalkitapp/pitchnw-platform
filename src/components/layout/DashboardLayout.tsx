'use client'

import React from 'react'
import { Sidebar } from './Sidebar'
import { useAuth } from '@/hooks/useAuth'
import { redirect } from 'next/navigation'

export const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth()

  if (loading) return null

  if (!user) {
    redirect('/login')
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="pl-72 min-h-screen">
        {children}
      </main>
    </div>
  )
}
