'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { 
  User, 
  Building, 
  Save, 
  Lock, 
  Loader2, 
  CreditCard, 
  Check, 
  PenTool, 
  Image as ImageIcon, 
  Upload, 
  Zap, 
  Palette,
  Globe,
  Shield
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'
import { createClient } from '@/lib/supabase/client'
import { ClayCard } from '@/components/ui/ClayCard'
import { ClayButton } from '@/components/ui/ClayButton'
import { ClayInput } from '@/components/ui/ClayInput'
import { ClayBadge } from '@/components/ui/ClayBadge'
import { SignatureCanvas } from '@/components/proposal/SignatureCanvas'

type Tab = 'profile' | 'branding' | 'security' | 'billing'

export default function SettingsPage() {
  const { user } = useAuth()
  const { data: profile, isLoading: loadingProfile, refetch } = useProfile(user?.id)
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [activeTab, setActiveTab] = useState<Tab>('profile')
  const [saving, setSaving] = useState(false)
  
  // Form States
  const [formData, setFormData] = useState({
    displayName: "",
    username: "",
    companyName: "",
    brandName: "",
    brandLogoUrl: "",
    portfolioUrl: "",
    signatureData: null as string | null
  })

  useEffect(() => {
    if (profile) {
      setFormData({
        displayName: profile.display_name || "",
        username: profile.username || "",
        companyName: profile.company_name || "",
        brandName: profile.brand_name || "",
        brandLogoUrl: profile.brand_logo_url || "",
        portfolioUrl: profile.portfolio_url || "",
        signatureData: profile.signature_data || null
      })
    }
  }, [profile])

  const updateForm = (field: string, value: any) => 
    setFormData(prev => ({ ...prev, [field]: value }))

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    const toastId = toast.loading("Saving changes...")

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: formData.displayName,
          username: formData.username || null,
          company_name: formData.companyName,
          signature_data: formData.signatureData,
          brand_name: formData.brandName,
          brand_logo_url: formData.brandLogoUrl,
          portfolio_url: formData.portfolioUrl || null,
        } as any)
        .eq("user_id", user.id)

      if (error) throw error
      
      toast.success("Settings updated!", { id: toastId })
      refetch()
    } catch (err: any) {
      toast.error(err.message || "Failed to save settings", { id: toastId })
    } finally {
      setSaving(false)
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    const toastId = toast.loading("Uploading brand logo...")
    try {
      const fileExt = file.name.split('.').pop()
      const filePath = `${user.id}/logo-${Date.now()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(filePath)

      updateForm("brandLogoUrl", publicUrl)
      toast.success("Logo uploaded!", { id: toastId })
    } catch (err: any) {
      toast.error("Upload failed", { id: toastId })
    }
  }

  if (loadingProfile) return <div className="p-20 flex justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>

  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto space-y-10 min-h-screen">
      <header className="space-y-2">
        <h1 className="font-display text-4xl font-black text-slate-900 tracking-tighter">Settings</h1>
        <p className="text-slate-500 font-medium text-lg">Manage your profile, brand, and subscription.</p>
      </header>

      {/* Modern Tab Pill Navigation */}
      <div className="flex bg-slate-50 p-1.5 rounded-[1.5rem] w-fit border border-white/20">
        {(['profile', 'branding', 'security', 'billing'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-6 py-2.5 rounded-[1.25rem] text-[11px] font-black uppercase tracking-widest transition-all",
              activeTab === tab ? "bg-white text-slate-900 shadow-sm scale-[1.02]" : "text-slate-400 hover:text-slate-600"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="mt-8">
        <AnimatePresence mode="wait">
          {activeTab === 'profile' && (
            <motion.div key="profile" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <ClayCard className="p-10 space-y-8">
                <div className="flex items-center gap-3 border-b border-slate-50 pb-6">
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                    <User className="h-6 w-6" />
                  </div>
                  <h2 className="text-xl font-black text-slate-900">Personal Information</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ClayInput label="Display Name" value={formData.displayName} onChange={(e) => updateForm("displayName", e.target.value)} />
                  <ClayInput label="Username" value={formData.username} onChange={(e) => updateForm("username", e.target.value)} />
                  <div className="md:col-span-2">
                    <ClayInput label="Company Name" icon={Building} value={formData.companyName} onChange={(e) => updateForm("companyName", e.target.value)} />
                  </div>
                  <div className="md:col-span-2">
                    <ClayInput label="Portfolio Website" icon={Globe} placeholder="https://..." value={formData.portfolioUrl} onChange={(e) => updateForm("portfolioUrl", e.target.value)} />
                  </div>
                </div>

                <ClayButton onClick={handleSave} disabled={saving} className="w-full shadow-glow">
                  {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5 mr-2" />}
                  Save Profile Changes
                </ClayButton>
              </ClayCard>
            </motion.div>
          )}

          {activeTab === 'branding' && (
            <motion.div key="branding" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
              <ClayCard className="p-10 space-y-10">
                <div className="flex items-center gap-3 border-b border-slate-50 pb-6">
                  <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500">
                    <Palette className="h-6 w-6" />
                  </div>
                  <h2 className="text-xl font-black text-slate-900">Proposal Branding</h2>
                </div>

                <div className="space-y-4">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Brand Logo</label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="relative w-full h-40 border-4 border-dashed border-slate-100 rounded-[2.5rem] flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-all group"
                  >
                    {formData.brandLogoUrl ? (
                      <div className="relative group">
                         <img src={formData.brandLogoUrl} alt="Logo" className="h-20 w-auto object-contain" />
                         <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 rounded-lg flex items-center justify-center transition-opacity">
                            <span className="text-[10px] font-black text-white bg-black/40 px-3 py-1 rounded-full">Change</span>
                         </div>
                      </div>
                    ) : (
                      <div className="text-center space-y-2">
                        <Upload className="h-8 w-8 text-slate-300 mx-auto" />
                        <p className="text-sm font-bold text-slate-500">Click to upload logo</p>
                      </div>
                    )}
                    <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                  </div>
                </div>

                <ClayInput label="Brand / Studio Name" value={formData.brandName} onChange={(e) => updateForm("brandName", e.target.value)} />

                <div className="space-y-4">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Digital Signature</label>
                  <SignatureCanvas 
                    onSignatureChange={(data) => updateForm("signatureData", data)} 
                    initialData={formData.signatureData} 
                  />
                </div>

                <ClayButton onClick={handleSave} disabled={saving} className="w-full shadow-glow bg-indigo-500 hover:bg-indigo-600">
                  {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5 mr-2" />}
                  Update Brand Identity
                </ClayButton>
              </ClayCard>

              {/* Preview Card */}
              <div className="space-y-4">
                <h3 className="font-black text-slate-900 text-sm">Header Preview</h3>
                <ClayCard className="p-8 flex items-center justify-between border-primary/10">
                   <div className="flex items-center gap-4">
                      {formData.brandLogoUrl ? <img src={formData.brandLogoUrl} className="h-8 w-auto" /> : <div className="h-8 w-8 bg-slate-100 rounded-lg" />}
                      <span className="font-black text-slate-900">{formData.brandName || "Your Studio"}</span>
                   </div>
                   <div className="h-[2px] flex-1 bg-primary/20 mx-10" />
                   <div className="h-8 w-24 bg-slate-50 rounded-xl" />
                </ClayCard>
              </div>
            </motion.div>
          )}

          {activeTab === 'security' && (
            <motion.div key="security" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <ClayCard className="p-10 space-y-8">
                <div className="flex items-center gap-3 border-b border-slate-50 pb-6">
                  <div className="h-12 w-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500">
                    <Shield className="h-6 w-6" />
                  </div>
                  <h2 className="text-xl font-black text-slate-900">Security & Access</h2>
                </div>

                <div className="space-y-6">
                  <ClayInput label="Email Address" value={user?.email || ""} disabled />
                  <ClayButton variant="secondary" className="w-full">Request Password Reset Email</ClayButton>
                </div>
              </ClayCard>
            </motion.div>
          )}

          {activeTab === 'billing' && (
            <motion.div key="billing" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <ClayCard className="p-10 space-y-8 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                   <CreditCard className="h-32 w-32" />
                </div>
                
                <div className="flex items-center gap-3 border-b border-slate-50 pb-6">
                  <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500">
                    <CreditCard className="h-6 w-6" />
                  </div>
                  <h2 className="text-xl font-black text-slate-900">Plan & Subscription</h2>
                </div>

                <div className="space-y-6 relative z-10">
                   <div className="flex items-center justify-between p-6 rounded-3xl bg-slate-50 border border-white">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Current Plan</p>
                        <p className="text-2xl font-black text-slate-900">{profile?.plan === 'pro' ? 'Freelancer Pro' : 'Free Basic'}</p>
                      </div>
                      <ClayBadge variant={profile?.plan === 'pro' ? 'success' : 'info'}>
                        {profile?.plan === 'pro' ? 'Active' : 'Limited'}
                      </ClayBadge>
                   </div>

                   {profile?.plan !== 'pro' && (
                     <ClayCard className="p-8 bg-gradient-to-br from-primary to-accent border-none text-white space-y-6">
                        <div className="space-y-2">
                           <h3 className="text-2xl font-black tracking-tighter">Go Unlimited</h3>
                           <p className="text-white/80 font-medium">Unlock CRM Pipeline, Pitch Analysis, and unlimited proposals.</p>
                        </div>
                        <ClayButton className="w-full h-14 bg-white text-primary hover:bg-slate-50 text-lg shadow-xl" onClick={() => router.push('/dashboard')}>
                          Upgrade Now — $12/mo
                        </ClayButton>
                     </ClayCard>
                   )}
                </div>
              </ClayCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ')
}
